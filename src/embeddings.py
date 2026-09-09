from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")

texts = [
    "Employees can carry forward 10 days of leave.",
    "Workers can save up to 10 vacation days for next year.",
    "The car has Bluetooth connectivity."
]

embeddings = model.encode(texts)

similarity = cosine_similarity(
    [embeddings[0]],
    [embeddings[1]]
)

print("Similarity between sentence 1 and 2:")
print(similarity[0][0])

similarity = cosine_similarity(
    [embeddings[0]],
    [embeddings[2]]
)

print("Similarity between sentence 1 and 3:")
print(similarity[0][0])