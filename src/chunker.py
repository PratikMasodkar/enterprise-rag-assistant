import os

from langchain_text_splitters import RecursiveCharacterTextSplitter


def create_chunks(text, source):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=60
    )

    chunks = splitter.split_text(text)

    file_extension = os.path.splitext(
        source
    )[1].lower()

    if file_extension == ".pdf":
        document_type = "PDF"
    elif file_extension == ".txt":
        document_type = "Text"
    else:
        document_type = "Unknown"

    documents = []

    for i, chunk in enumerate(chunks):

        documents.append({
            "id": f"{source}_{i}",
            "text": chunk,
            "metadata": {
                "source": source,
                "document_type": document_type,
                "chunk_number": i
            }
        })

    return documents