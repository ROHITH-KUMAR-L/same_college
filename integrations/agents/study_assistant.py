import os
from typing import Dict, Any, TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
from knowledge_base import retrieve_context

load_dotenv()

# Initialize LLM (Groq)
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    api_key=os.environ.get("GROQ_API_KEY")
)

class GraphState(TypedDict):
    messages: List[Any]
    mode: str
    context: str

# Node: Retrieve
def retrieve_node(state: GraphState):
    latest_msg = state["messages"][-1].content
    try:
        context_docs = retrieve_context(latest_msg)
        context_str = "\n".join(context_docs)
    except:
        context_str = ""
    return {"context": context_str}

def get_system_prompt(mode: str, context: str):
    if mode == "website_assistant":
        return f"""You are the 'AI Guide' for the 'Same College' campus portal. 
        Your goal is to help students navigate the portal and provide information about their academic life.
        
        You have access to information about:
        1. **Attendance**: Users can track their attendance in the 'Attendance' section.
        2. **Performance**: Students can view their grades and performance metrics in the 'Dashboard' section.
        3. **Timetable**: The class schedule is managed by administrators and visible to students.
        4. **Available Files**: Notes, assignments, and study materials are shared in the 'Notes' or 'Study Materials' section.
        5. **Features**: QR-based attendance, faculty interactions, student communities, and quick study tools.
        
        WEBSITE FEATURES:
        - Admin Dashboard: Admins can generate AI-powered timetables, manage resource folders (notes/papers), view system logs, and manage user roles.
        - Faculty Dashboard: Faculty can see their assigned classes, generate student enrollment links, and track attendance.
        - Student Dashboard: Students can see their personalized timetable, join classes via links, access study resources (notes/papers), and see their attendance.
        
        CONTEXT FROM DATABASE:
        {context}
        
        Be concise, helpful, and professional. Always use English. 
        If you don't know something, suggest they contact the campus administrator."""
    
    system_prompt = "You are a helpful AI Study Assistant for the 'Same College' platform."
    if mode == "explain_like_beginner":
        system_prompt += " Explain the concepts extremely simply, using analogies."
    
    if context:
        system_prompt += f"\nUse the following context to answer:\n{context}"
    
    return system_prompt

# Node: Generate
def generate_node(state: GraphState):
    system_prompt = get_system_prompt(state["mode"], state.get("context", ""))
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
