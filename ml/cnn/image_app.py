from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import os
import json
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

app = Flask(__name__)

# Maximum upload size: 8 MB
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

# --------------------------------
# 1. Paths and configuration
# --------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, "mobilenetv2_wound_model.tflite")
ENV_PATH = os.path.join(HERE, ".env")

load_dotenv(ENV_PATH)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.8-flash"

# Limit TensorFlow CPU threads (must be set before TensorFlow operations)
try:
    tf.config.threading.set_intra_op_parallelism_threads(1)
    tf.config.threading.set_inter_op_parallelism_threads(1)
except RuntimeError:
    app.logger.warning("TensorFlow thread limits could not be changed (runtime already initialized).")

# --------------------------------
# 2. Load TFLite model
# --------------------------------
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"TFLite model not found: {MODEL_PATH}. Convert the .keras model first."
    )

app.logger.warning("Loading TFLite model: %s", MODEL_PATH)

interpreter = tf.lite.Interpreter(
    model_path=MODEL_PATH,
    num_threads=1
)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

INPUT_INDEX = input_details[0]["index"]
OUTPUT_INDEX = output_details[0]["index"]
INPUT_SHAPE = input_details[0]["shape"]
INPUT_DTYPE = input_details[0]["dtype"]
OUTPUT_DTYPE = output_details[0]["dtype"]

# Expected image input: (1, 224, 224, 3)
if len(INPUT_SHAPE) != 4 or tuple(INPUT_SHAPE[1:]) != (224, 224, 3):
    raise ValueError(
        f"Unexpected TFLite input shape {INPUT_SHAPE}; expected (1, 224, 224, 3)."
    )

# Warm-up once at startup
dummy = np.zeros(tuple(INPUT_SHAPE), dtype=INPUT_DTYPE)
if np.issubdtype(INPUT_DTYPE, np.floating):
    dummy.fill(0.0)
else:
    scale, zero_point = input_details[0]["quantization"]
    dummy.fill(zero_point)

interpreter.set_tensor(INPUT_INDEX, dummy)
interpreter.invoke()
app.logger.warning("TFLite model loaded and warm-up completed!")

# --------------------------------
# 3. Connect Gemini
# --------------------------------
gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    app.logger.warning("Gemini API client initialized!")
else:
    app.logger.warning("Gemini API key not found!")

# --------------------------------
# 4. Home route
# --------------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "FitNect CNN API is running",
        "cnn_model": "MobileNetV2 TFLite",
        "gemini_connected": gemini_client is not None
    })

