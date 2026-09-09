from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import os
import shutil

from src.rag_pipeline import generate_answer
from src.vector_store import (
    add_all_documents,
    delete_document as delete_document_from_store
)


app = FastAPI(
    title="Enterprise RAG Assistant",
    description="Enterprise Document Q&A using RAG and Qwen3",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):

    question: str


class Source(BaseModel):

    filename: str
    chunk: int
    preview: str


class AnswerResponse(BaseModel):

    question: str
    answer: str
    sources: list[Source]


@app.get("/")
def root():

    return {
        "message": "Enterprise RAG Assistant API is running"
    }

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "Enterprise RAG Assistant"
    }

@app.post(
    "/ask",
    response_model=AnswerResponse
)
def ask_question(request: QuestionRequest):

    result = generate_answer(
        request.question
    )

    return {
        "question": request.question,
        "answer": result["answer"],
        "sources": result["sources"]
    }


@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    allowed_extensions = [".pdf", ".txt"]

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported."
        )

    data_folder = "data"

    os.makedirs(
        data_folder,
        exist_ok=True
    )

    file_path = os.path.join(
        data_folder,
        file.filename
    )

    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        add_all_documents(
            data_folder
        )

        return {
            "message": "Document uploaded and indexed successfully.",
            "filename": file.filename
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}"
        )


# ------------------------------------------------------
# LIST DOCUMENTS
# ------------------------------------------------------

@app.get("/documents")
def list_documents():

    data_folder = "data"

    if not os.path.exists(data_folder):

        return {
            "documents": []
        }

    documents = []

    for filename in os.listdir(data_folder):

        file_path = os.path.join(
            data_folder,
            filename
        )

        if not os.path.isfile(file_path):
            continue

        extension = os.path.splitext(
            filename
        )[1].lower()

        if extension not in [".txt", ".pdf"]:
            continue

        documents.append({
            "filename": filename
        })

    documents.sort(
        key=lambda document: document["filename"].lower()
    )

    return {
        "documents": documents
    }


# ------------------------------------------------------
# DELETE DOCUMENT
# ------------------------------------------------------

@app.delete("/documents/{filename}")
def delete_document(filename: str):

    data_folder = "data"

    # Prevent path traversal
    safe_filename = os.path.basename(
        filename
    )

    if safe_filename != filename:

        raise HTTPException(
            status_code=400,
            detail="Invalid filename."
        )

    file_path = os.path.join(
        data_folder,
        safe_filename
    )

    if not os.path.isfile(file_path):

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    try:

        # Delete document chunks from ChromaDB
        deleted_chunks = delete_document_from_store(
            file_path
        )

        # Delete physical file
        os.remove(
            file_path
        )

        return {
            "message": "Document deleted successfully.",
            "filename": safe_filename,
            "deleted_chunks": deleted_chunks
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )