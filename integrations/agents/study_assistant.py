import os
from typing import Dict, Any, TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv

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
    
    system_prompt = "You are the Study Assistant."
    if state["mode"] == "explain_like_beginner":
        system_prompt += " Explain the concepts extremely simply, using analogies."
    
    if state.get("context"):
        system_prompt += f"\nUse the following context from the syllabus to answer:\n{state['context']}"
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
