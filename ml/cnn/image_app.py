from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import os
import json
import time

# Limit TensorFlow CPU threads
tf.config.threading.set_intra_op_parallelism_threads(1)
tf.config.threading.set_inter_op_parallelism_threads(1)

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

MODEL_PATH = os.path.join(
    HERE,
    "mobilenetv2_wound_model.keras"
)

ENV_PATH = os.path.join(HERE, ".env")

load_dotenv(ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = "gemini-3.8-flash"


# --------------------------------
# 2. Load MobileNetV2 model
# --------------------------------

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"CNN model not found: {MODEL_PATH}"
    )

model = tf.keras.models.load_model(MODEL_PATH, compile=False)
# Warm up MobileNetV2 once during startup
dummy_image = np.zeros(
    (1, 224, 224, 3),
    dtype=np.float32
)

_ = model(dummy_image, training=False)

print("MobileNetV2 warm-up completed!")

print("MobileNetV2 loaded successfully!")


# --------------------------------
# 3. Connect Gemini
# --------------------------------

gemini_client = None

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )
    print("Gemini API client initialized!")
else:
    print("Warning: Gemini API key not found!")


# --------------------------------
# 4. Home route
# --------------------------------

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "FitNect CNN API is running",
        "cnn_model": "MobileNetV2",
        "gemini_connected": gemini_client is not None
    })


# --------------------------------
# 5. Image prediction route
# --------------------------------

