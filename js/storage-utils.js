// Utility functions for managing localStorage data
const StorageUtils = {
  // Get all study sets from localStorage
  getAllStudySets() {
    return JSON.parse(localStorage.getItem("studySets")) || [];
  },

  // Get all study sessions from localStorage
  getAllStudySessions() {
    return JSON.parse(localStorage.getItem("studySessions")) || [];
  },

  // Export all localStorage data to a JSON file
  exportToJson() {
    const data = {
      studySets: this.getAllStudySets(),
      studySessions: this.getAllStudySessions(),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-app-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import data from a JSON file
  importFromJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.studySets) {
            localStorage.setItem("studySets", JSON.stringify(data.studySets));
          }
          if (data.studySessions) {
            localStorage.setItem(
              "studySessions",
              JSON.stringify(data.studySessions)
            );
          }
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  },

  // Clear all localStorage data
  clearAll() {
    if (
      confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      localStorage.removeItem("studySets");
      localStorage.removeItem("studySessions");
      return true;
    }
    return false;
  },
};
