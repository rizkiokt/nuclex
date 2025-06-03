from fastapi import APIRouter, HTTPException
from ..models.chat import ChatRequest, ChatResponse
from ..services.vector_store import vector_store
from ..services.llm import llm_service

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Get relevant documents from vector store
        relevant_docs = vector_store.search(request.message)
        
        # Generate response using LLM
        response = llm_service.generate_response(
            query=request.message,
            relevant_docs=relevant_docs,
            conversation_history=request.conversation_history
        )
        
        return ChatResponse(
            answer=response["answer"],
            sources=response["sources"],
            confidence=response["confidence"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
