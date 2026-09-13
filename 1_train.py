import os
from ultralytics import YOLO

if __name__ == '__main__':
    # Relative path to your dataset configuration file
    yaml_path = r"E:\aadhaar_ocr_project\ocr dataset\Document from Madhav Kalra~\indian doc ocr\dataset\aadhar.v5i.yolov8\data.yaml"  # adjust folder name if needed

    print(f"Loading dataset configuration from: {yaml_path}")

    # Initialize lightweight YOLOv8 nano model
    model = YOLO('yolov8n.pt')

    # Start training
    print("🚀 Starting YOLOv8 Model Training...")
    results = model.train(
    data=yaml_path,
    epochs=15,      # Reduce from 50 to 15 epochs for a quick test
    imgsz=320,      # Reduce resolution from 640 to 320 (4x faster)
    batch=8,        # Slightly larger batch
    workers=2
)

    print("✅ Training complete!")
    print("Your trained weights are saved at: runs/detect/train/weights/best.pt")
