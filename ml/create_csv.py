import pandas as pd
from pathlib import Path

DATASET_DIR = Path("Wound Image Dataset")

extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

rows = []

folders = {
    "Nomal": "normal",
    "wound_main": "wound",
    "wound_mask": "mask"}

for folder, category in folders.items():

    folder_path = DATASET_DIR / folder

    for img in folder_path.rglob("*"):

        if img.is_file() and img.suffix.lower() in extensions:
            rows.append({"image_name": img.name,"image_path": str(img.resolve()),"category": category,"injury_type": "",
                "severity": ""})

df = pd.DataFrame(rows)

df.to_csv("wound_image_metadata.csv", index=False)

print("CSV created successfully!")
print("\nImage counts:")
print(df["category"].value_counts())
print("\nTotal images:", len(df))
