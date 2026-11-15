import os
import io
import json
import time
import logging
import threading

import numpy as np
from dotenv import load_dotenv

load_dotenv()
from PIL import Image, UnidentifiedImageError
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename

from google import genai
from google.genai import types

# Optional import used to catch transport timeout errors.
try:
    import httpx
except ImportError:
    httpx = None

try:
    from tflite_runtime.interpreter import Interpreter
except ImportError:
    # TensorFlow is a fallback for local environments where tflite_runtime
    # is not installed. On Render, install tflite-runtime if possible.
    import tensorflow as tf
    Interpreter = tf.lite.Interpreter


# ---------------------------------------------------------------------
# Flask and configuration
# ---------------------------------------------------------------------
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB

logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, "mobilenetv2_wound_model.tflite")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

# Gemini limits: one HTTP attempt gets 12 seconds; our own retry loop
# makes at most 3 attempts with short waits.
GEMINI_ATTEMPT_TIMEOUT_MS = 12000
GEMINI_TOTAL_BUDGET_S = 28
GEMINI_MAX_ATTEMPTS = 3

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_IMAGE_PIXELS = 20_000_000
IMAGE_SIZE = (224, 224)

gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=GEMINI_ATTEMPT_TIMEOUT_MS,
            retry_options=types.HttpRetryOptions(
                attempts=1,
                initial_delay=0,
                max_delay=0,
                jitter=0,
            ),
        ),
    )
    app.logger.info("Gemini API client initialized.")
else:
    app.logger.warning("GEMINI_API_KEY is not configured.")


# ---------------------------------------------------------------------
# Load TFLite model once
# ---------------------------------------------------------------------
if not os.path.isfile(MODEL_PATH):
    raise FileNotFoundError(
        f"MobileNetV2 TFLite model not found: {MODEL_PATH}"
    )

interpreter = Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

INPUT_DETAILS = interpreter.get_input_details()
OUTPUT_DETAILS = interpreter.get_output_details()
INPUT_INDEX = INPUT_DETAILS[0]["index"]
OUTPUT_INDEX = OUTPUT_DETAILS[0]["index"]
INPUT_SHAPE = INPUT_DETAILS[0]["shape"]
INPUT_DTYPE = INPUT_DETAILS[0]["dtype"]
OUTPUT_SHAPE = OUTPUT_DETAILS[0]["shape"]

interpreter_lock = threading.Lock()

