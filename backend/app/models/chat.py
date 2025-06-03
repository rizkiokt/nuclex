from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]
    confidence: float
