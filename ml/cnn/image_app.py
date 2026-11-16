import os
import io
import json
import base64
import logging
import threading
from typing import Any, Dict

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Gemini (primary) + Groq (backup)
from google import genai
from google.genai import types
from groq import Groq

# TensorFlow Lite interpreter is provided by TensorFlow (avoid tflite-runtime
# compatibility issues on Python 3.13/Render).
import tensorflow as tf

# ------------------------------------------------------------
# Setup
# ------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fitnect-image-api")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

MODEL_PATH = os.path.join(BASE_DIR, "mobilenetv2_wound_model.tflite")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b").strip()

# Gemini primary - 8 seconds timeout
gemini_client = (
    genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=8000)
    )
    if GEMINI_API_KEY else None
)

# Groq backup - 12 seconds timeout
groq_client = (
    Groq(
        api_key=GROQ_API_KEY,
        timeout=12.0,
        max_retries=0
    )
    if GROQ_API_KEY else None
)


# ------------------------------------------------------------
# Load CNN model
# ------------------------------------------------------------
interpreter = None
input_details = None
output_details = None
cnn_lock = threading.Lock()

try:
    if os.path.exists(MODEL_PATH):
        interpreter = tf.lite.Interpreter(model_path=MODEL_PATH, num_threads=2)
        interpreter.allocate_tensors()
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        logger.info("MobileNetV2 TFLite model loaded: %s", MODEL_PATH)
    else:
        logger.error("TFLite model not found: %s", MODEL_PATH)
except Exception:
    logger.exception("Could not load TFLite model")


@app.get("/")
def health():
    return jsonify({
        "message": "FitNect CNN API is running",
        "cnn_model": interpreter is not None,
        "gemini_connected": gemini_client is not None,
        "groq_connected": groq_client is not None,
    })


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def safe_json_from_text(text: str) -> Dict[str, Any]:
    """Parse JSON even if a provider wraps it in ```json fences."""
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text[:-3].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start:end + 1])
        raise


def normalize_image(file_bytes: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(file_bytes))
    image = ImageOps.exif_transpose(image).convert("RGB")
    if image.width < 80 or image.height < 80:
        raise ValueError("Image is too small. Please upload a clearer image.")
    return image


def cnn_predict(image: Image.Image):
    if interpreter is None:
        raise RuntimeError("CNN model is not loaded.")

    input_shape = input_details[0]["shape"]
    height, width = int(input_shape[1]), int(input_shape[2])
    resized = image.resize((width, height))
    arr = np.asarray(resized, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)

    with cnn_lock:
        interpreter.set_tensor(input_details[0]["index"], arr)
        interpreter.invoke()
        raw = interpreter.get_tensor(output_details[0]["index"])

    values = np.asarray(raw).reshape(-1)
    # Binary sigmoid output: one value means wound probability.
    if values.size == 1:
        wound_probability = float(values[0])
        if wound_probability < 0 or wound_probability > 1:
            wound_probability = float(1.0 / (1.0 + np.exp(-wound_probability)))
        label = "Wound" if wound_probability >= 0.5 else "Normal"
        confidence = wound_probability if label == "Wound" else 1.0 - wound_probability
    else:
        # Two-class softmax output: index 0=Normal, index 1=Wound.
        probabilities = values.astype(float)
        if np.any(probabilities < 0) or not np.isclose(probabilities.sum(), 1.0, atol=0.05):
            exp = np.exp(probabilities - np.max(probabilities))
            probabilities = exp / exp.sum()
        class_index = int(np.argmax(probabilities))
        label = "Wound" if class_index == 1 else "Normal"
        confidence = float(probabilities[class_index])

    return label, round(max(0.0, min(1.0, confidence)) * 100, 2)


PROMPT = """
Analyze the attached image for FitNect's image-assistance feature.
Return ONLY a valid JSON object with these keys:
{
  "is_valid": true,
  "reason": "",
  "body_part": "foot/ankle/leg/arm/hand/other/unknown",
  "visible_description": "short description of visible appearance only",
  "explanation": "careful, non-diagnostic explanation",
  "care_suggestions": ["suggestion 1", "suggestion 2"]
}
Rules:
- If image is not a clear human body/injury-related image (food, animal, scenery,
  unrelated object, or too blurry), set is_valid=false and explain briefly in reason.
- Do not claim a definite diagnosis, injury type, or medical severity from a photo.
- Describe only visible features; do not infer internal injury.
- Advice must be conservative: avoid aggravating activity, basic hygiene, and seek
  professional assessment when needed.
- Mention urgent care for severe bleeding, rapidly increasing swelling, deformity,
  numbness, fever, or inability to bear weight/use the limb.
- Keep explanation concise and user-friendly.
"""


def normalize_provider_result(data: Dict[str, Any]) -> Dict[str, Any]:
    suggestions = data.get("care_suggestions", [])
    if isinstance(suggestions, str):
        suggestions = [suggestions]
    if not isinstance(suggestions, list):
        suggestions = []
    return {
        "is_valid": bool(data.get("is_valid", True)),
        "reason": str(data.get("reason", "") or ""),
        "body_part": str(data.get("body_part", "unknown") or "unknown"),
        "visible_description": str(data.get("visible_description", "") or ""),
        "explanation": str(data.get("explanation", "") or ""),
        "care_suggestions": [str(x) for x in suggestions[:6]],
    }


