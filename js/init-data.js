// Sample study sets data
const sampleStudySets = [
  {
    id: 1,
    name: "Basic Math",
    description: "Basic arithmetic operations and concepts",
    cards: [
      {
        id: 1,
        question: "What is 2 + 2?",
        answer: "4",
      },
      {
        id: 2,
        question: "What is 5 × 5?",
        answer: "25",
      },
      {
        id: 3,
        question: "What is 10 ÷ 2?",
        answer: "5",
      },
    ],
  },
  {
    id: 2,
    name: "JavaScript Basics",
    description: "Fundamental JavaScript concepts",
    cards: [
      {
        id: 1,
        question: "What is a variable in JavaScript?",
        answer: "A container for storing data values",
      },
      {
        id: 2,
        question: "What is the difference between let and const?",
        answer: "let can be reassigned, const cannot be reassigned",
      },
      {
        id: 3,
        question: "What is an array in JavaScript?",
        answer: "An ordered collection of values",
      },
    ],
  },
  {
    id: 3,
    name: "World Capitals",
    description: "Capital cities of different countries",
    cards: [
      {
        id: 1,
        question: "What is the capital of France?",
        answer: "Paris",
      },
      {
        id: 2,
        question: "What is the capital of Japan?",
        answer: "Tokyo",
      },
      {
        id: 3,
        question: "What is the capital of Brazil?",
        answer: "Brasília",
      },
    ],
  },
];

// Initialize localStorage with sample data
function initializeLocalStorage() {
  // Check if data already exists
  const existingSets = localStorage.getItem("studySets");
  if (!existingSets) {
    // Save study sets
    localStorage.setItem("studySets", JSON.stringify(sampleStudySets));

    // Initialize empty study sessions array
    localStorage.setItem("studySessions", JSON.stringify([]));

    console.log("Sample data initialized successfully!");
  } else {
    console.log("Data already exists in localStorage");
  }
}

// Call the initialization function
initializeLocalStorage();
