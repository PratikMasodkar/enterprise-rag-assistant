# Enterprise RAG Assistant

An enterprise document question-answering system built using **Python, FastAPI, React, ChromaDB, Sentence Transformers, and Qwen3**.

The application allows users to upload enterprise documents such as company policies and ask questions using a conversational interface. The system retrieves relevant document content using semantic search and generates grounded answers using a Large Language Model.

---

## 🚀 Project Overview

Enterprise organizations often store important information in documents such as:

* Company policies
* Employee handbooks
* Leave policies
* Travel policies
* Internal guidelines
* Process documentation

Searching these documents manually can be time-consuming.

This project provides an **AI-powered Enterprise Document Assistant** where users can upload documents and ask questions in natural language.

The system uses **Retrieval-Augmented Generation (RAG)** so that answers are generated using information retrieved from the organization's documents.

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │       React UI       │
                    │                      │
                    │  Ask Questions       │
                    │  Upload Documents    │
                    │  View Sources        │
                    └──────────┬───────────┘
                               │
                               │ HTTP / JSON
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │      Backend         │
                    │                      │
                    │ /ask                 │
                    │ /upload              │
                    │ /documents           │
                    │ /health              │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    RAG Pipeline      │
                    │                      │
                    │ Query Embedding      │
                    │ Semantic Retrieval   │
                    │ Context Building     │
                    │ Prompt Construction  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │      ChromaDB        │
                    │     Vector Store     │
                    └──────────┬───────────┘
                               │
                        Relevant Chunks
                               │
                    ┌──────────▼───────────┐
                    │       Qwen3          │
                    │    Local LLM         │
                    │      Ollama          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Answer + Sources     │
                    │ returned to React    │
                    └──────────────────────┘
```

---

## 🔄 RAG Workflow

The application follows these main steps:

### 1. Document Upload

The user uploads a PDF or TXT document through the React frontend.

### 2. Document Processing

FastAPI receives the document and stores it in the `data/` directory.

The backend extracts text from:

* PDF files using `pypdf`
* TXT files using Python file handling

### 3. Text Chunking

Large documents are divided into smaller chunks.

Chunking makes it easier to retrieve only the relevant sections instead of sending an entire document to the LLM.

### 4. Embedding Generation

Each chunk is converted into a numerical vector using:

```text
all-MiniLM-L6-v2
```

These vectors represent the semantic meaning of the document chunks.

### 5. Vector Storage

The generated embeddings are stored in:

```text
ChromaDB
```

Metadata such as the source document and chunk number is stored along with the vectors.

### 6. User Question

The user enters a natural-language question.

For example:

```text
How many days per week can employees work from home?
```

### 7. Semantic Search

The question is converted into an embedding.

ChromaDB performs a similarity search and retrieves the most relevant document chunks.

### 8. Context Construction

The retrieved chunks are combined into a context that is provided to the LLM.

### 9. Prompt Engineering

The application constructs a prompt containing rules such as:

* Use only the retrieved context
* Do not invent information
* Do not use outside knowledge
* Clearly handle conflicting documents
* Return a fallback response when information is unavailable

### 10. LLM Generation

The retrieved context is sent to:

```text
Qwen3 4B
```

running locally through:

```text
Ollama
```

### 11. Response

FastAPI returns:

```json
{
  "question": "How many days per week can employees work from home?",
  "answer": "...",
  "sources": [
    {
      "filename": "company_policy.txt",
      "chunk": 1,
      "preview": "..."
    }
  ]
}
```

The React frontend displays the answer and retrieved sources.

---

## ✨ Features

### Document Management

* Upload PDF documents
* Upload TXT documents
* View indexed documents
* Delete documents
* Automatic document indexing

### AI Question Answering

* Natural-language questions
* Semantic document retrieval
* Retrieval-Augmented Generation
* Local Qwen3 LLM
* Context-grounded answers
* Fallback response for insufficient information

### Source Transparency

The application displays:

* Source filename
* Chunk number
* Retrieved content preview

This helps users understand where the answer originated.

### Conflict Detection

The system can identify conflicting information across documents.

For example:

```text
Document A → Remote work: 2 days/week

Document B → Remote work: 3 days/week
```

Instead of silently choosing one answer, the system can inform the user that the documents contain conflicting information.

### Voice Input

The frontend also supports browser-based speech recognition for asking questions using voice input.

---

## 🛠️ Technology Stack

| Category               | Technology                     |
| ---------------------- | ------------------------------ |
| Programming Language   | Python                         |
| Backend                | FastAPI                        |
| Frontend               | React                          |
| Build Tool             | Vite                           |
| LLM                    | Qwen3 4B                       |
| LLM Runtime            | Ollama                         |
| RAG                    | Retrieval-Augmented Generation |
| Vector Database        | ChromaDB                       |
| Embeddings             | Sentence Transformers          |
| Embedding Model        | all-MiniLM-L6-v2               |
| PDF Processing         | pypdf                          |
| API Format             | REST / JSON                    |
| Frontend Communication | HTTP                           |
| Version Control        | Git / GitHub                   |

---

## 📁 Project Structure

```text
enterprise-rag/
│
├── data/
│   ├── company_policy.txt
│   ├── employee_handbook_test.pdf
│   ├── leave_policy.txt
│   └── test_company_policy.txt
│
├── src/
│   ├── main.py
│   ├── rag_pipeline.py
│   ├── vector_store.py
│   ├── document_loader.py
│   ├── chunker.py
│   ├── embeddings.py
│   └── llm_test.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── start_rag.sh
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites

