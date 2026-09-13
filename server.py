from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from ocr_pipeline import process_document

app = FastAPI(title="DocuLens OCR API")

# Allow requests from your Vite/React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/ocr")
async def extract_document_data(document: UploadFile = File(...)):
    try:
        # Save temporary file
        temp_file_path = f"temp_{document.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(document.file, buffer)

        # Run model extraction
        extracted_data = process_document(temp_file_path)

        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        return extracted_data

    except Exception as e:
        print(f"Error during OCR: {e}")
        raise HTTPException(status_code=500, detail="Failed to process document")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)