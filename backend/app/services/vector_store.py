import json
import os
import numpy as np
import faiss
from typing import List, Dict, Tuple
from google import genai
from google.genai import types # Import types for configuration

from ..core.config import settings
import tiktoken
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class Document:
    content: str
    metadata: Dict
    embedding: np.ndarray = None

class VectorStore:
    def __init__(self):
        self.index = None
        self.documents: List[Document] = []
        self.dimension = 768  # Default for 'text-embedding-004'
        self.tokenizer = tiktoken.get_encoding('cl100k_base')

        # FIX: Use genai.Client() and access models via client.models
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.embedding_model = "models/text-embedding-004" # Use the specific embedding model
        # If you were also using a chat/generation model, you'd define it here too:
        # self.chat_model = "gemini-2.5-flash-preview-04-17"

        self.load_documents()
        self.initialize_index()

    def load_documents(self):
        """Load and process all CFR documents."""
        print("Loading CFR documents...")
        for filename in os.listdir(settings.DATA_DIR):
            if filename.endswith('_structured.json'):
                filepath = os.path.join(settings.DATA_DIR, filename)
                try:
                    with open(filepath, 'r') as f:
                        data = json.load(f)
                        part_number = filename.split('_')[1].replace('part', '')
                        chunks = self.process_document(data, part_number)
                        self.documents.extend(chunks)
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON from {filepath}: {e}")
                except Exception as e:
                    print(f"An unexpected error occurred while loading {filepath}: {e}")
        print(f"Loaded {len(self.documents)} document chunks.")
        self._compute_embeddings()

    def process_document(self, data: Dict, part_number: str) -> List[Document]:
        """Process and chunk individual documents."""
        chunks = []

        def process_section(section, section_id, parent_title=''):
            """Process a section and its subsections."""
            if isinstance(section, str):
                chunks.append(Document(
                    content=section,
                    metadata={
                        'part': part_number,
                        'section': '',
                        'title': '',
                        'parent_title': parent_title
                    }
                ))
            else:
                section_title = section.get('title', '')
                content = section.get('content', '')
                subsections = section.get('subsections', [])

                current_title = section_title if section_title else parent_title

                if content:
                    chunks.append(Document(
                        content=content,
                        metadata={
                            'part': part_number,
                            'section': section_id,
                            'title': section_title,
                            'parent_title': parent_title
                        }
                    ))

                for subsection in subsections:
                    process_section(subsection, current_title)

        sections = data["sections"]
        parent_title = data["title"]

        for section_id, section_data in sections.items():
            process_section(section_data, section_id, parent_title)

        return chunks

    def _compute_embeddings(self):
        """Compute embeddings for all documents."""
        print("Computing embeddings...")
        contents_to_embed = [doc.content for doc in self.documents]
        batch_size = 100  # Maximum batch size allowed by the API

        try:
            # Process in batches of 100
            for i in range(0, len(contents_to_embed), batch_size):
                batch = contents_to_embed[i:i + batch_size]
                print(f"Processing batch {i//batch_size + 1}/{(len(contents_to_embed) + batch_size - 1)//batch_size}")
                
                response = self.client.models.embed_content(
                    model=self.embedding_model,
                    contents=batch
                )
                
                if hasattr(response, 'embeddings') and response.embeddings:
                    for j, embedding_data in enumerate(response.embeddings):
                        doc_idx = i + j
                        if isinstance(embedding_data.values, list):
                            self.documents[doc_idx].embedding = np.array(embedding_data.values).astype('float32')
                        else:
                            print(f"Warning: Unexpected embedding format for document {doc_idx}. Skipping embedding.")
                            self.documents[doc_idx].embedding = np.zeros(self.dimension, dtype='float32')
                else:
                    print(f"No embeddings found in the response for batch starting at index {i}.")
        except Exception as e:
            print(f"Error computing embeddings: {e}")
            # Consider more granular error handling or retry logic here
        print("Embeddings computed.")

    def initialize_index(self):
        """Initialize FAISS index."""
        print("Initializing FAISS index...")
        valid_embeddings = [doc.embedding for doc in self.documents if doc.embedding is not None]
        if not valid_embeddings:
            print("No valid embeddings found to initialize FAISS index. Index not created.")
            return

        embeddings = np.vstack(valid_embeddings).astype('float32')
        self.dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(embeddings)
        print("FAISS index initialized.")

    def search(self, query: str, k: int = 3) -> List[Dict]:
        """Search for relevant documents."""
        if not self.documents:
            print("No documents loaded. Cannot perform search.")
            return []

        if self.index is None:
            print("Computing embeddings and initializing index...")
            self._compute_embeddings()
            self.initialize_index()
            if self.index is None:
                print("Failed to initialize index. Returning empty results.")
                return []

        try:
            # Embed the query using the same model
            response = self.client.models.embed_content(
                model=self.embedding_model,
                contents=[query]
            )
            
            if not hasattr(response, 'embeddings') or not response.embeddings:
                print("Failed to get query embedding")
                return []
                
            query_embedding = np.array(response.embeddings[0].values).astype('float32')
            query_embedding = query_embedding.reshape(1, -1)
        except Exception as e:
            print(f"Error generating query embedding: {e}")
            return []

        # Search index
        distances, indices = self.index.search(query_embedding, k)

        # Get matching documents with metadata
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if 0 <= idx < len(self.documents):
                doc = self.documents[idx]
                results.append({
                    'content': doc.content,
                    'metadata': doc.metadata,
                    'score': float(1 / (1 + distance))
                })
            else:
                print(f"Warning: FAISS returned an invalid index {idx}. Skipping this result.")

        return sorted(results, key=lambda x: x['score'], reverse=True)

vector_store = VectorStore()