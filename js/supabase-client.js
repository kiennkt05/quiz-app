// Client-side Supabase configuration
// This file should be included in your HTML files to enable client-side Supabase operations

// Supabase configuration - replace with your actual values
const SUPABASE_URL = "your_supabase_project_url";
const SUPABASE_ANON_KEY = "your_supabase_anon_key";

// Initialize Supabase client for browser
let supabase;

// Check if Supabase is available (for client-side usage)
if (typeof window !== "undefined" && window.supabase) {
  supabase = window.supabase;
} else {
  // Fallback: create a simple API wrapper for client-side operations
  supabase = {
    // Study Sets
    async getStudySets() {
      const response = await fetch("/api/study-sets");
      return response.json();
    },

    async createStudySet(studySet) {
      const response = await fetch("/api/study-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studySet),
      });
      return response.json();
    },

    async updateStudySet(id, studySet) {
      const response = await fetch(`/api/study-sets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studySet),
      });
      return response.json();
    },

    async deleteStudySet(id) {
      const response = await fetch(`/api/study-sets/${id}`, {
        method: "DELETE",
      });
      return response.json();
    },

    // Flashcards
    async getFlashcards(studySetId) {
      const response = await fetch(`/api/study-sets/${studySetId}/flashcards`);
      return response.json();
    },

    async createFlashcard(studySetId, flashcard) {
      const response = await fetch(`/api/study-sets/${studySetId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flashcard),
      });
      return response.json();
    },

    async updateFlashcard(id, flashcard) {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flashcard),
      });
      return response.json();
    },

    async deleteFlashcard(id) {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
      });
      return response.json();
    },

    // Study Sessions
    async getStudySessions() {
      const response = await fetch("/api/study-sessions");
      return response.json();
    },

    async createStudySession(session) {
      const response = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });
      return response.json();
    },

    async updateStudySession(id, session) {
      const response = await fetch(`/api/study-sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });
      return response.json();
    },

    // Session Answers
    async createSessionAnswer(answer) {
      const response = await fetch("/api/session-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });
      return response.json();
    },

    // Analytics
    async getAnalytics() {
      const response = await fetch("/api/analytics/study-sets");
      return response.json();
    },

    async getSessionAnalytics() {
      const response = await fetch("/api/analytics/sessions");
      return response.json();
    },
  };
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { supabase };
} else {
  // Make available globally for browser usage
  window.supabaseClient = supabase;
}
