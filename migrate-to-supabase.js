const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("./supabase-config");

// File paths for existing data
const STUDY_SETS_FILE = path.join(__dirname, "data", "study-sets.json");
const STUDY_SESSIONS_FILE = path.join(__dirname, "data", "study-sessions.json");

async function migrateData() {
  console.log("Starting migration to Supabase...");

  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "❌ Supabase configuration missing. Please check your config.env file."
      );
      return;
    }

    // Migrate study sets
    console.log("📚 Migrating study sets...");
    await migrateStudySets();

    // Migrate study sessions
    console.log("📊 Migrating study sessions...");
    await migrateStudySessions();

    console.log("✅ Migration completed successfully!");
    console.log(
      "You can now delete the data/ directory if you want to rely solely on Supabase."
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

async function migrateStudySets() {
  try {
    // Read existing study sets
    const studySetsData = await fs.readFile(STUDY_SETS_FILE, "utf8");
    const studySets = JSON.parse(studySetsData);

    if (studySets.length === 0) {
      console.log("   No study sets to migrate");
      return;
    }

    console.log(`   Found ${studySets.length} study sets to migrate`);

    for (const studySet of studySets) {
      // Insert study set
      const { data: newStudySet, error: studySetError } = await supabase
        .from("study_sets")
        .insert([
          {
            title: studySet.title,
            description: studySet.description || "",
            is_public: studySet.is_public || false,
            created_at: studySet.created_at || new Date().toISOString(),
            updated_at: studySet.updated_at || new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (studySetError) {
        console.error(
          `   Error migrating study set "${studySet.title}":`,
          studySetError
        );
        continue;
      }

      console.log(`   ✅ Migrated study set: ${studySet.title}`);

      // Migrate flashcards for this study set
      if (studySet.flashcards && studySet.flashcards.length > 0) {
        await migrateFlashcards(studySet.flashcards, newStudySet.id);
      }
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("   No study-sets.json file found");
    } else {
      throw error;
    }
  }
}

async function migrateFlashcards(flashcards, studySetId) {
  console.log(`   📝 Migrating ${flashcards.length} flashcards...`);

  for (let i = 0; i < flashcards.length; i++) {
    const flashcard = flashcards[i];

    const { error } = await supabase.from("flashcards").insert([
      {
        study_set_id: studySetId,
        question: flashcard.question,
        answer: flashcard.answer,
        order_index: i,
        created_at: flashcard.created_at || new Date().toISOString(),
        updated_at: flashcard.updated_at || new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error(`   Error migrating flashcard ${i + 1}:`, error);
    }
  }

  console.log(`   ✅ Migrated ${flashcards.length} flashcards`);
}

async function migrateStudySessions() {
  try {
    // Read existing study sessions
    const sessionsData = await fs.readFile(STUDY_SESSIONS_FILE, "utf8");
    const sessions = JSON.parse(sessionsData);

    if (sessions.length === 0) {
      console.log("   No study sessions to migrate");
      return;
    }

    console.log(`   Found ${sessions.length} study sessions to migrate`);

    for (const session of sessions) {
      const { error } = await supabase.from("study_sessions").insert([
        {
          study_set_id: session.study_set_id,
          started_at: session.started_at || new Date().toISOString(),
          completed_at: session.completed_at,
          total_cards: session.total_cards || 0,
          correct_answers: session.correct_answers || 0,
          incorrect_answers: session.incorrect_answers || 0,
        },
      ]);

      if (error) {
        console.error(`   Error migrating session ${session.id}:`, error);
      } else {
        console.log(`   ✅ Migrated study session: ${session.id}`);
      }
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("   No study-sessions.json file found");
    } else {
      throw error;
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