# --------------------------------
# 5. Image prediction route
# --------------------------------
@app.route("/predict-image", methods=["POST"])
def predict_image():
    app.logger.warning("[STAGE 1] Image request received")

    if "image" not in request.files:
        return jsonify({"success": False, "error": "Please upload an image"}), 400

    file = request.files["image"]
    if not file.filename:
        return jsonify({"success": False, "error": "No image selected"}), 400

    filename = file.filename.lower()
    if not filename.endswith((".jpg", ".jpeg", ".png")):
        return jsonify({
            "success": False,
            "error": "Only JPG and PNG images are allowed"
        }), 400

    try:
        # Read and validate image bytes
        image_bytes = file.read()
        app.logger.warning(
            "[STAGE 2] Image received. Size: %s bytes", len(image_bytes)
        )

        if not image_bytes:
            return jsonify({"success": False, "error": "Empty image file"}), 400

        if image_bytes.startswith(b"\xff\xd8\xff"):
            mime_type = "image/jpeg"
        elif image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            mime_type = "image/png"
        else:
            return jsonify({"success": False, "error": "Invalid image file"}), 400

        # Decode and preprocess exactly as the original model pipeline
        image = tf.io.decode_image(
            image_bytes, channels=3, expand_animations=False
        )
        height = int(tf.shape(image)[0].numpy())
        width = int(tf.shape(image)[1].numpy())

        if height < 100 or width < 100:
            return jsonify({
                "success": False,
                "error": "Image resolution is too low"
            }), 400

        image = tf.image.resize(image, (224, 224))
        image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
        image = image.numpy().astype(np.float32)
        image = np.expand_dims(image, axis=0)

        # --------------------------------
        # 6. TFLite prediction
        # --------------------------------
        app.logger.warning("[STAGE 3] Starting MobileNetV2 TFLite inference")
        inference_start = time.time()

        # Handle float or quantized model input
        if np.issubdtype(INPUT_DTYPE, np.floating):
            tflite_input = image.astype(INPUT_DTYPE)
        else:
            scale, zero_point = input_details[0]["quantization"]
            if scale <= 0:
                raise ValueError("Invalid TFLite input quantization scale.")
            tflite_input = np.round(image / scale + zero_point)
            limits = np.iinfo(INPUT_DTYPE)
            tflite_input = np.clip(tflite_input, limits.min, limits.max)
            tflite_input = tflite_input.astype(INPUT_DTYPE)

        interpreter.set_tensor(INPUT_INDEX, tflite_input)
        interpreter.invoke()
        raw_prediction = interpreter.get_tensor(OUTPUT_INDEX)

        # Dequantize output if needed
        if not np.issubdtype(OUTPUT_DTYPE, np.floating):
            out_scale, out_zero_point = output_details[0]["quantization"]
            raw_prediction = (raw_prediction.astype(np.float32) - out_zero_point) * out_scale

        prediction = float(np.asarray(raw_prediction).reshape(-1)[0])

        # The original model is a sigmoid binary classifier:
        # score >= 0.5 => Wound, otherwise Normal.
        if prediction >= 0.5:
            label = "Wound"
            confidence = prediction * 100
        else:
            label = "Normal"
            confidence = (1 - prediction) * 100

        app.logger.warning(
            "[STAGE 4] TFLite inference completed in %.2f seconds",
            time.time() - inference_start
        )

        # --------------------------------
        # 7. Gemini image validation
        # --------------------------------
        gemini_result = None
        gemini_available = False

        if gemini_client is not None:
            try:
                app.logger.warning("[STAGE 5] Starting Gemini image analysis")
                gemini_start = time.time()

                gemini_response = gemini_client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=[
                        prompt,
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type
                        )
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )

                if gemini_response.text:
                    gemini_result = json.loads(gemini_response.text)

                    # Check response structure
                    if not isinstance(gemini_result, dict):
                        raise ValueError("Invalid Gemini JSON response")

                    if "is_valid" not in gemini_result:
                        raise ValueError("Gemini validation field missing")

                    gemini_available = True

                    app.logger.warning(
                        "[STAGE 6] Gemini completed in %.2f seconds",
                        time.time() - gemini_start
                    )

                else:
                    app.logger.warning("Gemini returned empty response")

            except Exception as gemini_error:
                app.logger.warning(
                    "Gemini unavailable. CNN prediction will continue. "
                    "Error: %s",
                    gemini_error
                )

        else:
            app.logger.warning("Gemini API key missing. CNN prediction will continue.")

        # Reject image only when Gemini validation actually succeeded
        if gemini_available and gemini_result.get("is_valid") is not True:
            return jsonify({
                "success": False,
                "error": "Invalid or unsupported image",
                "message": gemini_result.get(
                    "reason",
                    "Please upload a clear foot or lower-limb image."
                )
            }), 400
  
        # --------------------------------
        # 8. Prepare final response
        # --------------------------------
        if label == "Normal":
            visible_description = (
                "No wound was detected by the image classifier."
            )
            explanation = (
                "The image classifier categorized this image as Normal. "
                "This does not guarantee that the foot is injury-free. "
                "Seek medical assessment if you experience pain, swelling, "
                "bruising or difficulty walking."
            )
            care_suggestions = [
                "No injury-specific care is indicated by this classification.",
                "Consult a healthcare professional if symptoms are present."
            ]

        elif gemini_available:
            visible_description = gemini_result.get(
                "visible_description",
                "A wound was detected by the image classifier."
            )
            explanation = gemini_result.get(
                "explanation",
                "The image classifier detected a possible wound."
            )
            care_suggestions = gemini_result.get(
                "care_suggestions",
                ["Consult a healthcare professional for assessment."]
            )

        else:
            visible_description = (
                "A wound was detected by the image classifier."
            )
            explanation = (
                "The CNN detected a possible wound. "
                "Gemini image analysis was unavailable, so "
                "visual validation and explanation could not be completed."
            )
            care_suggestions = [
                "Keep the affected area clean and protected.",
                "Seek professional assessment if symptoms are present."
            ]

        return jsonify({
            "success": True,
            "prediction": label,
            "confidence": round(confidence, 2),
            "body_part": (
                gemini_result.get("body_part", "lower_limb")
                if gemini_available
                else "lower_limb"
            ),
            "visible_description": visible_description,
            "gemini_explanation": explanation,
            "care_suggestions": care_suggestions,
            "gemini_available": gemini_available,
            "validation_status": (
                "validated" if gemini_available else "unverified"
            ),
            "disclaimer": (
                "AI image classification is not a medical diagnosis. "
                "Model confidence does not indicate injury severity. "
                "When validation_status is unverified, the uploaded "
                "image has not been checked by Gemini."
            )
        }), 200

    except Exception as e:
        app.logger.exception("Image prediction failed")
        return jsonify({"success": False, "error": str(e)}), 500

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "success": False,
        "error": "Image is too large. Maximum size is 8 MB."
    }), 413

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        use_reloader=False
    )
