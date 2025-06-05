from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from google.api_core import exceptions as google_exceptions
from ..models.chat import ChatRequest, ChatResponse
from ..services.vector_store import vector_store, VectorStoreError
from ..services.llm import llm_service, LLMServiceError

router = APIRouter()

def format_error_response(error_type: str, message: str, details: Dict[str, Any] = None) -> Dict:
    """Format error response with consistent structure"""
    response = {
        "error_type": error_type,
        "message": message
    }
    if details:
        response["details"] = details
    return response

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Input validation
        if not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=format_error_response(
                    "validation_error",
                    "Message cannot be empty"
                )
            )

        # Get relevant documents from vector store
        try:
            relevant_docs = vector_store.search(request.message)
        except VectorStoreError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=format_error_response(
                    "vector_store_error",
                    "Failed to search vector store",
                    {"error": str(e)}
                )
            )
        
        # Generate response using LLM
        try:
            response = llm_service.generate_response(
                query=request.message,
                relevant_docs=relevant_docs,
                conversation_history=request.conversation_history
            )
        except google_exceptions.GoogleAPIError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=format_error_response(
                    "llm_api_error",
                    "Gemini API error",
                    {"error": str(e)}
                )
            )
        except LLMServiceError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=format_error_response(
                    "llm_service_error",
                    "Error generating response",
                    {"error": str(e)}
                )
            )
        
        # Validate response structure
        required_fields = ["answer", "sources", "confidence"]
        missing_fields = [field for field in required_fields if field not in response]
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=format_error_response(
                    "response_validation_error",
                    "Invalid response structure",
                    {"missing_fields": missing_fields}
                )
            )

        return ChatResponse(
            answer=response["answer"],
            sources=response["sources"],
            confidence=response["confidence"]
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as they're already properly formatted
        raise
    
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                "unexpected_error",
                "An unexpected error occurred",
                {"error": str(e)}
            )
        )
