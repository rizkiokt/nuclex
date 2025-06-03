from google import genai
from google.genai import types
from typing import List, Dict
from ..core.config import settings
from ..models.chat import ChatMessage
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class LLMService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-2.5-flash-preview-04-17"
    
    def generate_response(self, 
                         query: str, 
                         relevant_docs: List[Dict],
                         conversation_history: List[ChatMessage]) -> Dict:
        """Generate a response using Gemini based on relevant documents"""
        
        # Construct the prompt with context and conversation history
        context = self._format_context(relevant_docs)
        chat_history = self._format_chat_history(conversation_history)
        
        prompt = f"""You are NucLex, an AI assistant specialized in US Nuclear Regulations (10 CFR).
Answer the following question based ONLY on the provided context. If you cannot find a relevant answer
in the context, say so. Always cite the specific sections you reference.

Context:
{context}

Chat History:
{chat_history}

Question: {query}

Answer with:
1. A clear, concise response
2. Specific citations to relevant 10 CFR sections
3. Only information from the provided context (which is 10 CFR regulations)"""

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)]
            )
        ]

        response = ""
        for chunk in self.client.models.generate_content_stream(
            model=self.model,
            contents=contents
        ):
            response += chunk.text
        
        return {
            "answer": response,
            "sources": relevant_docs,
            "confidence": self._calculate_confidence(response, relevant_docs, conversation_history)
        }
    
    def _calculate_confidence(self, response: str, relevant_docs: List[Dict], conversation_history: List[ChatMessage]) -> float:
        """Calculate confidence level of the response based on:
        1. How much of the response is based on the relevant documents
        2. How well the response aligns with the context and conversation history"""

        scores = [doc["score"] for doc in relevant_docs]
        if len(scores) > 0:
            avg_score = np.mean(scores)
        else:
            avg_score = 0
        
        embeddings = [doc["metadata"]["embedding"] for doc in relevant_docs]
        if len(embeddings) > 0:
            avg_embedding = np.mean(embeddings, axis=0)
            response_embedding = self._get_embedding(response)
            similarity = cosine_similarity([response_embedding], [avg_embedding])[0][0]
        else:
            similarity = 0
        
        return 0.5 * avg_score + 0.5 * similarity
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding of the text"""
        return self.client.encode(text, output_fields=["embedding"])

    def _format_context(self, docs: List[Dict]) -> str:
        """Format relevant documents into context string"""
        context = []
        for doc in docs:
            # Format each document with its metadata and content
            context.append(f"Section {doc.get('section', 'Unknown')}:\n{doc.get('content', '')}\n")
        return "\n".join(context)
    
    def _format_chat_history(self, history: List[ChatMessage]) -> str:
        """Format chat history into string"""
        formatted = []
        for msg in history:
            formatted.append(f"{msg.role}: {msg.content}")
        return "\n".join(formatted)

llm_service = LLMService()
