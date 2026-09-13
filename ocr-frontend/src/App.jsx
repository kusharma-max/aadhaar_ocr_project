import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [showFullId, setShowFullId] = useState(false);

  // State for the smart scrolling navbar
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hook to handle scroll direction and hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide if scrolling down and past the top area (80px), else show
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null);
      setError(null);
      setShowFullId(false);
    }
  };

  const getDisplayedId = (idString, isVisible) => {
    if (!idString) return "XXXX XXXX XXXX";
    if (isVisible) return idString;
    return idString.replace(/^(\d{4}\s?\d{4})/, "XXXX XXXX ");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("document", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process document");
      }

      const data = await response.json();
      setExtractedData(data);
    } catch (err) {
      setError(
        "Error processing image. Make sure your backend API is running.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Dots & Grid Background Layer */}
      <div className="ambient-background">
        <div className="floating-dots"></div>
      </div>

      <div className="page-wrapper">
        {/* --- Professional Application Navbar (Smart Scroll) --- */}
        <nav className={`app-navbar ${isNavVisible ? "" : "nav-hidden"}`}>
          <div className="nav-container">
            <div className="nav-brand">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="brand-logo"
              >
                <path d="M2 12h4l2-9 5 18 3-10h6" />
              </svg>
              <span>
                DocuLens <span className="brand-highlight">AI</span>
              </span>
            </div>
            <div className="nav-links">
              <a href="#" className="nav-link">
                Documentation
              </a>
              <a href="#" className="nav-link">
                API Reference
              </a>
              <a href="#" className="nav-link">
                GitHub
              </a>
              <button className="nav-cta">Dashboard</button>
            </div>
          </div>
        </nav>

        {/* --- Main Application Workspace --- */}
        <main className="app-main">
          <header className="workspace-header">
            <h1 className="workspace-title">Document Extraction Engine</h1>
            <p className="workspace-subtitle">
              Upload government-issued identity documents to securely extract
              structured data using our YOLOv8 vision pipeline.
            </p>
          </header>

          <div className="workspace-grid">
            {/* Left Column: Upload Panel */}
            <div className="panel upload-panel">
              <div className="panel-header">
                <h2>1. Upload Document</h2>
              </div>

              {!previewUrl ? (
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="file-upload"
                    className="hidden-file-input"
                  />
                  <label htmlFor="file-upload" className="upload-placeholder">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="upload-text">
                      Click to browse or drag and drop
                    </span>
                    <span className="upload-hint">
                      Supports JPEG, PNG up to 5MB
                    </span>
                    <span className="browse-btn">Choose File</span>
                  </label>
                </div>
              ) : (
                <div className="preview-state">
                  <div className="image-preview-container">
                    <img
                      src={previewUrl}
                      alt="Document Preview"
                      className="image-preview"
                    />
                  </div>
                  <div className="preview-actions">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      id="file-upload-change"
                      className="hidden-file-input"
                    />
                    <label
                      htmlFor="file-upload-change"
                      className="secondary-btn"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                      Replace Image
                    </label>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="primary-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Processing Pipeline...
                  </>
                ) : (
                  "Run OCR Engine"
                )}
              </button>

              {error && <div className="error-banner">{error}</div>}
            </div>

            {/* Right Column: Results Panel */}
            <div className="panel results-panel">
              <div className="panel-header">
                <h2>2. Extracted Data</h2>
                {extractedData && (
                  <span className="status-badge success">Success</span>
                )}
              </div>

              {!extractedData ? (
                <div className="empty-state">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  <p>Run the engine to view extracted JSON data here.</p>
                </div>
              ) : (
                <div className="result-grid">
                  <div className="result-row">
                    <span className="result-label">Full Name</span>
                    <span className="result-value">
                      {extractedData.name || "Not detected"}
                    </span>
                  </div>

                  <div className="result-row">
                    <span className="result-label">Date of Birth</span>
                    <span className="result-value">
                      {extractedData.dob || "Not detected"}
                    </span>
                  </div>

                  <div className="result-row">
                    <span className="result-label">Gender</span>
                    <span className="result-value">
                      {extractedData.gender || "Not detected"}
                    </span>
                  </div>

                  <div className="result-row highlight-row">
                    <span className="result-label">Gov ID Number</span>
                    <span className="result-value id-value">
                      {getDisplayedId(
                        extractedData.id_number || extractedData.aadhaar_no,
                        showFullId,
                      )}

                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setShowFullId(!showFullId)}
                        title={showFullId ? "Mask Data" : "Reveal Data"}
                      >
                        {showFullId ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* --- Professional Footer --- */}
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-left">
              <span className="footer-brand">DocuLens</span>
              <p className="footer-copyright">© 2026 All rights reserved.</p>
            </div>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">System Status</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
