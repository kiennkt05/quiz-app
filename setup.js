const { supabase } = require("./supabase-config");

async function testConnection() {
  console.log("🔍 Testing Supabase connection...");

  try {
    // Test basic connection by querying study_sets table
    const { data, error } = await supabase
      .from("study_sets")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Connection failed:", error.message);
      console.log("\n📋 Troubleshooting steps:");
      console.log(
        "1. Check your config.env file has correct Supabase credentials"
      );
      console.log("2. Ensure your Supabase project is active");
      console.log("3. Verify the database schema has been created");
      console.log("4. Check that your service role key is correct");
      return false;
    }

    console.log("✅ Supabase connection successful!");
    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return false;
  }
}

async function checkTables() {
  console.log("\n📊 Checking database tables...");

  const tables = [
    "study_sets",
    "flashcards",
    "study_sessions",
    "session_answers",
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("*").limit(1);

      if (error) {
        console.log(`❌ Table '${table}' not found or inaccessible`);
      } else {
        console.log(`✅ Table '${table}' is ready`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}':`, error.message);
    }
  }
}

async function createSampleData() {
  console.log("\n📝 Creating sample data...");

  try {
    // Create a sample study set
    const { data: studySet, error: studySetError } = await supabase
      .from("study_sets")
      .insert([
        {
          title: "Sample Study Set",
          description: "This is a sample study set created during setup",
          is_public: true,
        },
      ])
      .select()
      .single();

    if (studySetError) {
      console.error("❌ Error creating sample study set:", studySetError);
      return;
    }

    console.log("✅ Created sample study set");

    // Create sample flashcards
    const sampleFlashcards = [
      { question: "What is the capital of France?", answer: "Paris" },
      { question: "What is 2 + 2?", answer: "4" },
      {
        question: "What is the largest planet in our solar system?",
        answer: "Jupiter",
      },
    ];

    for (const flashcard of sampleFlashcards) {
      const { error } = await supabase.from("flashcards").insert([
        {
          study_set_id: studySet.id,
          question: flashcard.question,
          answer: flashcard.answer,
          order_index: sampleFlashcards.indexOf(flashcard),
        },
      ]);

      if (error) {
        console.error("❌ Error creating sample flashcard:", error);
      }
    }

    console.log("✅ Created sample flashcards");
    console.log("\n🎉 Setup complete! You can now:");
    console.log("1. Start the server: npm run dev");
    console.log("2. Open http://localhost:3000 in your browser");
    console.log("3. Try creating and studying with the sample data");
  } catch (error) {
    console.error("❌ Error creating sample data:", error);
  }
}

async function runSetup() {
  console.log("🚀 Quiz App Supabase Setup\n");

  // Test connection
  const isConnected = await testConnection();

  if (!isConnected) {
    console.log(
      "\n❌ Setup cannot continue without a valid Supabase connection."
    );
    console.log("Please check your configuration and try again.");
    return;
  }

  // Check tables
  await checkTables();

  // Ask user if they want to create sample data
  console.log("\n❓ Would you like to create sample data for testing? (y/n)");

  // For now, we'll create sample data automatically
  // In a real implementation, you'd want to read user input
  await createSampleData();
}

// Run setup if this file is executed directly
if (require.main === module) {
  runSetup();
}

module.exports = { testConnection, checkTables, createSampleData };
