import requests
import os
import time

API_BASE = "https://fitnect-cnn-api.onrender.com"

API_URL = API_BASE + "/predict-image"

IMAGE_PATH = r"C:\Users\rekha\OneDrive\Desktop\New folder\fitnect\ml\cnn\images (1).jpg"

# Step 1: Check image
if not os.path.exists(IMAGE_PATH):
    print("Image not found!")
    raise SystemExit

print("Testing image:", IMAGE_PATH)

try:
    # Step 2: Wake up / check Render service
    print("\nChecking Render CNN service...")

    start = time.time()

    health = requests.get(
        API_BASE + "/",
        timeout=(20, 180)
    )

    print("Home Status:", health.status_code)
    print("Home Response:", health.text)
    print("Home Time:", round(time.time() - start, 2), "seconds")

    health.raise_for_status()

    # Step 3: Upload image
    print("\nUploading image for prediction...")

    start = time.time()

    with open(IMAGE_PATH, "rb") as image:

        response = requests.post(
            API_URL,
            files={
                "image": (
                    os.path.basename(IMAGE_PATH),
                    image,
                    "image/jpeg"
                )
            },
            timeout=(30, 300)
        )

    print("\nPrediction Status:", response.status_code)
    print("Prediction Time:", round(time.time() - start, 2), "seconds")

    try:
        print("API Response:", response.json())
    except ValueError:
        print("API Response:", response.text)

except requests.exceptions.Timeout:
    print("\nRequest timed out!")
    print("Check Render logs for worker timeout or memory issues.")

except requests.exceptions.ConnectionError as e:
    print("\nConnection error:", str(e))

except Exception as e:
    print("\nError:", str(e))
