# NucLex - Nuclear Regulations AI Assistant

NucLex is an AI-powered chatbot designed to assist users in understanding and navigating Title 10 of the Code of Federal Regulations (10 CFR), which governs nuclear energy regulation in the United States.

## Features

- RAG-based responses using Google Gemini
- Real-time chat interface
- Source citations for every response
- High-confidence matching
- Modern, responsive UI

## Project Structure

```
nuclex/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core configurations
│   │   ├── models/       # Pydantic models
│   │   └── services/     # Business logic
│   └── requirements.txt
└── frontend/             # Next.js frontend
    ├── src/
    │   ├── app/         # Next.js pages
    │   ├── components/  # React components
    │   └── types/      # TypeScript types
    └── package.json
```

## Setup

### Backend

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up environment variables:
- Copy `.env.example` to `.env`
- Add your Google Gemini API key

4. Start the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter your question about nuclear regulations in the chat input
2. NucLex will:
   - Search relevant sections of 10 CFR
   - Generate a response based on the found content
   - Provide citations to specific sections
   - Display confidence scores

## Architecture

- **Backend**:
  - FastAPI for the API server
  - FAISS for vector similarity search
  - Google Gemini for embeddings and response generation
  - Retrieval-Augmented Generation (RAG) pipeline

- **Frontend**:
  - Next.js with TypeScript
  - Tailwind CSS for styling
  - Real-time chat interface
