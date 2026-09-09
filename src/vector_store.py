import chromadb

from sentence_transformers import SentenceTransformer

from src.document_loader import load_all_documents
from src.chunker import create_chunks


embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


chroma_client = chromadb.PersistentClient(
    path="chroma_db"
)


collection = chroma_client.get_or_create_collection(
    name="company_policies"
)


def add_all_documents(data_folder):

    documents = load_all_documents(
        data_folder
    )

    total_chunks = 0

    for document in documents:

        chunks = create_chunks(
            document["text"],
            document["source"]
        )

        texts = [
            chunk["text"]
            for chunk in chunks
        ]

        ids = [
            chunk["id"]
            for chunk in chunks
        ]

        metadata = [
            chunk["metadata"]
            for chunk in chunks
        ]

        embeddings = embedding_model.encode(
            texts
        ).tolist()

        # Remove existing chunks with the same IDs
        existing = collection.get(
            ids=ids
        )

        existing_ids = existing.get(
            "ids",
            []
        )

        if existing_ids:

            collection.delete(
                ids=existing_ids
            )

        collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadata
        )

        total_chunks += len(texts)

        print(
            f"Indexed {len(texts)} chunks from "
            f"{document['source']}"
        )

    print(
        f"\nTotal chunks indexed: {total_chunks}"
    )


def delete_document(document_path):

    results = collection.get(
        where={
            "source": document_path
        }
    )

    document_ids = results.get(
        "ids",
        []
    )

    if document_ids:

        collection.delete(
            ids=document_ids
        )

        print(
            f"Deleted {len(document_ids)} chunks "
            f"from {document_path}"
        )

    else:

        print(
            f"No indexed chunks found for "
            f"{document_path}"
        )

    return len(document_ids)


def search_documents(query, top_k=3):

    query_embedding = embedding_model.encode(
        query
    ).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    return results


if __name__ == "__main__":

    add_all_documents("data")