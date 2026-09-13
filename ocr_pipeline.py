import os
import re
import glob
import random
import cv2
import easyocr
from ultralytics import YOLO

# 1. Resolve absolute paths dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "runs", "detect", "train-3", "weights", "best.pt")

# Fallback path if custom trained model is in root or default weights are used
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(BASE_DIR, "best.pt")
    if not os.path.exists(MODEL_PATH):
        MODEL_PATH = os.path.join(BASE_DIR, "yolov8n.pt")

print(f"📦 Loading YOLOv8 model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# 2. Initialize EasyOCR Reader globally once to save memory
print("👁️ Initializing EasyOCR Reader...")
reader = easyocr.Reader(['en'], gpu=False)

def preprocess_roi(roi):
    """
    Preprocess cropped image regions to improve OCR clarity on low-res/blurry text.
    """
    if roi is None or roi.size == 0:
        return roi

    # 1. Upscale cropped region (3x) for higher resolution text
    h, w = roi.shape[:2]
    roi_large = cv2.resize(roi, (w * 3, h * 3), interpolation=cv2.INTER_CUBIC)

    # 2. Convert to Grayscale
    gray = cv2.cvtColor(roi_large, cv2.COLOR_BGR2GRAY)

    # 3. Enhance Contrast using CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    return enhanced

def clean_extracted_text(label, text):
    """
    Clean and format OCR output using Regex.
    """
    text = text.strip()

    if label == "name":
        # Remove numbers and noise symbols (@, :, ;, |, etc.)
        clean_name = re.sub(r'[^a-zA-Z\s]', '', text)
        # Collapse multiple spaces into one
        return re.sub(r'\s+', ' ', clean_name).strip()

    elif label == "dob":
        # Extract date pattern DD/MM/YYYY or DD-MM-YYYY
        match = re.search(r'\d{2}[/\-]\d{2}[/\-]\d{4}', text)
        return match.group(0) if match else text

    elif label == "gender":
        # Standardize Male/Female
        if re.search(r'\b(Male|MALE|Male/Male)\b', text, re.IGNORECASE):
            return "Male"
        elif re.search(r'\b(Female|FEMALE)\b', text, re.IGNORECASE):
            return "Female"
        return text

    elif label in ["aadhaar_no", "aadhaar_number", "id_number"]:
        # Extract digits and format into standard 4-digit groups (FULL NUMBER)
        digits = re.sub(r'\D', '', text)
        if len(digits) >= 12:
            digits = digits[:12]
            # Send the complete number to the frontend like: 1234 5678 9012
            return f"{digits[:4]} {digits[4:8]} {digits[8:]}"
        return digits

    return text

def process_document(image_path):
    """
    Runs YOLOv8 detection and EasyOCR pipeline on the given image path.
    Returns a dictionary of cleaned key-value fields.
    """
    img = cv2.imread(image_path)
    if img is None:
        print(f"❌ Error: Could not load image at {image_path}")
        return {}

    # Run YOLOv8 detection
    results = model(image_path)[0]
    extracted_data = {}

    print("\n" + "=" * 40)
    print("🔍 EXTRACTING FIELD DATA VIA ENHANCED OCR")
    print("=" * 40)

    for box in results.boxes:
        cls_id = int(box.cls[0])
        label = model.names[cls_id]

        # Skip full document bounding box if detected
        if label.lower() in ["aadhaar", "document", "card"]:
            continue

        # Bounding box coordinates
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        # Crop ROI (Region of Interest)
        cropped_roi = img[y1:y2, x1:x2]

        # Apply image preprocessing
        processed_roi = preprocess_roi(cropped_roi)

        # Pass clean ROI to EasyOCR
        ocr_result = reader.readtext(processed_roi, detail=0)
        raw_text = " ".join(ocr_result)

        # Clean text
        cleaned_text = clean_extracted_text(label, raw_text)

        # Save extracted data
        if cleaned_text:
            extracted_data[label] = cleaned_text

            # Provide alias mapping for React frontend UI
            if label in ["aadhaar_no", "aadhaar_number"]:
                extracted_data["id_number"] = cleaned_text

            print(f"📌 {label.upper():<12}: {cleaned_text}")

    print("=" * 40 + "\n")
    return extracted_data

if __name__ == "__main__":
    # Test on dataset or local image
    search_pattern = os.path.join(BASE_DIR, "dataset", "**", "*.jpg")
    test_images = glob.glob(search_pattern, recursive=True)

    if not test_images:
        test_images = glob.glob(os.path.join(BASE_DIR, "*.jpg")) + glob.glob(os.path.join(BASE_DIR, "*.png"))

    if test_images:
        sample_image = random.choice(test_images)
        print(f"🖼️ Running standalone test on: {sample_image}")
        process_document(sample_image)
    else:
        print("❌ No test images found!")