@app.route("/predict-image", methods=["POST"])
def predict_image():
    app.logger.warning("[STAGE 1] Image request received")
    # Check uploaded image
    if "image" not in request.files:

        return jsonify({
            "success": False,
            "error": "Please upload an image"
        }), 400

    file = request.files["image"]

    if not file.filename:

        return jsonify({
            "success": False,
            "error": "No image selected"
        }), 400

    if not GEMINI_API_KEY or gemini_client is None:

        return jsonify({
            "success": False,
            "error": "Gemini API key is not configured"
        }), 503

    # Check file extension
    filename = file.filename.lower()

    if not filename.endswith((".jpg", ".jpeg", ".png")):

        return jsonify({
            "success": False,
            "error": "Only JPG and PNG images are allowed"
        }), 400

    try:

        # Read image
        image_bytes = file.read()
        app.logger.warning("[STAGE 2] Image received. Size: %s bytes",len(image_bytes))

        if not image_bytes:

            return jsonify({
                "success": False,
                "error": "Empty image file"
            }), 400

        # Check actual image format
        if image_bytes.startswith(b"\xff\xd8\xff"):
            mime_type = "image/jpeg"

        elif image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            mime_type = "image/png"

        else:

            return jsonify({
                "success": False,
                "error": "Invalid image file"
            }), 400

        # --------------------------------
        # 6. Decode image
        # --------------------------------

        image = tf.io.decode_image(
            image_bytes,
            channels=3,
            expand_animations=False
        )

        # Check minimum image dimensions
        height = int(tf.shape(image)[0].numpy())
        width = int(tf.shape(image)[1].numpy())

        if height < 100 or width < 100:

            return jsonify({
                "success": False,
                "error": "Image resolution is too low"
            }), 400

        # --------------------------------
        # 7. Prepare image for MobileNetV2
        # --------------------------------

        image = tf.image.resize(
            image,
            (224, 224)
        )

        image = tf.keras.applications.mobilenet_v2.preprocess_input(
            image
        )

        image = np.expand_dims(
            image.numpy(),
            axis=0
        )
        
        # --------------------------------
        # 8. MobileNetV2 prediction
        # --------------------------------

        app.logger.warning(
            "[STAGE 3] Starting MobileNetV2 inference"
        )

        start_time = time.time()

        # Run prediction only once
        raw_prediction = model.predict(
            image,
            training=False).numpy()

        prediction = float(raw_prediction.reshape(-1)[0])

        if prediction >= 0.5:
            label = "Wound"
            confidence = prediction * 100
        else:
            label = "Normal"
            confidence = (1 - prediction) * 100

        app.logger.warning(
            "[STAGE 4] MobileNetV2 completed in %.2f seconds",
            time.time() - start_time
        )

        # --------------------------------
        # 9. Gemini image validation
        # --------------------------------

        prompt = f"""
        You are an image validation and explanation assistant
        for the FitNect sports injury image analysis application.

        The CNN prediction is: {label}
        CNN model score: {confidence:.2f} percent.

        Examine the uploaded image carefully.

        IMPORTANT IMAGE ANALYSIS RULES:
        - Describe only features clearly visible in the uploaded image.
        - Never invent bruises, cuts, swelling, redness or bleeding.
        - If no obvious injury is visible, explicitly say:
          "No obvious visible wound or bruising is observed."
        - Do not contradict the uploaded image.
        - If CNN predicts Normal, do not invent an injury.
        - Do not infer hidden injuries from a normal photograph.
        - Do not claim that an injury exists without visible evidence.

        CURRENT MODEL SUPPORTED REGION:
        Human feet and lower limbs only.

        VALID IMAGE:
        - A real photograph of a human foot or lower leg.
        - The image must be sufficiently clear to inspect.

        INVALID IMAGE:
        - Food, animals, pets, scenery or unrelated objects.
        - Drawings, cartoons, screenshots or diagrams.
        - Arm, hand, face or other unsupported body parts.
        - Very blurry, very dark, obstructed or unclear images.
        - Images where the relevant body part cannot be identified.

        Return ONLY valid JSON in this exact format:

        {{
            "is_valid": true,
            "reason": "",
            "body_part": "foot",
            "visible_description": "Brief description of visible features",
            "explanation": "Simple explanation of the CNN result",
            "care_suggestions": [
                "General care suggestion 1",
                "General care suggestion 2"
            ]
        }}

        If the image is invalid:
        - Set is_valid to false.
        - Explain the reason briefly.
        - Do not provide an injury prediction.

        If the image is valid:
        - Preserve the CNN prediction exactly.
        - Explain the result cautiously.
        - Give general, conservative care suggestions.
        - Do not diagnose a medical condition.
        - Do not predict mild, moderate or severe injury.
        - Do not predict recovery time.
        - Do not describe CNN confidence as medical certainty.

        A photograph alone cannot establish injury severity.
        Recommend professional assessment when appropriate.
        """
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
        app.logger.warning("[STAGE 6] Gemini completed in %.2f seconds",time.time() - gemini_start)

        # --------------------------------
        # 10. Read Gemini response
        # --------------------------------

        if not gemini_response.text:

            return jsonify({
                "success": False,
                "error": "Gemini returned an empty response"
            }), 502

        gemini_result = json.loads(
            gemini_response.text
        )

        # Reject invalid or unsupported images
        if gemini_result.get("is_valid") is not True:

            return jsonify({
                "success": False,
                "error": "Invalid or unsupported image",
                "message": gemini_result.get(
                    "reason",
                    "Please upload a clear foot or lower-limb image."
                )
            }), 400

        # --------------------------------
        # 11. Prepare final response
        # --------------------------------

        if label == "Normal":

            visible_description = (
                "No wound was detected by the image classifier."
            )

            explanation = (
                "The image classifier categorized this image as Normal. "
                "This does not guarantee that the foot is injury-free. "
                "Seek medical assessment if you experience pain, "
                "swelling, bruising or difficulty walking."
            )

            care_suggestions = [
                "No injury-specific care is indicated by this classification.",
                "Consult a healthcare professional if symptoms are present."
            ]

        else:

            visible_description = gemini_result.get(
                "visible_description", ""
            )

            explanation = gemini_result.get(
                "explanation", ""
            )

            care_suggestions = gemini_result.get(
                "care_suggestions", []
            )

        # --------------------------------
        # 12. Final API response
        # --------------------------------

        return jsonify({

            "success": True,

            "prediction": label,

            "confidence": round(confidence, 2),

            "body_part": gemini_result.get(
                "body_part", "lower_limb"
            ),

            "visible_description": visible_description,

            "gemini_explanation": explanation,

            "care_suggestions": care_suggestions,

            "disclaimer": (
                "AI image classification is not a medical diagnosis. "
                "Model confidence does not indicate injury severity."
            )

        }), 200

    except Exception as e:
        app.logger.exception("Image prediction failed")

        return jsonify({"success": False,"error": str(e)}), 500
    
@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "success": False,
        "error": "Image is too large. Maximum size is 8 MB."}), 413

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5001))

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False,
        use_reloader=False
    )
