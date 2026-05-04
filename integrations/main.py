from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import uvicorn

from agents.study_assistant import run_study_assistant
from agents.timetable_generator import run_timetable_generator

app = FastAPI(title="Campus IQ - AI Engine", version="1.0", description="Microservice for AI features in Campus IQ")

class ChatRequest(BaseModel):
    student_id: str
    message: str
    context_mode: str = "normal"

@app.get("/")
def read_root():
    return {"message": "Welcome to the Campus IQ AI Engine API"}

@app.post("/api/v1/assistant/chat")
async def chat_with_assistant(request: ChatRequest):
    # Dummy integration with LangGraph agent
    response = await run_study_assistant(request.message, request.context_mode)
    return {"response": response}

@app.post("/api/v1/knowledge/upload")
async def upload_syllabus(file: UploadFile = File(...)):
    # Placeholder for PDF parsing and vector DB insertion
    return {"status": "success", "message": f"{file.filename} indexed successfully for Campus IQ."}

@app.post("/api/v1/timetable/generate")
async def generate_timetable(faculty_data: dict):
    # Placeholder for Hybrid Solver
    result = await run_timetable_generator(faculty_data)
    return {"status": "success", "timetable": result}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
