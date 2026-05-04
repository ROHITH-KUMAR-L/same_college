import os
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

class ClassPeriod(BaseModel):
    subject_code: str = Field(description="Subject code or short name")
    faculty_name: str = Field(description="Name of the assigned professor from the available faculty data")
    start_time: str = Field(description="Start time, e.g. 09:00 AM")
    end_time: str = Field(description="End time, e.g. 10:00 AM")
    type: str = Field(description="Type of period, either 'THEORY' or 'LAB'")

class DaySchedule(BaseModel):
    day: str = Field(description="Day of the week")
    periods: List[ClassPeriod] = Field(description="List of class periods for this day")

class Timetable(BaseModel):
    schedule: List[DaySchedule] = Field(description="Full weekly schedule")

async def run_timetable_generator(faculty_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Uses Gemini Structured Output to generate a timetable based on constraints.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "GOOGLE_API_KEY is missing in the environment variables."}

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", google_api_key=api_key)
    structured_llm = llm.with_structured_output(Timetable)
    
    prompt = f"""
    You are an expert academic scheduler for Campus IQ.
    Generate a non-overlapping weekly timetable (Monday to Friday, 9 AM to 4 PM) based on the following data:
    
    COLLEGE CONTEXT:
    Branch: {faculty_data.get('branch')}
    Semester: {faculty_data.get('semester')}
    
    SUBJECTS TO ALLOCATE:
    {faculty_data.get('subjects')}
    
    AVAILABLE FACULTY:
    {faculty_data.get('faculty_data')}
    
    CONSTRAINTS & INSTRUCTIONS:
    1. Assign faculty to subjects based on their expertise. Use the 'specialisation', 'department', and 'designation' fields in the faculty data to match them with appropriate subjects.
    2. Ensure that no professor is double-booked at the same time across the entire week.
    3. The timetable should be from Monday to Friday, 9 AM to 4 PM.
    4. Each subject should meet its required 'hoursPerWeek'.
    5. It is ok to have gap periods (labeled as BREAK or empty slots).
    6. Return the schedule strictly in the requested JSON format.
    """
    
    try:
        # Generate structured timetable
        result = await structured_llm.ainvoke(prompt)
        return result.model_dump()["schedule"]
    except Exception as e:
        return {"error": str(e)}
