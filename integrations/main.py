from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
from dotenv import load_dotenv
import io

# Load env before imports that might need it
load_dotenv()

from agents.study_assistant import run_study_assistant
from agents.timetable_generator import run_timetable_generator
from knowledge_base import add_documents_to_pinecone

app = FastAPI(title="Same College - AI Engine", version="1.0", description="Microservice for AI features in Campus IQ")

class ChatRequest(BaseModel):
    student_id: str
    message: str
    context_mode: str = "normal"

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Engine API"}

@app.post("/api/v1/assistant/chat")
async def chat_with_assistant(request: ChatRequest):
    response = await run_study_assistant(request.message, request.context_mode)
    return {"response": response}

@app.post("/api/v1/knowledge/upload")
async def upload_syllabus(file: UploadFile = File(...)):
    content = await file.read()
    # In a real app, use PyPDF2 or pdfplumber to extract text. 
    # For now, we try to decode if it's text, or mock it if it fails.
    try:
        text = content.decode('utf-8')
    except:
        text = f"[Mock PDF Content for {file.filename}]: This syllabus covers all advanced computing topics."
        
    try:
        add_documents_to_pinecone(texts=[text], metadatas=[{"filename": file.filename}])
        return {"status": "success", "message": f"{file.filename} indexed successfully for Same College."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class TimetableRequest(BaseModel):
    branch: str
    semester: str
    sem_type: str
    subjects: List[Dict[str, Any]]
    faculty_data: List[Dict[str, Any]]

@app.post("/api/v1/timetable/generate")
async def generate_timetable(request: TimetableRequest):
    result = await run_timetable_generator({
        "branch": request.branch,
        "semester": request.semester,
        "subjects": request.subjects,
        "faculty_data": request.faculty_data
    })
    if isinstance(result, dict) and "error" in result:
        return {"success": False, "error": result["error"]}
    return {"success": True, "data": {"timetable": result}}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