app.logger.info("MobileNetV2 TFLite model loaded.")
app.logger.info("TFLite input shape: %s, dtype: %s", INPUT_SHAPE, INPUT_DTYPE)
app.logger.info("TFLite output shape: %s", OUTPUT_SHAPE)


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def allowed_file(filename):
    return (
        bool(filename)
        and "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def error_response(message, status_code=400):
    return jsonify({"success": False, "message": message}), status_code


def preprocess_image(image):
    """Resize RGB image and normalize according to the model input dtype.

    This assumes the model was trained with pixel values scaled to [0, 1].
    If your training pipeline used MobileNetV2 preprocess_input (-1 to 1),
    replace the normalization section with (arr / 127.5) - 1.0.
    """
    image = image.convert("RGB").resize(IMAGE_SIZE)
    arr = np.asarray(image, dtype=np.float32)

    if INPUT_DTYPE == np.uint8:
        arr = arr.astype(np.uint8)
    else:
        arr = arr / 255.0

    arr = np.expand_dims(arr, axis=0)

    # Respect model's actual input dimensions if they differ from 224x224.
    expected_h = int(INPUT_SHAPE[1])
    expected_w = int(INPUT_SHAPE[2])
    if arr.shape[1] != expected_h or arr.shape[2] != expected_w:
        image = image.resize((expected_w, expected_h))
        arr = np.asarray(image, dtype=np.float32)
        if INPUT_DTYPE == np.uint8:
            arr = arr.astype(np.uint8)
        else:
            arr = arr / 255.0
        arr = np.expand_dims(arr, axis=0)

    return arr


def run_cnn(image):
    tensor = preprocess_image(image)

    with interpreter_lock:
        interpreter.set_tensor(INPUT_INDEX, tensor)
        interpreter.invoke()
        output = interpreter.get_tensor(OUTPUT_INDEX).copy()

    values = np.asarray(output).astype(float).reshape(-1)
    if values.size == 0:
        raise RuntimeError("CNN returned an empty prediction.")

    # Binary sigmoid output: wound probability.
    if values.size == 1:
        wound_probability = float(values[0])
        wound_probability = min(max(wound_probability, 0.0), 1.0)
        if wound_probability >= 0.5:
            label = "Wound"
            confidence = wound_probability
        else:
            label = "Normal"
            confidence = 1.0 - wound_probability
        return label, round(confidence * 100, 2), wound_probability

    # Two-class output: assumes index 0=Normal and index 1=Wound.
    if values.size == 2:
        probs = values
        idx = int(np.argmax(probs))
        label = "Wound" if idx == 1 else "Normal"
        confidence = float(probs[idx])
        wound_probability = float(probs[1])
        return label, round(confidence * 100, 2), wound_probability

    raise RuntimeError(
        f"Unexpected model output size: {values.size}. "
        "Expected sigmoid(1) or softmax(2)."
    )


def build_gemini_prompt():
    return """
You are analyzing a user-uploaded sports injury/wound photograph for FitNect.
Analyze ONLY what is visibly present in the image. Do not diagnose, infer internal
injuries, or claim medical certainty.

First decide whether the image is a usable photo of a human body part with a
visible wound/injury or a relevant body part for injury checking. Reject scenery,
animals, food, screenshots, drawings, unrelated objects, and images where the
body part cannot be identified. A normal/uninjured body part can be valid.

Return ONLY valid JSON with exactly these keys:
{
  "is_valid": true,
  "reason": "short reason if invalid, otherwise empty",
  "body_part": "visible body part or Unknown",
  "visible_description": "brief factual description of visible appearance",
  "explanation": "short cautious explanation of what is visible; no diagnosis",
  "care_suggestions": ["practical general care suggestion", "when to seek medical care"]
}

Keep explanation concise. Never state that a wound is definitely mild/moderate/severe
or assign a medical severity grade from the photo. If there are signs such as
heavy bleeding, deep/open wound, severe swelling, deformity, or inability to
bear weight, advise urgent professional medical assessment.
"""


def call_gemini(prompt, image_bytes, mime_type):
    if gemini_client is None:
        raise RuntimeError("Gemini API key is not configured.")

    deadline = time.monotonic() + GEMINI_TOTAL_BUDGET_S
    last_error = None

    for attempt in range(1, GEMINI_MAX_ATTEMPTS + 1):
        remaining = deadline - time.monotonic()
        if remaining < 2:
            break

        try:
            app.logger.info("Gemini attempt %s/%s", attempt, GEMINI_MAX_ATTEMPTS)
            return gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                    max_output_tokens=500,
                ),
            )
        except Exception as exc:
            last_error = exc
            code = getattr(exc, "code", None)
            msg = str(exc).lower()

            is_timeout = (
                (httpx is not None and isinstance(exc, httpx.TimeoutException))
                or "timed out" in msg
                or "timeout" in msg
            )
            retryable = (
                code in (408, 429, 500, 502, 503, 504)
                or is_timeout
                or "unavailable" in msg
                or "temporarily" in msg
            )

            app.logger.warning("Gemini attempt %s failed: %s", attempt, exc)
            if not retryable or attempt >= GEMINI_MAX_ATTEMPTS:
                break

            # Short backoff, bounded by the remaining total budget.
            wait_s = min(2 * attempt, max(0, deadline - time.monotonic() - 2))
            if wait_s > 0:
                time.sleep(wait_s)

    if last_error:
        raise last_error
    raise TimeoutError("Gemini analysis time budget exhausted.")


def parse_gemini_json(response):
    text = getattr(response, "text", None)
    if not text:
        raise ValueError("Gemini returned an empty response.")
    text = text.strip()

    # Defensive removal of markdown fences, if the model unexpectedly adds them.
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text[:-3].strip()

    return json.loads(text)


def cnn_fallback(label):
    if label == "Normal":
        return (
            "No wound was detected by the image classifier.",
            "The image classifier categorized this image as Normal. "
            "This does not guarantee that the body part is injury-free. "
            "Seek medical assessment if you experience pain, swelling, bruising, "
            "or difficulty moving/using the body part.",
            [
                "Monitor the area for pain, swelling, redness, or changes.",
                "Seek medical advice if symptoms persist or worsen.",
            ],
        )

    return (
        "The image classifier detected a wound-like visual pattern.",
        "The image classifier detected a wound-like pattern. This is not a medical "
        "diagnosis and cannot determine the depth or seriousness of an injury.",
        [
            "Keep the area clean and protect it with a suitable dressing.",
            "Seek professional medical care for deep wounds, heavy bleeding, "
            "infection signs, or worsening symptoms.",
        ],
    )


# ---------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------
@app.get("/")
def home():
    return jsonify({
        "success": True,
        "message": "FitNect CNN API is running",
        "cnn_model": "MobileNetV2 TFLite",
        "gemini_connected": gemini_client is not None,
    })


