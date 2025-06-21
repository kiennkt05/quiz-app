// Study set management
class StudySetManager {
  constructor() {
    this.studySets = [];

    // DOM Elements
    this.uploadModal = document.getElementById("uploadModal");
    this.importModal = document.getElementById("importModal");
    this.uploadForm = document.getElementById("uploadForm");
    this.importForm = document.getElementById("importForm");
    this.uploadBtn = document.getElementById("uploadSetBtn");
    this.importBtn = document.getElementById("importDataBtn");
    this.exportBtn = document.getElementById("exportDataBtn");
    this.clearBtn = document.getElementById("clearDataBtn");
    this.cancelBtn = document.getElementById("cancelUpload");
    this.cancelImportBtn = document.getElementById("cancelImport");
    this.container = document.getElementById("studySetsContainer");

    this.initializeEventListeners();
    this.loadStudySets();
  }

  async loadStudySets() {
    try {
      const response = await fetch("/api/study-sets");
      this.studySets = await response.json();
      this.renderStudySets();
    } catch (error) {
      console.error("Error loading study sets:", error);
      alert("Failed to load study sets. Please try again.");
    }
  }

  initializeEventListeners() {
    // Upload modal
    this.uploadBtn.addEventListener("click", () =>
      this.showModal(this.uploadModal)
    );
    this.cancelBtn.addEventListener("click", () =>
      this.hideModal(this.uploadModal)
    );
    this.uploadForm.addEventListener("submit", (e) => this.handleUpload(e));

    // Import modal
    this.importBtn.addEventListener("click", () =>
      this.showModal(this.importModal)
    );
    this.cancelImportBtn.addEventListener("click", () =>
      this.hideModal(this.importModal)
    );
    this.importForm.addEventListener("submit", (e) => this.handleImport(e));

    // Export and Clear
    this.exportBtn.addEventListener("click", () => this.exportData());
    this.clearBtn.addEventListener("click", () => this.clearData());
  }

  showModal(modal) {
    modal.classList.add("active");
  }

  hideModal(modal) {
    modal.classList.remove("active");
    if (modal === this.uploadModal) {
      this.uploadForm.reset();
    } else if (modal === this.importModal) {
      this.importForm.reset();
    }
  }

  async handleUpload(e) {
    e.preventDefault();

    const setName = document.getElementById("setName").value;
    const file = document.getElementById("setFile").files[0];

    if (!file) return;

    try {
      const content = await this.readFile(file);
      const studySet = {
        name: setName,
        description: setName,
        cards: this.parseFileContent(content, file.type),
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

      await this.loadStudySets();
      this.hideModal(this.uploadModal);
    } catch (error) {
      console.error("Error uploading study set:", error);
      alert("Error uploading study set. Please try again.");
    }
  }

  async deleteStudySet(setId) {
    if (
      confirm(
        "Are you sure you want to delete this study set? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch(`/api/study-sets/${setId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete study set");

        await this.loadStudySets();
      } catch (error) {
        console.error("Error deleting study set:", error);
        alert("Failed to delete study set. Please try again.");
      }
    }
  }

  async exportData() {
    try {
      const [studySetsResponse, sessionsResponse] = await Promise.all([
        fetch("/api/study-sets"),
        fetch("/api/study-sessions"),
      ]);

      const studySets = await studySetsResponse.json();
      const sessions = await sessionsResponse.json();

      const data = {
        studySets,
        studySessions: sessions,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-app-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    }
  }

  async handleImport(e) {
    e.preventDefault();
    const file = document.getElementById("importFile").files[0];
    if (!file) return;

    try {
      const content = await this.readFile(file);
      const data = JSON.parse(content);

      if (data.studySets) {
        // Clear existing sets
        const response = await fetch("/api/study-sets", {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to clear existing sets");

        // Import new sets
        for (const set of data.studySets) {
          await fetch("/api/study-sets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(set),
          });
        }
      }

      await this.loadStudySets();
      this.hideModal(this.importModal);
      alert("Data imported successfully!");
    } catch (error) {
      console.error("Error importing data:", error);
      alert("Error importing data. Please make sure the file is valid.");
    }
  }

  async clearData() {
    if (
      confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch("/api/study-sets", {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to clear data");

        await this.loadStudySets();
      } catch (error) {
        console.error("Error clearing data:", error);
        alert("Failed to clear data. Please try again.");
      }
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
        cards.push({
          id: i,
          question,
          answer,
        });
      }
    }

    return cards;
  }

  renderStudySets() {
    if (!this.studySets || this.studySets.length === 0) {
      this.container.innerHTML =
        '<p class="no-sets">No study sets available. Create or upload a new set to get started!</p>';
      return;
    }

    this.container.innerHTML = this.studySets
      .map(
        (set) => `
            <div class="study-set-card">
                <h3>${set.name || "Untitled Set"}</h3>
                <p class="description">${
                  set.description || "No description available"
                }</p>
                <p class="card-count">${
                  set.cards ? set.cards.length : 0
                } cards</p>
                <p class="created-date">Created: ${new Date(
                  set.createdAt
                ).toLocaleDateString()}</p>
                <div class="study-set-actions">
                    <button class="button" onclick="window.location.href='study-session.html?id=${
                      set.id
                    }'">
                        Start Studying
                    </button>
                    <button class="button button-danger" onclick="studySetManager.deleteStudySet('${
                      set.id
                    }')">
                        Delete
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }
}

// Initialize the study set manager when the page loads
let studySetManager;
document.addEventListener("DOMContentLoaded", () => {
  studySetManager = new StudySetManager();
});
