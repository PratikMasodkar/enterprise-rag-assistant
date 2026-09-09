import os

from pypdf import PdfReader


def load_text_file(file_path):

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        return file.read()


def load_pdf_file(file_path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


def load_document(file_path):

    extension = os.path.splitext(
        file_path
    )[1].lower()

    if extension == ".txt":

        return load_text_file(file_path)

    elif extension == ".pdf":

        return load_pdf_file(file_path)

    else:

        raise ValueError(
            f"Unsupported file type: {extension}"
        )


def load_all_documents(data_folder):

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

        text = load_document(file_path)

        if not text.strip():
            print(
                f"Warning: No text found in {filename}"
            )
            continue

        documents.append({
            "source": file_path,
            "text": text
        })

        print(
            f"Loaded: {file_path}"
        )

    return documents