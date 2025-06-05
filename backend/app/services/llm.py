from google import genai
from google.genai import types
from typing import List, Dict
from ..core.config import settings
from ..models.chat import ChatMessage
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import random

class LLMServiceError(Exception):
    """Custom exception class for LLM service related errors"""
    pass

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
        
        prompt = f"""You are NucLex, an AI assistant specialized in U.S. Nuclear Regulatory requirements, 
with all responses grounded exclusively in Title 10 of the Code of Federal Regulations (10 CFR).
Your purpose is to assist users by accurately retrieving, summarizing, and explaining content from the 10 CFR, 
while maintaining fidelity to the original language and regulatory intent.

Context from 10 CFR:
{context}

Chat History:
{chat_history}

Question: {query}

Answer with:
1. A clear, concise response
2. Specific citations to relevant 10 CFR sections """

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
        1. Document relevance: Average similarity scores of cited documents
        2. Citation coverage: How many citations are used in the response
        3. Response completeness: Whether the response addresses all parts of the query
        
        Returns:
            float: Confidence score between 0 and 1
        """
        if not response or not relevant_docs:
            return 0.0
        
        # 1. Document relevance (60%)
        doc_scores = [doc.get('score', 0) for doc in relevant_docs]
        avg_doc_score = sum(doc_scores) / len(doc_scores) if doc_scores else 0
        
        # 2. Citation coverage (20%)
        citations_found = 0
        for doc in relevant_docs:
            metadata = doc.get('metadata', {})
            citation = f"Part {metadata.get('part', '')}"
            if citation.lower() in response.lower():
                citations_found += 1
        citation_score = citations_found / len(relevant_docs) if relevant_docs else 0
        
        # 3. Response completeness (20%)
        # Check if response has key components
        has_clear_answer = len(response.split()) >= 20  # At least 20 words
        has_citations = 'Part' in response and 'Section' in response
        has_explanation = any(marker in response.lower() for marker in ['because', 'therefore', 'this means', 'specifically'])
        completeness_score = sum([has_clear_answer, has_citations, has_explanation]) / 3
        
        # Calculate weighted average
        confidence = (
            0.6 * avg_doc_score +
            0.2 * citation_score +
            0.2 * completeness_score
        )
        
        # Ensure confidence is between 0 and 1
        return max(0.0, min(1.0, confidence))
    

    def _format_context(self, docs: List[Dict]) -> str:
        """Format relevant documents into context string"""
        context = []
        for doc in docs:
            # Format each document with its metadata and content
            metadata = doc.get('metadata', {})
            content = doc.get('content', '')
            part = metadata.get('part', 'Unknown')
            section = metadata.get('section', '')
            title = metadata.get('title', '')
            
            # Format the section information
            section_info = f"10 CFR Part {part}"
            if section:
                section_info += f", Section {section}"
            if title:
                section_info += f": {title}"
                
            context.append(f"{section_info}\n{content}\n")
        return "\n".join(context)
    
    def _format_chat_history(self, history: List[ChatMessage]) -> str:
        """Format chat history into string"""
        formatted = []
        for msg in history:
            formatted.append(f"{msg.role}: {msg.content}")
        return "\n".join(formatted)

llm_service = LLMService()
