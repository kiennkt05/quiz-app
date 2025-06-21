const express = require("express");
const cors = require("cors");
const { supabase } = require("./supabase-config");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// API Routes for Study Sets
app.get("/api/study-sets", async (req, res) => {
  try {
    const { data: studySets, error } = await supabase
      .from("study_sets")
      .select(
        `
        *,
        flashcards(*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data to match the frontend format
    const transformedData = studySets.map((set) => ({
      id: set.id,
      name: set.title, // frontend expects 'name'
      title: set.title,
      description: set.description,
      createdAt: set.created_at, // frontend expects 'createdAt'
      created_at: set.created_at,
      updated_at: set.updated_at,
      is_public: set.is_public,
      cards: set.flashcards || [], // frontend expects 'cards'
      flashcards: set.flashcards || [],
    }));

    res.json(transformedData || []);
  } catch (error) {
    console.error("Error fetching study sets:", error);
    res.status(500).json({ error: "Failed to read study sets" });
  }
});

app.get("/api/study-sets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: studySet, error } = await supabase
      .from("study_sets")
      .select(
        `
        *,
        flashcards(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!studySet) {
      return res.status(404).json({ error: "Study set not found" });
    }

    // Transform the data to match the frontend format
    const transformedData = {
      id: studySet.id,
      name: studySet.title, // frontend expects 'name'
      title: studySet.title,
      description: studySet.description,
      createdAt: studySet.created_at, // frontend expects 'createdAt'
      created_at: studySet.created_at,
      updated_at: studySet.updated_at,
      is_public: studySet.is_public,
      cards: studySet.flashcards || [], // frontend expects 'cards'
      flashcards: studySet.flashcards || [],
    };

    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching study set:", error);
    res.status(500).json({ error: "Failed to read study set" });
  }
});

app.post("/api/study-sets", async (req, res) => {
  try {
    // Handle both old frontend format and new Supabase format
    const {
      title,
      name, // old format
      description,
      is_public = false,
      cards, // old format - will be handled separately
      createdAt, // old format
    } = req.body;

    // Use title if provided, otherwise use name (old format)
    const studySetTitle = title || name;

    if (!studySetTitle) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Create the study set
    const { data: studySet, error: studySetError } = await supabase
      .from("study_sets")
      .insert([
        {
          title: studySetTitle,
          description: description || studySetTitle,
          is_public,
        },
      ])
      .select()
      .single();

    if (studySetError) throw studySetError;

    // If cards were provided (old format), create flashcards
    if (cards && Array.isArray(cards) && cards.length > 0) {
      const flashcardData = cards.map((card, index) => ({
        study_set_id: studySet.id,
        question: card.question,
        answer: card.answer,
        order_index: index,
      }));

      const { error: flashcardError } = await supabase
        .from("flashcards")
        .insert(flashcardData);

      if (flashcardError) {
        console.error("Error creating flashcards:", flashcardError);
        // Don't fail the entire request, just log the error
      }
    }

    res.json(studySet);
  } catch (error) {
    console.error("Error creating study set:", error);
    res.status(500).json({ error: "Failed to save study set" });
  }
});

app.put("/api/study-sets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_public } = req.body;

    const { data, error } = await supabase
      .from("study_sets")
      .update({ title, description, is_public })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error updating study set:", error);
    res.status(500).json({ error: "Failed to update study set" });
  }
});

app.delete("/api/study-sets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("study_sets").delete().eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting study set:", error);
    res.status(500).json({ error: "Failed to delete study set" });
  }
});

// API Routes for Flashcards
app.get("/api/study-sets/:id/flashcards", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("study_set_id", id)
      .order("order_index", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({ error: "Failed to read flashcards" });
  }
});

app.post("/api/study-sets/:id/flashcards", async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, order_index } = req.body;

    const { data, error } = await supabase
      .from("flashcards")
      .insert([
        {
          study_set_id: id,
          question,
          answer,
          order_index: order_index || 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error creating flashcard:", error);
    res.status(500).json({ error: "Failed to save flashcard" });
  }
});

app.put("/api/flashcards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, order_index } = req.body;

    const { data, error } = await supabase
      .from("flashcards")
      .update({ question, answer, order_index })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error updating flashcard:", error);
    res.status(500).json({ error: "Failed to update flashcard" });
  }
});

app.put("/api/flashcards/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const { srs_level, ease_factor, next_review_at } = req.body;

    // Basic validation
    if (
      srs_level === undefined ||
      ease_factor === undefined ||
      next_review_at === undefined
    ) {
      return res.status(400).json({ error: "Missing SRS data for review." });
    }

    const { data, error } = await supabase
      .from("flashcards")
      .update({ srs_level, ease_factor, next_review_at })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error updating flashcard review data:", error);
    res.status(500).json({ error: "Failed to update flashcard review data" });
  }
});

app.delete("/api/flashcards/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("flashcards").delete().eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    res.status(500).json({ error: "Failed to delete flashcard" });
  }
});

// API Routes for Study Sessions
app.get("/api/study-sessions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("study_sessions")
      .select(
        `
        *,
        study_sets(title)
      `
      )
      .order("started_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    res.status(500).json({ error: "Failed to read study sessions" });
  }
});

app.post("/api/study-sessions", async (req, res) => {
  try {
    const { study_set_id, total_cards } = req.body;

    const { data, error } = await supabase
      .from("study_sessions")
      .insert([
        {
          study_set_id,
          total_cards,
          correct_answers: 0,
          incorrect_answers: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error creating study session:", error);
    res.status(500).json({ error: "Failed to save study session" });
  }
});

app.put("/api/study-sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_at, correct_answers, incorrect_answers } = req.body;

    const { data, error } = await supabase
      .from("study_sessions")
      .update({ completed_at, correct_answers, incorrect_answers })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error updating study session:", error);
    res.status(500).json({ error: "Failed to update study session" });
  }
});

// API Routes for Session Answers
app.post("/api/session-answers", async (req, res) => {
  try {
    const { session_id, flashcard_id, is_correct, time_taken_ms } = req.body;

    const { data, error } = await supabase
      .from("session_answers")
      .insert([
        {
          session_id,
          flashcard_id,
          is_correct,
          time_taken_ms,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error creating session answer:", error);
    res.status(500).json({ error: "Failed to save session answer" });
  }
});

// Analytics API Routes
app.get("/api/analytics/study-sets", async (req, res) => {
  try {
    const { data, error } = await supabase.from("study_sets").select(`
        *,
        flashcards(count),
        study_sessions(count)
      `);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/analytics/sessions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("study_sessions")
      .select(
        `
        *,
        study_sets(title),
        session_answers(count)
      `
      )
      .order("started_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching session analytics:", error);
    res.status(500).json({ error: "Failed to fetch session analytics" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log("Supabase integration enabled");
});
