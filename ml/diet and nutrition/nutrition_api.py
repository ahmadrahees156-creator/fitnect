from flask import Flask, request, jsonify
from pathlib import Path
import pandas as pd

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "cleaned_nutrition" / "nutrition_api.csv"

foods = pd.read_csv(CSV_PATH)
foods = foods.where(pd.notna(foods), None)

@app.route("/foods", methods=["GET"])
def get_foods():
    query = request.args.get("search", "").strip()

    result = foods

    if query:
        result = result[result["description"].str.contains(query, case=False, na=False, regex=False)]
    result = result.head(50)

    return jsonify({
        "count": len(result),
        "foods": result.to_dict(orient="records")})

@app.route("/nutrition", methods=["GET"])
def get_nutrition():
    food_id = request.args.get("fdc_id")

    if not food_id:
        return jsonify({"error": "Please provide fdc_id"}), 400

    result = foods[foods["fdc_id"] == int(food_id)]
    result = result[
        ~result["portion_description"].astype(str).str.strip().str.casefold().eq("quantity not specified")]

    if result.empty:
        return jsonify({"error": "Food not found"}), 404

    return jsonify(result.to_dict(orient="records"))


@app.route("/meal-summary", methods=["POST"])
def meal_summary():
    data = request.get_json(silent=True) or {}
    items = data.get("items", [])

    if not isinstance(items, list) or not items:
        return jsonify({
            "error": "Please provide at least one food item"}), 400

    nutrient_cols = [
        "calories_kcal", "protein_g", "fat_g", "carbs_g"]

    totals = {col: 0.0 for col in nutrient_cols}
    meal_items = []

    for item in items:
        try:
            food_id = int(item["fdc_id"])
            grams = float(item["grams"])
        except (KeyError, TypeError, ValueError):
            return jsonify({
                "error": "Each item needs fdc_id and grams"}), 400

        if not pd.notna(grams) or grams <= 0 or grams > 5000:
            return jsonify({
                "error": "grams must be greater than 0 and at most 5000"}), 400

        result = foods[
            (foods["fdc_id"] == food_id)
            & foods["gram_weight"].notna()
            & (foods["gram_weight"] > 0)]

        if result.empty:
            return jsonify({
                "error": f"Food not found or no valid serving: {food_id}"}), 404

        ref = result.iloc[0]
        ratio = grams / ref["gram_weight"]

        nutrients = {}

        for col in nutrient_cols:
            value = ref[col]

            if pd.isna(value):
                nutrients[col] = None
            else:
                amount = float(value) * ratio
                nutrients[col] = round(amount, 2)
                totals[col] += amount

        meal_items.append({
            "fdc_id": food_id,
            "description": ref["description"],"grams": grams,**nutrients})

    return jsonify({
        "items": meal_items,
        "totals": {
            key: round(value, 2)
            for key, value in totals.items()}})

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Diet and Nutrition API is running",
        "endpoints": ["/foods?search=egg", "/nutrition?fdc_id=123","/meal-summary (POST)","/nutrition-targets (POST)"]})


@app.route("/nutrition-targets", methods=["POST"])
def nutrition_targets():
    data = request.get_json(silent=True) or {}

    required = ["age", "sex", "weight", "height", "goal"]
    missing = [field for field in required if data.get(field) is None]

    if missing:
        return jsonify({
            "error": "Missing required profile fields",
            "missing_fields": missing}), 400

    try:
        age = float(data["age"])
        weight = float(data["weight"])   
        height = float(data["height"])   
        sex = str(data["sex"]).strip().lower()
        goal = str(data["goal"]).strip().lower().replace(" ", "_")

        activity = str(
            data.get("activity_level", "light")).strip().lower().replace(" ", "_")

        if not all(map(lambda x: x == x, [age, weight, height])):
            raise ValueError("Invalid numeric values")

        if age <= 0 or weight <= 0 or height <= 0:
            return jsonify({
                "error": "Age, weight and height must be positive"}), 400

        if age < 18:
            return jsonify({
                "error": "These targets are designed for adults aged 18+"}), 400

        if sex not in ["male", "female"]:
            return jsonify({
                "error": "sex must be male or female for this equation"}), 400

        goal_aliases = {
            "build_strength": "build_strength",
            "loss_weight": "loss_weight",
            "weight_loss": "loss_weight",
            "improve_endurance": "improve_endurance"
        }

        if goal not in goal_aliases:
            return jsonify({
                "error": "Unsupported goal",
                "allowed_goals": ["build strength","loss weight","improve endurance"]}), 400

        goal = goal_aliases[goal]

        activity_factors = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "very_active": 1.725}

        if activity not in activity_factors:
            return jsonify({
                "error": "Invalid activity_level",
                "allowed_values": list(activity_factors.keys())
            }), 400

        if sex == "male":
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
        else:
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161

        maintenance_calories = bmr * activity_factors[activity]

        if goal == "build_strength":
            calories = maintenance_calories * 1.05
            protein_per_kg = 1.8
        elif goal == "loss_weight":
            calories = maintenance_calories * 0.85
            protein_per_kg = 1.8
        else: 
            calories = maintenance_calories
            protein_per_kg = 1.6

        protein_g = weight * protein_per_kg
        fat_g = (calories * 0.25) / 9
        carbs_g = (calories - (protein_g * 4) - (fat_g * 9)) / 4

        if carbs_g < 0:
            return jsonify({"error": "Unable to calculate reasonable macros for these inputs"}), 400

        return jsonify({
            "goal": goal,
            "activity_level": activity,
            "estimated_daily_targets": {
                "calories_kcal": round(calories),"protein_g": round(protein_g),"carbs_g": round(carbs_g),
                "fat_g": round(fat_g)},
            "estimated_maintenance_calories_kcal": round(maintenance_calories),
            "method": "Mifflin-St Jeor with activity and goal adjustments",
            "note": (
                "These are estimates, not medical advice"
                "Actual needs depend on training, health and individual response")})

    except (ValueError, TypeError):
        return jsonify({
            "error": "Please provide valid numeric age, weight and height"}), 400

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
