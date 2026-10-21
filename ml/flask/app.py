from flask import Flask, request, jsonify
import os
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(
    os.path.join(HERE, "..", "severe_injury_model.joblib")
)

print("Model path:", MODEL_PATH)
print("File exists:", os.path.exists(MODEL_PATH))

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file nahi mili: {MODEL_PATH}"
    )

saved = joblib.load(MODEL_PATH)

LR_MODEL = saved["lr"]
HGB_MODEL = saved["hgb"]
FEATURES = saved["features"]

REQUIRED = [
    "heart_rate",
    "stress_level",
    "hydration_level",
    "sleep_quality",
    "recovery_score",
    "step_count",
    "training_load",
    "training_intensity",
    "training_duration",
    "fatigue_index",
    "sport_type",
    "gender",
    "age",
    "bmi",
]
OPTIONAL = [
    "cadence",
    "jump_height",
    "playing_surface",
    "body_temperature",
    "gait_speed",
]

NUMERIC_FIELDS = [
    "heart_rate",
    "stress_level",
    "hydration_level",
    "sleep_quality",
    "recovery_score",
    "step_count",
    "training_load",
    "training_intensity",
    "training_duration",
    "fatigue_index",
    "age",
    "bmi",
    "cadence",
    "jump_height",
    "playing_surface",
    "body_temperature",
    "gait_speed",
]

SPORT_MAP = {
    "Basketball": 0,
    "Other": 1,
    "Soccer": 2,
    "Track": 3,
}


def prepare_input(data):
    if not isinstance(data, dict):
        raise ValueError("Request body JSON object hona chahiye.")

    missing = [
        field for field in REQUIRED
        if field not in data or data[field] is None
        or data[field] == ""
    ]

    if missing:
        raise ValueError(
            "Required fields missing: " + ", ".join(missing)
        )

    row = {}
    for field in REQUIRED:
        if field in NUMERIC_FIELDS:
            try:
                value = float(data[field])
                if not np.isfinite(value):
                    raise ValueError()
                row[field] = value
            except (TypeError, ValueError):
                raise ValueError(
                    f"{field} mein valid numeric value do."
                )

    for field in OPTIONAL:
        value = data.get(field)

        if value is None or value == "":
            row[field] = np.nan
        elif field in NUMERIC_FIELDS:
            try:
                value = float(value)
                if not np.isfinite(value):
                    raise ValueError()
                row[field] = value
            except (TypeError, ValueError):
                raise ValueError(
                    f"{field} mein valid numeric value do, "
                    "ya field ko omit kar do."
                )

    sport = str(data["sport_type"]).strip()
    if sport not in SPORT_MAP:
        raise ValueError(
            "sport_type must be one of: "
            + ", ".join(SPORT_MAP.keys())
        )

    gender = str(data["gender"]).strip().lower()
    if gender not in ["male", "female"]:
        raise ValueError("gender 'Male' ya 'Female' hona chahiye.")

    row["sport"] = SPORT_MAP[sport]
    row["male"] = 1 if gender == "male" else 0

    X_input = pd.DataFrame([row]).reindex(columns=FEATURES)

    return X_input


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Athlete Severe Injury Risk API is running",
        "method": "POST",
        "prediction_endpoint": "/predict",
        "required_features": REQUIRED,
        "optional_features": OPTIONAL,
        "model_features": FEATURES,
        "threshold": 0.5
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)

        if data is None:
            return jsonify({
                "error": "Valid JSON body bhejo."
            }), 400

        X_input = prepare_input(data)

        lr_prob = LR_MODEL.predict_proba(X_input)[:, 1][0]
        hgb_prob = HGB_MODEL.predict_proba(X_input)[:, 1][0]

        severe_prob = float((lr_prob + hgb_prob) / 2)
        alert = int(severe_prob >= 0.5)

        if severe_prob < 0.4:
            risk_level = "Low"
        elif severe_prob < 0.7:
            risk_level = "Medium"
        else:
            risk_level = "High"

        return jsonify({
            "prediction": (
                "Severe Injury Risk"
                if alert == 1
                else "No Severe Injury Alert"
            ),
            "severe_risk_probability": round(severe_prob, 4),
            "severe_risk_percent": round(severe_prob * 100, 2),
            "risk_level": risk_level,
            "alert": alert,
            "threshold": 0.5,
            "history_available": False
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        app.logger.exception("Prediction failed")
        return jsonify({
            "error": "Prediction failed. Check model preprocessing.",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
