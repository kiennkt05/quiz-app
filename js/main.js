// Theme handling
function initializeTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else if (prefersDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();

  // Add any additional initialization logic here
  console.log("Quiz App initialized");
});
