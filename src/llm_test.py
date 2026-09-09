from ollama import chat

response = chat(
    model="qwen3:4b",
    messages=[
        {
            "role": "user",
            "content": "Explain what RAG is in one simple sentence."
        }
    ]
)

print(response.message.content)