Install the following:

* Python 3.11+
* Node.js
* npm
* Ollama
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/PratikMasodkar/enterprise-rag-assistant.git
cd enterprise-rag
```

---

## 2. Create Python Virtual Environment

```bash
python3 -m venv venv
```

Activate it:

```bash
source venv/bin/activate
```

---

## 3. Install Python Dependencies

Install the required backend packages:

```bash
pip install fastapi uvicorn chromadb sentence-transformers pypdf python-multipart ollama
```

---

## 4. Install and Start Ollama

Install Ollama and make sure it is running.

Pull the Qwen3 model:

```bash
ollama pull qwen3:4b
```

The project uses Qwen3 locally through Ollama.

---

## 5. Start the FastAPI Backend

From the project root:

```bash
python3 -m uvicorn src.main:app --reload
```

The API will run at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 6. Start the React Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

Open the application in your browser.

---

## 🚀 One-Click Startup

The repository also contains:

```text
start_rag.sh
```

This script starts:

1. FastAPI backend
2. React frontend
3. Browser application

The project can therefore be launched using the provided startup script on the local development machine.

---

## 🔌 API Endpoints

### Health Check

```http
GET /health
```

Checks whether the backend is running.

### Ask Question

```http
POST /ask
```

Example request:

```json
{
  "question": "How many days per week can employees work from home?"
}
```

### Upload Document

```http
POST /upload
```

Accepts:

```text
PDF
TXT
```

### List Documents

```http
GET /documents
```

Returns the documents currently available in the knowledge base.

### Delete Document

```http
DELETE /documents/{filename}
```

Removes the document and its indexed chunks.

---

## 🧠 Example

### User Question

```text
How many days per week can employees work from home?
```

### Retrieved Documents

```text
employee_handbook_test.pdf
test_company_policy.txt
```

### System Behavior

If the documents contain different policies, the system identifies the conflict instead of blindly returning a single value.

Example:

```text
Document A → 2 days/week
Document B → 3 days/week
```

The assistant reports that the documents contain conflicting information.

---

## 🔐 Grounding Strategy

The application uses prompt-level grounding rules to reduce hallucinations.

The LLM is instructed to:

```text
Use only the retrieved context.
Do not use outside knowledge.
Do not invent information.
If information is unavailable, state that it is unavailable.
If documents conflict, clearly report the conflict.
```

This makes the system more suitable for enterprise document question-answering use cases.

---

## ⚡ Performance Considerations

The application currently runs the Qwen3 4B model locally through Ollama.

The retrieval stage using embeddings and ChromaDB is comparatively fast.

The main latency comes from local LLM inference because the model generates the response token by token on the local machine.

For a production deployment, possible improvements include:

* Model quantization
* Smaller/faster LLMs where appropriate
* Response token limits
* Model warm-up
* GPU-backed inference
* Optimized inference servers
* Cloud-based LLM infrastructure

---

## 🔮 Future Improvements

Potential production improvements include:

* User authentication
* Role-based access control
* Document-level permissions
* Conversation persistence
* Better document metadata
* Hybrid keyword + semantic search
* Reranking
* Cloud deployment
* Containerization with Docker
* CI/CD pipeline
* Logging and monitoring
* Production vector database
* Hosted LLM inference
* Agent-based workflows

---

## 🎯 Skills Demonstrated

This project demonstrates practical experience with:

* Python
* Generative AI
* Large Language Models
* Retrieval-Augmented Generation
* Prompt Engineering
* Vector Databases
* Embeddings
* Semantic Search
* FastAPI
* REST APIs
* JSON
* React
* Hugging Face ecosystem
* ChromaDB
* Qwen3
* Ollama
* Git and GitHub
* Document processing
* Enterprise AI use cases

---

## 💼 Interview Explanation

A concise explanation of the project:

> I built an Enterprise RAG Assistant using Python, FastAPI, React, ChromaDB, Sentence Transformers and Qwen3. The purpose is to allow users to ask questions about enterprise documents such as company policies.
>
> The user can upload PDF or TXT documents through the React frontend. FastAPI processes the document, extracts the text and divides it into chunks. I generate embeddings using the all-MiniLM-L6-v2 model and store them in ChromaDB with metadata.
>
> When the user asks a question, the question is converted into an embedding and ChromaDB performs semantic similarity search to retrieve relevant chunks. These chunks are then passed into a dynamically constructed prompt with grounding rules. Qwen3 generates the answer using only the retrieved context.
>
> Finally, FastAPI returns the answer along with the retrieved sources, and React displays them to the user.

---

## 📌 Project Status

**Current status: Working local prototype**

The application currently supports:

* Document upload
* PDF/TXT processing
* Text chunking
* Embedding generation
* ChromaDB vector search
* RAG-based question answering
* Qwen3 local inference
* Source display
* Document management
* React frontend
* Voice input
* One-click local startup

---

## 👨‍💻 Author

**Pratik Masodkar**

Enterprise RAG / Generative AI Project

Built using Python and modern AI application technologies.
