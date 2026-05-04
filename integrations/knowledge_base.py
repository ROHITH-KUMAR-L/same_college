import os
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

# Initialize Pinecone lazily inside functions to avoid crash if keys are missing
def get_pinecone_client():
    api_key = os.environ.get("PINECONE_API_KEY")
    if not api_key:
        raise ValueError("PINECONE_API_KEY is not set.")
    return Pinecone(api_key=api_key)

def get_vector_store():
    pc = get_pinecone_client()
    index_name = os.environ.get("PINECONE_INDEX_NAME", "samecollege")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-002")
    
    # Check if index exists, if not create it
    existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]
    if index_name not in existing_indexes:
        pc.create_index(
            name=index_name,
            dimension=768, # Gemini embedding dimension
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    
    return PineconeVectorStore(index_name=index_name, embedding=embeddings, pinecone_api_key=os.environ.get("PINECONE_API_KEY"))

def add_documents_to_pinecone(texts: list[str], metadatas: list[dict] = None):
    vector_store = get_vector_store()
    vector_store.add_texts(texts=texts, metadatas=metadatas)

def retrieve_context(query: str, k: int = 3):
    try:
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]
    except Exception as e:
        print(f"Error retrieving context: {e}")
        return []
