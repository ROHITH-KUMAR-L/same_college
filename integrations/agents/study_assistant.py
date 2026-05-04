import os
from typing import Dict, Any, TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
from knowledge_base import retrieve_context

load_dotenv()

class GraphState(TypedDict):
    messages: List[Any]
    mode: str
    context: str

# Node: Retrieve
def retrieve_node(state: GraphState):
    latest_msg = state["messages"][-1].content
    context_docs = retrieve_context(latest_msg)
    context_str = "\n".join(context_docs)
    return {"context": context_str}

# Node: Generate
def generate_node(state: GraphState):
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"messages": [AIMessage(content="Google API key is missing. Please set it in the .env file.")]}

    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
    
    system_prompt = "You are the Same College AI Assistant."
    if state["mode"] == "explain_like_beginner":
        system_prompt += " Explain the concepts extremely simply, using analogies."
    elif state["mode"] == "website_assistant":
        system_prompt += """
        You are an expert on the "Same College" web application.
        WEBSITE FEATURES:
        - Admin Dashboard: Admins can generate AI-powered timetables, manage resource folders (notes/papers), view system logs, and manage user roles.
        - Faculty Dashboard: Faculty can see their assigned classes (assigned by Admin), generate student enrollment links, and track attendance.
        - Student Dashboard: Students can see their personalized timetable, join classes via links, access study resources (notes/papers), and see their attendance.
        - AI Study Assistant: A specialized chat for students to ask doubts about their syllabus and previous year papers.
        - Voice Assistant: Powered by Sarvam AI (Saaras for STT, Bulbul for TTS).
        
        RULES:
        1. Keep answers concise and helpful.
        2. If asked about technical features, explain how they benefit students or faculty.
        3. Use a friendly, encouraging tone.
        4. Do not mention internal API keys or technical implementation details unless relevant to the user.
        """
    
    if state.get("context") and state["mode"] != "website_assistant":
        system_prompt += f"\nUse the following context from the syllabus to answer:\n{state['context']}"
    elif state["mode"] == "website_assistant":
        system_prompt += "\nFocus on answering questions about the website functionality."
    else:
        system_prompt += "\nAnswer the student's question based on your general knowledge."
    
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    
    response = llm.invoke(messages)
    return {"messages": [response]}

# Build Graph
workflow = StateGraph(GraphState)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()

async def run_study_assistant(message: str, mode: str) -> str:
    """
    Executes the LangGraph study assistant logic.
    """
    initial_state = {
        "messages": [HumanMessage(content=message)],
        "mode": mode,
        "context": ""
    }
    
    try:
        result = await app.ainvoke(initial_state)
        return result["messages"][-1].content
    except Exception as e:
        return f"Error connecting to AI Assistant: {str(e)}"