def gemini_analyze(image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    if gemini_client is None:
        raise RuntimeError("Gemini API key is not configured.")
    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            PROMPT,
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=700,
        ),
    )
    return normalize_provider_result(safe_json_from_text(response.text))


def groq_analyze(image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    if groq_client is None:
        raise RuntimeError("Groq API key is not configured.")
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT + "\nReturn JSON only."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{encoded}"
                        },
                    },
                ],
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_completion_tokens=700,
    )
    text = response.choices[0].message.content or ""
    return normalize_provider_result(safe_json_from_text(text))


def cnn_fallback(label: str) -> Dict[str, Any]:
    if label == "Wound":
        return {
            "is_valid": True,
            "reason": "",
            "body_part": "unknown",
            "visible_description": "The image classifier detected a wound-like pattern.",
            "explanation": (
                "The CNN classified this image as Wound-like. This is an image "
                "classification result, not a medical diagnosis or severity assessment. "
                "A clinician should assess the area if symptoms are present."
            ),
            "care_suggestions": [
                "Avoid activities that worsen pain or irritation.",
                "Keep the area clean and protect it from further injury.",
                "Seek medical care for worsening symptoms or concerning signs.",
            ],
        }
    return {
        "is_valid": True,
        "reason": "",
        "body_part": "unknown",
        "visible_description": "No wound-like pattern was detected by the image classifier.",
        "explanation": (
            "The CNN categorized this image as Normal. This does not guarantee "
            "that the body part is injury-free. Seek medical assessment if you "
            "have pain, swelling, bruising, or difficulty moving/using the limb."
        ),
        "care_suggestions": [
            "Do not ignore pain or other symptoms.",
            "Seek medical assessment if symptoms persist or worsen.",
        ],
    }


# ------------------------------------------------------------
# Image prediction endpoint
# ------------------------------------------------------------
@app.post("/predict-image")
def predict_image():
    uploaded = request.files.get("image")
    if uploaded is None or not uploaded.filename:
        return jsonify({"success": False, "error": "Please upload an image using field name 'image'."}), 400

    file_bytes = uploaded.read()
    if not file_bytes:
        return jsonify({"success": False, "error": "Uploaded image is empty."}), 400

    try:
        image = normalize_image(file_bytes)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        return jsonify({"success": False, "error": str(exc) or "Invalid image file."}), 400

    mime_type = uploaded.mimetype or "image/jpeg"
    try:
        prediction, confidence = cnn_predict(image)
    except Exception as exc:
        logger.exception("CNN prediction failed")
        return jsonify({"success": False, "error": "CNN prediction failed. Check model file and preprocessing."}), 500

    # Gemini primary -> Groq backup -> CNN fallback
    analysis = None
    provider = "cnn_fallback"
    gemini_available = False
    groq_available = False

    if gemini_client:
        try:
            analysis = gemini_analyze(file_bytes, mime_type)
            provider = "gemini"
            gemini_available = True
            logger.info("Image explanation completed using Gemini")
        except Exception as exc:
            logger.warning("Gemini analysis failed; trying Groq backup: %s", exc)

    if analysis is None and groq_client:
        try:
            analysis = groq_analyze(file_bytes, mime_type)
            provider = "groq"
            groq_available = True
            logger.info("Image explanation completed using Groq backup")
        except Exception as exc:
            logger.warning("Groq analysis failed; using CNN fallback: %s", exc)

    if analysis is None:
        analysis = cnn_fallback(prediction)

    # If provider marks image invalid, do not present a misleading wound/normal explanation.
    if not analysis.get("is_valid", True):
        return jsonify({
            "success": True,
            "prediction": "Invalid Image",
            "confidence": 0,
            "body_part": analysis.get("body_part", "unknown"),
            "visible_description": analysis.get("visible_description", ""),
            "gemini_explanation": analysis.get("reason") or "Please upload a clear image of a human body part or injury.",
            "care_suggestions": [],
            "gemini_available": gemini_available,
            "groq_available": groq_available,
            "explanation_provider": provider,
            "validation_status": "invalid",
            "disclaimer": "AI image output is not a medical diagnosis.",
        })

    return jsonify({
        "success": True,
        "prediction": prediction,
        "confidence": confidence,
        "body_part": analysis.get("body_part", "unknown"),
        "visible_description": analysis.get("visible_description", ""),
        "gemini_explanation": analysis.get("explanation", ""),
        "care_suggestions": analysis.get("care_suggestions", []),
        "gemini_available": gemini_available,
        "groq_available": groq_available,
        "explanation_provider": provider,
        "validation_status": "verified" if provider in ("gemini", "groq") else "not_verified",
        "disclaimer": "AI image output is not a medical diagnosis. Consult a qualified healthcare professional for assessment.",
    })


@app.errorhandler(413)
def too_large(_error):
    return jsonify({"success": False, "error": "Image is too large. Maximum upload size is 10 MB."}), 413


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
