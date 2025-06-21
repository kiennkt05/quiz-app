class CreateManager {
  constructor() {
    this.manualEntryModal = document.getElementById("manualEntryModal");
    this.fileUploadModal = document.getElementById("fileUploadModal");
    this.textInputModal = document.getElementById("textInputModal");
    this.manualEntryForm = document.getElementById("manualEntryForm");
    this.fileUploadForm = document.getElementById("fileUploadForm");
    this.textInputForm = document.getElementById("textInputForm");
    this.cardsContainer = document.getElementById("cardsContainer");

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Manual entry
    document
      .getElementById("manualEntryBtn")
      .addEventListener("click", () => this.showModal(this.manualEntryModal));
    document
      .getElementById("cancelManualEntry")
      .addEventListener("click", () => this.hideModal(this.manualEntryModal));
    document
      .getElementById("addCardBtn")
      .addEventListener("click", () => this.addCardEntry());
    this.manualEntryForm.addEventListener("submit", (e) =>
      this.handleManualEntry(e)
    );

    // Text input
    document
      .getElementById("textInputBtn")
      .addEventListener("click", () => this.showModal(this.textInputModal));
    document
      .getElementById("cancelTextInput")
      .addEventListener("click", () => this.hideModal(this.textInputModal));
    this.textInputForm.addEventListener("submit", (e) =>
      this.handleTextInput(e)
    );

    // File upload
    document
      .getElementById("fileUploadBtn")
      .addEventListener("click", () => this.showModal(this.fileUploadModal));
    document
      .getElementById("cancelFileUpload")
      .addEventListener("click", () => this.hideModal(this.fileUploadModal));
    this.fileUploadForm.addEventListener("submit", (e) =>
      this.handleFileUpload(e)
    );
  }

  showModal(modal) {
    modal.classList.add("active");
  }

  hideModal(modal) {
    modal.classList.remove("active");
    if (modal === this.manualEntryModal) {
      this.manualEntryForm.reset();
      this.cardsContainer.innerHTML = this.createCardEntryHTML();
    } else if (modal === this.textInputModal) {
      this.textInputForm.reset();
    } else {
      this.fileUploadForm.reset();
    }
  }

  createCardEntryHTML() {
    return `
            <div class="card-entry">
                <div class="form-group">
                    <label>Question</label>
                    <input type="text" class="question" required>
                </div>
                <div class="form-group">
                    <label>Answer</label>
                    <input type="text" class="answer" required>
                </div>
            </div>
        `;
  }

  addCardEntry() {
    const cardEntry = document.createElement("div");
    cardEntry.className = "card-entry";
    cardEntry.innerHTML = this.createCardEntryHTML();
    this.cardsContainer.appendChild(cardEntry);
  }

  async handleManualEntry(e) {
    e.preventDefault();

    const setName = document.getElementById("setName").value;
    const cards = Array.from(this.cardsContainer.children).map((card) => ({
      question: card.querySelector(".question").value,
      answer: card.querySelector(".answer").value,
    }));

    if (cards.length === 0) {
      alert("Please add at least one card");
      return;
    }

    const studySet = {
      name: setName,
      description: setName,
      cards,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/study-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studySet),
      });

      if (!response.ok) throw new Error("Failed to save study set");

      this.hideModal(this.manualEntryModal);
      window.location.href = "study.html";
    } catch (error) {
      console.error("Error saving study set:", error);
      alert("Failed to save study set. Please try again.");
    }
  }

  async handleTextInput(e) {
    e.preventDefault();

    const setName = document.getElementById("textSetName").value;
    const content = document.getElementById("textContent").value;

    if (!content.trim()) {
      alert("Please enter some content");
      return;
    }

    const cards = this.parseTextContent(content);

    if (cards.length === 0) {
      alert("No valid cards found. Please check the format.");
      return;
    }

    const studySet = {
      name: setName,
      description: setName,
      cards,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/study-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studySet),
      });

      if (!response.ok) throw new Error("Failed to save study set");

      this.hideModal(this.textInputModal);
      window.location.href = "study.html";
    } catch (error) {
      console.error("Error saving study set:", error);
      alert("Failed to save study set. Please try again.");
    }
  }

  parseTextContent(content) {
    const cards = [];
    const lines = content.split("\n");
    let currentQuestion = null;
    let currentAnswer = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        // Empty line indicates end of a card
        if (currentQuestion && currentAnswer) {
          cards.push({
            question: currentQuestion,
            answer: currentAnswer,
          });
          currentQuestion = null;
          currentAnswer = null;
        }
        continue;
      }

      if (!currentQuestion) {
        currentQuestion = line;
      } else if (!currentAnswer) {
        currentAnswer = line;
      }
    }

    // Add the last card if exists
    if (currentQuestion && currentAnswer) {
      cards.push({
        question: currentQuestion,
        answer: currentAnswer,
      });
    }

    return cards;
  }

  async handleFileUpload(e) {
    e.preventDefault();

    const setName = document.getElementById("uploadSetName").value;
    const file = document.getElementById("setFile").files[0];

    if (!file) return;

    try {
      const content = await this.readFile(file);
      const cards = this.parseFileContent(content, file.type);

      const studySet = {
        name: setName,
        description: setName,
        cards,
        createdAt: new Date().toISOString(),
      };

      const response = await fetch("/api/study-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studySet),
      });

      if (!response.ok) throw new Error("Failed to save study set");

      this.hideModal(this.fileUploadModal);
      window.location.href = "study.html";
    } catch (error) {
      console.error("Error uploading study set:", error);
      alert("Error uploading study set. Please try again.");
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  parseFileContent(content, fileType) {
    if (fileType === "application/json") {
      return JSON.parse(content);
    } else if (fileType === "text/csv") {
      return this.parseCSV(content);
    }
    throw new Error("Unsupported file type");
  }

  parseCSV(content) {
    const lines = content.split("\n");
    const cards = [];

    for (let i = 1; i < lines.length; i++) {
      const [question, answer] = lines[i].split(",").map((item) => item.trim());
      if (question && answer) {
        cards.push({ question, answer });
      }
    }

    return cards;
  }
}

// Initialize the create manager when the page loads
let createManager;
document.addEventListener("DOMContentLoaded", () => {
  createManager = new CreateManager();
});
