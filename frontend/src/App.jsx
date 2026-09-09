
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [backendStatus, setBackendStatus] = useState("checking");

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [deletingDocument, setDeletingDocument] = useState(null);

  // --------------------------------------------------
  // MICROPHONE / VOICE INPUT
  // --------------------------------------------------

  const [listening, setListening] = useState(false);

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      window.alert(
        "Voice input is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    if (listening) {
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setQuestion((currentQuestion) => {
        if (!currentQuestion.trim()) {
          return transcript;
        }

        return `${currentQuestion} ${transcript}`;
      });
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      if (event.error === "not-allowed") {
        window.alert(
          "Microphone permission was denied. Please allow microphone access in your browser."
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  // --------------------------------------------------
  // BACKEND HEALTH CHECK
  // --------------------------------------------------

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/health"
      );

      if (response.ok) {
        setBackendStatus("connected");
      } else {
        setBackendStatus("offline");
      }
    } catch (error) {
      setBackendStatus("offline");
    }
  };

  // --------------------------------------------------
  // LOAD DOCUMENTS
  // --------------------------------------------------

  const loadDocuments = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/documents"
      );

      const data = await response.json();

      setDocuments(data.documents || []);

    } catch (error) {
      console.error(
        "Failed to load documents:",
        error
      );

    } finally {
      setDocumentsLoading(false);
    }
  };

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    checkBackendHealth();
    loadDocuments();
  }, []);

  // --------------------------------------------------
  // ASK QUESTION
  // --------------------------------------------------

  const askQuestion = async () => {
    if (!question.trim() || loading) {
      return;
    }

    const currentQuestion = question.trim();

    setLoading(true);
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/ask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: currentQuestion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAnswer(
          data.detail ||
          "Failed to get an answer."
        );
        return;
      }

      setAnswer(data.answer);
      setSources(data.sources || []);

      setChatHistory((currentHistory) => [
        ...currentHistory,
        {
          question: currentQuestion,
          answer: data.answer,
          sources: data.sources || [],
        },
      ]);

    } catch (error) {
      setBackendStatus("offline");

      setAnswer(
        "Unable to connect to the backend. Please make sure FastAPI is running."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // SUGGESTED QUESTION
  // --------------------------------------------------

  const askSuggestedQuestion = async (
    suggestedQuestion
  ) => {
    if (loading) {
      return;
    }

    setQuestion(suggestedQuestion);

    setLoading(true);
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/ask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: suggestedQuestion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAnswer(
          data.detail ||
          "Failed to get an answer."
        );
        return;
      }

      setAnswer(data.answer);
      setSources(data.sources || []);

      setChatHistory((currentHistory) => [
        ...currentHistory,
        {
          question: suggestedQuestion,
          answer: data.answer,
          sources: data.sources || [],
        },
      ]);

    } catch (error) {
      setBackendStatus("offline");

      setAnswer(
        "Unable to connect to the backend. Please make sure FastAPI is running."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // UPLOAD DOCUMENT
  // --------------------------------------------------

  const uploadDocument = async () => {
    if (!file) {
      setUploadMessage(
        "Please select a PDF or TXT file."
      );
      return;
    }

    setUploading(true);
    setUploadMessage("");

    const formData = new FormData();

    formData.append("file", file);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setUploadMessage(
          data.detail ||
          "Failed to upload document."
        );
        return;
      }

      setUploadMessage(
        `✓ ${data.filename} uploaded and indexed successfully.`
      );

      setFile(null);

      await loadDocuments();

    } catch (error) {
      setBackendStatus("offline");

      setUploadMessage(
        "Unable to connect to the backend. Please make sure FastAPI is running."
      );

    } finally {
      setUploading(false);
    }
  };

  // --------------------------------------------------
  // DELETE DOCUMENT
  // --------------------------------------------------

  const deleteDocument = async (filename) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${filename}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingDocument(filename);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/documents/${encodeURIComponent(
          filename
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.detail ||
          "Failed to delete document."
        );
        return;
      }

      setDocuments((currentDocuments) =>
        currentDocuments.filter(
          (document) =>
            document.filename !== filename
        )
      );

    } catch (error) {
      setBackendStatus("offline");

      window.alert(
        "Unable to connect to the backend. Please make sure FastAPI is running."
      );

    } finally {
      setDeletingDocument(null);
    }
  };

  // --------------------------------------------------
  // CLEAR CHAT
  // --------------------------------------------------

  const clearChat = () => {
    setQuestion("");
    setAnswer("");
    setSources([]);
    setChatHistory([]);
  };

  // --------------------------------------------------
  // FILE TYPE
  // --------------------------------------------------

  const getFileType = (filename) => {
    const extension = filename
      .split(".")
      .pop()
      .toUpperCase();

    return extension === "PDF"
      ? "PDF document"
      : "TXT document";
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="app">

      <div className="container">

        {/* Header */}

        <div className="header">

          <h1>
            Enterprise RAG Assistant
          </h1>

          <p className="subtitle">
            Ask questions about your enterprise documents
          </p>

          {/* Backend Status */}

          <div className="backend-status">

            {backendStatus === "checking" && (
              <>
                <span className="status-dot checking"></span>
                Checking backend...
              </>
            )}

            {backendStatus === "connected" && (
              <>
                <span className="status-dot connected"></span>
                Backend Connected
              </>
            )}

            {backendStatus === "offline" && (
              <>
                <span className="status-dot offline"></span>
                Backend Offline
              </>
            )}

          </div>

        </div>

        {/* Upload Section */}

        <div className="upload-section">

          <h2>
            📄 Upload Document
          </h2>

          <p className="section-description">
            Upload a PDF or TXT document to add it
            to the knowledge base.
          </p>

          <div className="upload-controls">

            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) =>
                setFile(e.target.files[0])
              }
            />

            <button
              onClick={uploadDocument}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Upload Document"}
            </button>

          </div>

          {file && (
            <p className="selected-file">
              Selected: {file.name}
            </p>
          )}

          {uploadMessage && (
            <p className="upload-message">
              {uploadMessage}
            </p>
          )}

        </div>

        {/* Knowledge Base */}

        <div className="documents-section">

          <div className="documents-header">

            <div>

              <h2>
                📚 Knowledge Base
              </h2>

              <p className="section-description">
                Documents currently available to the RAG assistant.
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={loadDocuments}
              disabled={documentsLoading}
            >
              ↻ Refresh
            </button>

          </div>

          {documentsLoading ? (

            <p className="documents-status">
              Loading documents...
            </p>

          ) : documents.length === 0 ? (

            <p className="documents-status">
              No documents available.
            </p>

          ) : (

            <div className="document-list">

              {documents.map((document) => (

                <div
                  className="document-item"
                  key={document.filename}
                >

                  <div className="document-icon">
                    📄
                  </div>

                  <div className="document-info">

                    <div className="document-name">
                      {document.filename}
                    </div>

                    <div className="document-type">
                      {getFileType(
                        document.filename
                      )}
                    </div>

                  </div>

                  <div className="document-indexed">

                    <span>
                      ✓
                    </span>

                    Indexed

                  </div>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteDocument(
                        document.filename
                      )
                    }
                    disabled={
                      deletingDocument ===
                      document.filename
                    }
                  >
                    {deletingDocument ===
                    document.filename
                      ? "Deleting..."
                      : "Delete"}
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* Chat History */}

        {chatHistory.length > 0 && (

          <div className="chat-history-section">

            <div className="chat-history-header">

              <div>

                <h2>
                  💬 Conversation
                </h2>

                <p className="section-description">
                  Previous questions and answers from this session.
                </p>

              </div>

            </div>

            <div className="chat-history-list">

              {chatHistory.map((chat, index) => (

                <div
                  className="chat-message"
                  key={index}
                >

                  <div className="user-message">

                    <div className="message-label">
                      👤 You
                    </div>

                    <p>
                      {chat.question}
                    </p>

                  </div>

                  <div className="assistant-message">

                    <div className="message-label">
                      🤖 Assistant
                    </div>

                    <p>
                      {chat.answer}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}

        {/* Chat Section */}

        <div className="chat-section">

          <h2>
            💬 Ask a Question
          </h2>

          {/* Suggested Questions */}

          <div className="suggested-questions">

            <p className="suggested-title">
              Try asking:
            </p>

            <div className="suggested-buttons">

              <button
                className="suggested-button"
                onClick={() =>
                  askSuggestedQuestion(
                    "How many days per week can employees work from home?"
                  )
                }
                disabled={loading}
              >
                🏠 Work from home
              </button>

              <button
                className="suggested-button"
                onClick={() =>
                  askSuggestedQuestion(
                    "What is the annual learning budget?"
                  )
                }
                disabled={loading}
              >
                📚 Learning budget
              </button>

              <button
                className="suggested-button"
                onClick={() =>
                  askSuggestedQuestion(
                    "Is business class travel allowed?"
                  )
                }
                disabled={loading}
              >
                ✈️ Business travel
              </button>

              <button
                className="suggested-button"
                onClick={() =>
                  askSuggestedQuestion(
                    "What is the accommodation expense limit?"
                  )
                }
                disabled={loading}
              >
                🏨 Accommodation limit
              </button>

            </div>

          </div>

          {/* Question Input */}

          <div className="question-input-container">

            <textarea
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  askQuestion();
                }
              }}
              placeholder="Ask something about your uploaded documents..."
              rows="4"
            />

            <button
              className={`mic-button ${
                listening ? "listening" : ""
              }`}
              onClick={startVoiceInput}
              disabled={loading}
              title={
                listening
                  ? "Listening..."
                  : "Ask using your microphone"
              }
            >
              {listening ? "🔴" : "🎤"}
            </button>

          </div>

          {listening && (
            <p className="listening-message">
              🎙️ Listening... Please speak your question.
            </p>
          )}

          <div className="button-group">

            <button
              onClick={askQuestion}
              disabled={loading}
            >
              {loading
                ? "Thinking..."
                : "Ask Question"}
            </button>

            <button
              className="clear-button"
              onClick={clearChat}
              disabled={loading}
            >
              Clear
            </button>

          </div>

        </div>

        {/* Thinking Indicator */}

        {loading && (

          <div className="thinking-section">

            <div className="thinking-dots">

              <span></span>
              <span></span>
              <span></span>

            </div>

            <p>
              AI is thinking...
            </p>

          </div>

        )}

        {/* Latest Answer */}

        {answer && !loading && (

          <div className="answer-section">

            <div className="answer-header">

              <span>
                🤖
              </span>

              <h2>
                Latest Answer
              </h2>

            </div>

            <p>
              {answer}
            </p>

          </div>

        )}

        {/* Retrieved Sources */}

        {sources.length > 0 && !loading && (

          <div className="sources-section">

            <div className="sources-header">

              <span>
                📚
              </span>

              <h2>
                Retrieved Sources
              </h2>

            </div>

            <p className="sources-description">
              Documents and chunks retrieved from the knowledge base.
            </p>

            <div className="sources-list">

              {sources.map((source, index) => (

                <div
                  className="source-item"
                  key={`${source.filename}-${source.chunk}-${index}`}
                >

                  <div className="source-icon">
                    📄
                  </div>

                  <div className="source-info">

                    <div className="source-filename">
                      {source.filename}
                    </div>

                    <div className="source-chunk">
                      Retrieved chunk {source.chunk}
                    </div>

                    {source.preview && (
                      <div className="source-preview">
                        {source.preview}
                      </div>
                    )}

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default App;