@app.post("/predict-image")
def predict_image():
    started = time.monotonic()
    app.logger.info("STAGE 1: image request received")

    if "image" not in request.files:
        return error_response("Please upload an image using the 'image' field.")

    file = request.files["image"]
    if not file or not file.filename:
        return error_response("No image selected.")

    filename = secure_filename(file.filename)
    if not allowed_file(filename):
        return error_response("Only JPG, JPEG, and PNG images are supported.")

    image_bytes = file.read()
    app.logger.info("STAGE 2: uploaded image bytes=%s", len(image_bytes))

    if not image_bytes:
        return error_response("Uploaded image is empty.")
    if len(image_bytes) > 8 * 1024 * 1024:
        return error_response("Image must be smaller than 8 MB.", 413)

    # Verify image content instead of trusting its extension/MIME type.
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
    except (UnidentifiedImageError, OSError, ValueError):
        return error_response("Invalid or corrupted image file.")

    if image.width * image.height > MAX_IMAGE_PIXELS:
        return error_response("Image dimensions are too large.")

    image = image.convert("RGB")
    mime_type = "image/png" if filename.lower().endswith(".png") else "image/jpeg"

    # ---------------- CNN ----------------
    try:
        cnn_started = time.monotonic()
        label, confidence, wound_probability = run_cnn(image)
        cnn_time = time.monotonic() - cnn_started
        app.logger.info(
            "STAGE 3: TFLite inference %.3fs | prediction=%s confidence=%s",
            cnn_time, label, confidence
        )
    except Exception:
        app.logger.exception("CNN inference failed.")
        return jsonify({
            "success": False,
            "message": "Image prediction failed. Please try another image.",
        }), 500

    # Safe fallback values are prepared first. Gemini may replace them.
    body_part = "Unknown"
    visible_description, explanation, care_suggestions = cnn_fallback(label)
    gemini_available = False
    validation_status = "not_verified"

    # ---------------- Gemini ----------------
    gemini_started = time.monotonic()
    try:
        app.logger.info("STAGE 4: Gemini image analysis started")
        gemini_response = call_gemini(
            build_gemini_prompt(), image_bytes, mime_type
        )
        gemini_data = parse_gemini_json(gemini_response)

        is_valid = bool(gemini_data.get("is_valid", False))
        reason = str(gemini_data.get("reason", "")).strip()

        if not is_valid:
            validation_status = "invalid"
            app.logger.info("Gemini rejected image: %s", reason)
            return jsonify({
                "success": False,
                "prediction": label,
                "confidence": confidence,
                "body_part": "Unknown",
                "visible_description": "",
                "gemini_explanation": "",
                "care_suggestions": [],
                "gemini_available": True,
                "validation_status": "invalid",
                "message": reason or (
                    "Please upload a clear photo of a human body part."
                ),
                "disclaimer": (
                    "This tool is for informational purposes only and is not "
                    "a substitute for professional medical advice."
                ),
            }), 422

        body_part = str(gemini_data.get("body_part", "Unknown")).strip() or "Unknown"
        visible_description = str(
            gemini_data.get("visible_description", visible_description)
        ).strip() or visible_description
        explanation = str(
            gemini_data.get("explanation", explanation)
        ).strip() or explanation

        suggestions = gemini_data.get("care_suggestions", care_suggestions)
        if isinstance(suggestions, list):
            care_suggestions = [
                str(item).strip() for item in suggestions if str(item).strip()
            ][:5]
        else:
            care_suggestions = care_suggestions

        gemini_available = True
        validation_status = "valid"
        app.logger.info(
            "STAGE 5: Gemini completed in %.2fs",
            time.monotonic() - gemini_started
        )

    except Exception as exc:
        app.logger.warning(
            "Gemini unavailable after %.2fs; returning CNN fallback: %s",
            time.monotonic() - gemini_started, exc
        )
        # Intentionally do not fail the complete request. CNN output remains usable.
        gemini_available = False
        validation_status = "not_verified"

    total_time = time.monotonic() - started
    app.logger.info("STAGE 6: total request %.2fs", total_time)

    return jsonify({
        "success": True,
        "prediction": label,
        "confidence": confidence,
        "body_part": body_part,
        "visible_description": visible_description,
        "gemini_explanation": explanation,
        "care_suggestions": care_suggestions,
        "gemini_available": gemini_available,
        "validation_status": validation_status,
        "disclaimer": (
            "This tool is for informational purposes only. Image predictions "
            "and AI explanations are not medical diagnoses. Consult a qualified "
            "healthcare professional for assessment or treatment."
        ),
    }), 200


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({
        "success": False,
        "message": "Image must be smaller than 8 MB.",
    }), 413


if __name__ == "__main__":
    # Local development only. Render should use Gunicorn.
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5001")), debug=False)
