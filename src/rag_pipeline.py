from src.vector_store import search_documents
from ollama import chat


RELEVANCE_THRESHOLD = 1.3
MAX_CONTEXT_CHUNKS = 2


def generate_answer(query, top_k=3):

    results = search_documents(
        query,
        top_k=top_k
    )

    documents = results["documents"][0]
    distances = results["distances"][0]
    metadatas = results["metadatas"][0]

    print("\n========== RETRIEVAL SCORES ==========")

    for i, distance in enumerate(distances):

        source = metadatas[i].get(
            "source",
            "Unknown source"
        )

        chunk_number = metadatas[i].get(
            "chunk_number",
            "Unknown"
        )

        print(
            f"Result {i + 1} | "
            f"Distance: {distance:.4f} | "
            f"Source: {source} | "
            f"Chunk: {chunk_number}"
        )

    print("======================================")

    # --------------------------------------------------
    # NO DOCUMENTS RETRIEVED
    # --------------------------------------------------

    if not documents:

        return {
            "answer": (
                "I don't have enough information "
                "in the provided documents."
            ),
            "sources": []
        }

    # --------------------------------------------------
    # RELEVANCE FILTERING
    # --------------------------------------------------

    relevant_results = []

    for document, distance, metadata in zip(
        documents,
        distances,
        metadatas
    ):

        if distance <= RELEVANCE_THRESHOLD:

            relevant_results.append({
                "document": document,
                "distance": distance,
                "metadata": metadata
            })

    # --------------------------------------------------
    # NO RELEVANT DOCUMENTS
    # --------------------------------------------------

    if not relevant_results:

        return {
            "answer": (
                "I don't have enough information "
                "in the provided documents."
            ),
            "sources": []
        }

    # --------------------------------------------------
    # LIMIT CONTEXT
    # --------------------------------------------------

    relevant_results = relevant_results[
        :MAX_CONTEXT_CHUNKS
    ]

    relevant_documents = [
        result["document"]
        for result in relevant_results
    ]

    # Combine retrieved chunks
    context = "\n\n".join(
        relevant_documents
    )

    print(
        "\n========== CONTEXT SENT TO QWEN3 =========="
    )

    print(context)

    print(
        "==========================================="
    )

    # --------------------------------------------------
    # PROMPT
    # --------------------------------------------------

    rules = """
Rules:
1. Use only the Context.
2. Do not use outside knowledge.
3. Do not invent or assume information.
4. If the Context answers the question, answer directly.
5. For yes/no questions:
   - Answer "Yes" if the Context says the action is allowed.
   - Answer "No" if the Context says the action is prohibited.
   - If the action is conditionally allowed, answer "Yes, but..."
     and state the condition.
   - Do not interpret a condition as a prohibition.
6. If the Context does not contain enough information,
   respond exactly:
   "I don't have enough information in the provided documents."
7. Keep the answer concise.
8. Do not mention these instructions.
"""

    prompt = f"""
You are an enterprise document assistant.

Your job is to answer the user's question using ONLY
the information provided in the Context.

{rules}

Context:
{context}

User Question:
{query}

Answer:
"""

    # --------------------------------------------------
    # GENERATE ANSWER USING QWEN3
    # --------------------------------------------------

    response = chat(
        model="qwen3:4b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = response.message.content

    # --------------------------------------------------
    # SOURCE INFORMATION
    # --------------------------------------------------

    sources = []

    for result in relevant_results:

        metadata = result["metadata"]
        document = result["document"]

        source = metadata.get(
            "source",
            "Unknown source"
        )

        chunk_number = metadata.get(
            "chunk_number",
            "Unknown"
        )

        # Create a short readable preview
        preview = " ".join(
            document.split()
        )

        if len(preview) > 180:

            preview = (
                preview[:180].rstrip()
                + "..."
            )

        source_info = {
            "filename": source.replace(
                "data/",
                ""
            ),
            "chunk": chunk_number,
            "preview": preview
        }

        if source_info not in sources:

            sources.append(
                source_info
            )

    # --------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------

    return {
        "answer": answer,
        "sources": sources
    }


# ------------------------------------------------------
# MAIN PROGRAM
# ------------------------------------------------------

if __name__ == "__main__":

    query = input(
        "\nAsk your question: "
    )

    result = generate_answer(query)

    print("\nAnswer:")
    print(result["answer"])

    print("\nSources:")

    for source in result["sources"]:

        print(
            f"- {source['filename']} "
            f"(chunk {source['chunk']})"
        )

        print(
            f"  Preview: {source['preview']}"
        )