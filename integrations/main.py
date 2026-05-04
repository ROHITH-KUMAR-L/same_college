from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
from dotenv import load_dotenv
import io

# Load env before imports that might need it
load_dotenv()

from agents.study_assistant import run_study_assistant
from agents.timetable_generator import run_timetable_generator
from services.sarvam import speech_to_text, text_to_speech
from knowledge_base import add_documents_to_pinecone

app = FastAPI(title="Same College - AI Engine", version="1.0", description="Microservice for AI features in Campus IQ")

# Check SARVAM_API_KEY
from services.sarvam import get_api_key
print(f"DEBUG: Sarvam API Key loaded: {bool(get_api_key())}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/api/v1/voice/stt")
async def voice_stt(file: UploadFile = File(...)):
    content = await file.read()
    text = await speech_to_text(content)
    return {"text": text}

class TTSRequest(BaseModel):
    text: str

@app.post("/api/v1/voice/tts")
async def voice_tts(request: TTSRequest):
    audio_b64 = await text_to_speech(request.text)
    return {"audio": audio_b64}

@app.post("/api/v1/assistant/voice-chat")
async def voice_chat(file: UploadFile = File(...)):
    print(f"Received voice chat request: {file.filename}, content_type: {file.content_type}")
    # 1. Audio to Text
    content = await file.read()
    print(f"Audio content size: {len(content)} bytes")
    
    user_text = await speech_to_text(content)
    print(f"Transcription result: {user_text}")
    
    if not user_text:
        return {"error": "Could not transcribe audio. Please speak clearly or check API status."}
    
    # 2. Get AI Response (Website Mode)
    ai_response_text = await run_study_assistant(user_text, "website_assistant")
    
    # 3. Text to Audio
    ai_audio_b64 = await text_to_speech(ai_response_text)
    
    return {
        "user_text": user_text,
        "ai_response": ai_response_text,
        "ai_audio": ai_audio_b64
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
