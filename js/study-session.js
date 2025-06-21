class StudySession {
  constructor() {
    this.currentSet = null;
    this.sessionId = null; // To store the ID of the current DB session record
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.startTime = null;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
    this.totalCards = 0;
    this.currentMode = "flashcards";
    this.userAnswers = []; // To store answers during Test mode
    this.testQuestions = []; // Shuffled questions for the current test

    // DOM Elements
    this.setTitle = document.getElementById("setTitle");
    this.progressBar = document.getElementById("progressBar");
    this.progressText = document.getElementById("progressText");
    this.timerDisplay = document.getElementById("timerDisplay");
    this.accuracyDisplay = document.getElementById("accuracyDisplay");
    this.modeSelect = document.getElementById("modeSelect");

    // Mode Containers
    this.flashcardContainer = document.getElementById("flashcardContainer");
    this.learnContainer = document.getElementById("learnContainer");
    this.testContainer = document.getElementById("testContainer");
    this.resultsContainer = document.getElementById("resultsContainer");
    this.cardContainer = document.getElementById("cardContainer");

    // Controls
    this.flipButton = document.getElementById("flipButton");
    this.nextButton = document.getElementById("nextButton");
    this.previousButton = document.getElementById("previousButton");

    this.initializeEventListeners();
    this.loadStudySet();
  }

  async loadStudySet() {
    const urlParams = new URLSearchParams(window.location.search);
    const setId = urlParams.get("id");

    if (!setId) {
      alert("No study set selected!");
      window.location.href = "study.html";
      return;
    }

    try {
      const response = await fetch(`/api/study-sets/${setId}`);
      if (!response.ok) throw new Error("Failed to load study set");

      this.currentSet = await response.json();
      this.totalCards = this.currentSet.cards.length;
      this.setTitle.textContent = this.currentSet.name;
      this.renderCard();
      this.updateProgress();
      this.startTimer();

      // Create a session record as soon as the set is loaded
      await this.createSession();
    } catch (error) {
      console.error("Error loading study set:", error);
      alert("Failed to load study set. Please try again.");
      window.location.href = "study.html";
    }
  }

  initializeEventListeners() {
    this.flipButton.addEventListener("click", () => this.flipCard());
    this.nextButton.addEventListener("click", () => this.nextCard());
    this.previousButton.addEventListener("click", () => this.previousCard());
    this.modeSelect.addEventListener("change", () => this.changeMode());

    // Allow clicking the card itself to flip it
    this.cardContainer.addEventListener("click", (event) => {
      // We check if the click target is within the card element.
      // This allows clicking on the card's text or padding to trigger the flip.
      if (event.target.closest(".card")) {
        this.flipCard();
      }
    });

    // Add a listener to save progress if the user leaves the page
    window.addEventListener("beforeunload", (e) => this.finishSession(true));
  }

  flipCard() {
    this.isFlipped = !this.isFlipped;
    this.renderCard();
  }

  nextCard() {
    if (this.currentCardIndex < this.totalCards - 1) {
      this.currentCardIndex++;
      this.isFlipped = false;
      this.renderCard();
      this.updateProgress();
    }
  }

  previousCard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      this.isFlipped = false;
      this.renderCard();
      this.updateProgress();
    }
  }

  renderCard() {
    if (!this.currentSet || !this.currentSet.cards[this.currentCardIndex]) {
      this.cardContainer.innerHTML =
        '<p class="no-cards">No cards available in this set.</p>';
      return;
    }

    const card = this.currentSet.cards[this.currentCardIndex];

    this.cardContainer.innerHTML = `
      <div class="card ${this.isFlipped ? "flipped" : ""}">
        <div class="card-inner">
          <div class="card-front">
            <h3>Question</h3>
            <p>${card.question}</p>
          </div>
          <div class="card-back">
            <h3>Answer</h3>
            <p>${card.answer}</p>
            <div id="srs-controls" class="srs-controls">
                <p>How well did you know this?</p>
                <button class="button srs-button" data-rating="1">Hard</button>
                <button class="button srs-button" data-rating="2">Good</button>
                <button class="button srs-button" data-rating="3">Easy</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for the new SRS buttons
    document.querySelectorAll(".srs-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const rating = parseInt(e.target.getAttribute("data-rating"));
        this.handleSrsReview(rating);
      });
    });
  }

  updateProgress() {
    const progress = ((this.currentCardIndex + 1) / this.totalCards) * 100;
    this.progressBar.style.width = `${progress}%`;
    this.progressText.textContent = `${this.currentCardIndex + 1} / ${
      this.totalCards
    }`;
  }

  startTimer() {
    this.startTime = new Date();
    this.updateTimer();
    setInterval(() => this.updateTimer(), 1000);
  }

  updateTimer() {
    const now = new Date();
    const elapsed = Math.floor((now - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    this.timerDisplay.textContent = `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  changeMode() {
    const newMode = this.modeSelect.value;
    if (newMode === this.currentMode) return;
    this.currentMode = newMode;

    // Reset UI
    this.isFlipped = false;
    this.currentCardIndex = 0;
    this.updateProgress();

    // Hide all mode containers
    this.flashcardContainer.classList.remove("active");
    this.learnContainer.classList.remove("active");
    this.testContainer.classList.remove("active");
    this.resultsContainer.classList.remove("active");

    switch (this.currentMode) {
      case "flashcards":
        this.flashcardContainer.classList.add("active");
        this.renderCard();
        break;
      case "learn":
        this.learnContainer.classList.add("active");
        this.renderLearnCard();
        break;
      case "test":
        this.testContainer.classList.add("active");
        this.startTest();
        break;
    }
  }

  renderLearnCard() {
    if (!this.currentSet || !this.currentSet.cards[this.currentCardIndex]) {
      this.learnContainer.innerHTML =
        '<p class="no-cards">No cards to learn in this set.</p>';
      return;
    }

    const card = this.currentSet.cards[this.currentCardIndex];
    this.learnContainer.innerHTML = `
      <div class="learn-card">
        <h2>Question</h2>
        <p>${card.question}</p>
        <div class="answer-input">
          <input type="text" id="learnAnswerInput" placeholder="Type your answer here...">
          <button id="checkAnswerBtn" class="button">Check</button>
        </div>
        <div id="feedbackContainer"></div>
      </div>
    `;

    document
      .getElementById("checkAnswerBtn")
      .addEventListener("click", () => this.checkLearnAnswer());
    document
      .getElementById("learnAnswerInput")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.checkLearnAnswer();
        }
      });
  }

  checkLearnAnswer() {
    const userAnswer = document.getElementById("learnAnswerInput").value.trim();
    const correctAnswer =
      this.currentSet.cards[this.currentCardIndex].answer.trim();
    const feedbackContainer = document.getElementById("feedbackContainer");

    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
      this.correctAnswers++;
      feedbackContainer.innerHTML = '<p class="correct">Correct!</p>';
    } else {
      this.incorrectAnswers++;
      feedbackContainer.innerHTML = `<p class="incorrect">Incorrect. The correct answer is: <strong>${correctAnswer}</strong></p>`;
    }

    // Disable input and check button
    document.getElementById("learnAnswerInput").disabled = true;
    document.getElementById("checkAnswerBtn").style.display = "none";

    // Show next button
    const nextButton = document.createElement("button");
    nextButton.id = "learnNextBtn";
    nextButton.textContent = "Next";
    nextButton.className = "button";
    nextButton.addEventListener("click", () => this.nextLearnCard());
    feedbackContainer.appendChild(nextButton);

    this.updateStats();

    // Update session progress after checking the answer
    this.updateSession();
  }

  nextLearnCard() {
    if (this.currentCardIndex < this.totalCards - 1) {
      this.currentCardIndex++;
      this.renderLearnCard();
      this.updateProgress();
    } else {
      // End of set
      this.learnContainer.innerHTML = `<div class="learn-card"><h2>Congratulations!</h2><p>You've completed this learn session.</p><p>Final Score: ${this.correctAnswers}/${this.totalCards}</p></div>`;
    }
  }

  updateStats() {
    const totalAnswered = this.correctAnswers + this.incorrectAnswers;
    if (totalAnswered > 0) {
      const accuracy = Math.round((this.correctAnswers / totalAnswered) * 100);
      this.accuracyDisplay.textContent = `${accuracy}%`;
    }
  }

  startTest() {
    if (!this.currentSet || this.currentSet.cards.length < 4) {
      this.testContainer.innerHTML = `
        <div class="test-card">
            <h2>Test Mode Not Available</h2>
            <p>You need at least 4 cards in a study set to start a test.</p>
        </div>`;
      return;
    }

    // Reset state for a new test
    this.currentCardIndex = 0;
    this.correctAnswers = 0;
    this.userAnswers = [];
    this.testQuestions = this.shuffleArray([...this.currentSet.cards]); // Shuffle questions for the test
    this.updateProgress();
    this.renderTestCard();
  }

  renderTestCard() {
    if (this.currentCardIndex >= this.testQuestions.length) {
      this.finishTest();
      return;
    }

    const card = this.testQuestions[this.currentCardIndex];
    const options = this.generateTestOptions(card);

    this.testContainer.innerHTML = `
      <div class="test-card">
        <h2>Question ${this.currentCardIndex + 1} of ${
      this.testQuestions.length
    }</h2>
        <p>${card.question}</p>
        <div class="multiple-choice">
          ${options
            .map(
              (option) => `
            <button class="choice-option">${option}</button>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    document.querySelectorAll(".choice-option").forEach((button) => {
      button.addEventListener("click", (e) => this.selectTestAnswer(e.target));
    });
  }

  generateTestOptions(currentCard) {
    const allAnswers = this.currentSet.cards.map((c) => c.answer);
    const correctAnswer = currentCard.answer;

    // Filter out the correct answer to create a pool of incorrect options
    let incorrectOptions = allAnswers.filter(
      (answer) => answer !== correctAnswer
    );

    // Shuffle the incorrect options and pick the first 3
    incorrectOptions = this.shuffleArray(incorrectOptions).slice(0, 3);

    // Combine and shuffle the final options
    const finalOptions = this.shuffleArray([
      correctAnswer,
      ...incorrectOptions,
    ]);
    return finalOptions;
  }

  selectTestAnswer(selectedButton) {
    const selectedAnswer = selectedButton.textContent;
    const card = this.testQuestions[this.currentCardIndex];
    const isCorrect =
      selectedAnswer.trim().toLowerCase() === card.answer.trim().toLowerCase();

    // Disable all option buttons to prevent changing the answer
    const allOptions = document.querySelectorAll(".choice-option");
    allOptions.forEach((button) => {
      button.disabled = true;
    });

    if (isCorrect) {
      this.correctAnswers++;
      selectedButton.classList.add("correct-choice");
    } else {
      this.incorrectAnswers++;
      selectedButton.classList.add("incorrect-choice");
      // Find and highlight the correct answer so the user can learn
      allOptions.forEach((button) => {
        if (
          button.textContent.trim().toLowerCase() ===
          card.answer.trim().toLowerCase()
        ) {
          button.classList.add("correct-answer-highlight");
        }
      });
    }

    this.updateStats();

    // Store the result for the final review page
    this.userAnswers.push({
      question: card.question,
      selectedAnswer: selectedAnswer,
      correctAnswer: card.answer,
      isCorrect: isCorrect,
    });

    // Add a "Next" button to allow the user to proceed
    const testCard = document.querySelector(".test-card");
    const nextButton = document.createElement("button");
    nextButton.id = "testNextBtn";
    nextButton.textContent = "Next";
    nextButton.className = "button";
    nextButton.style.marginTop = "1.5rem";
    nextButton.addEventListener("click", () => this.nextTestCard());
    testCard.appendChild(nextButton);

    // Update session progress after selecting an answer
    this.updateSession();
  }

  nextTestCard() {
    this.currentCardIndex++;
    this.updateProgress();
    this.renderTestCard();
  }

  finishTest() {
    const score = (this.correctAnswers / this.testQuestions.length) * 100;
    this.resultsContainer.classList.add("active");
    this.testContainer.classList.remove("active");

    this.resultsContainer.innerHTML = `
      <div class="results-content">
        <h2>Test Complete!</h2>
        <div class="result-stats">
          <p>Your Score: <strong>${score.toFixed(1)}%</strong></p>
          <p>Correct: <strong>${this.correctAnswers} / ${
      this.testQuestions.length
    }</strong></p>
        </div>
        <h3>Review Your Answers</h3>
        <div class="review-area">
          ${this.userAnswers
            .map(
              (answer) => `
            <div class="review-item ${
              answer.isCorrect ? "correct" : "incorrect"
            }">
              <p class="review-question"><strong>Q:</strong> ${
                answer.question
              }</p>
              <p class="review-user-answer"><strong>Your Answer:</strong> ${
                answer.selectedAnswer
              }</p>
              ${
                !answer.isCorrect
                  ? `<p class="review-correct-answer"><strong>Correct Answer:</strong> ${answer.correctAnswer}</p>`
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
        <button id="restartTestBtn" class="button">Restart Test</button>
      </div>
    `;

    document.getElementById("restartTestBtn").addEventListener("click", () => {
      this.resultsContainer.classList.remove("active");
      this.changeMode(); // Re-triggers the test setup
    });

    // Mark the session as complete
    this.finishSession();
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async createSession() {
    if (!this.currentSet) return;

    try {
      const response = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_set_id: this.currentSet.id,
          total_cards: this.totalCards,
        }),
      });

      if (!response.ok) throw new Error("Failed to create session");

      const sessionData = await response.json();
      this.sessionId = sessionData.id; // Save the new session ID
      console.log("Session started with ID:", this.sessionId);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  }

  async updateSession(isFinishing = false) {
    if (!this.sessionId) return;

    const payload = {
      correct_answers: this.correctAnswers,
      incorrect_answers: this.incorrectAnswers,
    };

    if (isFinishing) {
      payload.completed_at = new Date().toISOString();
    }

    try {
      // Use 'keepalive' for unload events to increase chance of success
      await fetch(`/api/study-sessions/${this.sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: isFinishing,
      });
    } catch (error) {
      console.error("Error updating session:", error);
    }
  }

  // This will be our new final save method
  async finishSession(isUnloading = false) {
    if (!this.sessionId) return;
    console.log(`Finishing session ${this.sessionId}.`);
    await this.updateSession(true);
    if (!isUnloading) {
      this.sessionId = null; // Prevent further updates
    }
  }

  handleSrsReview(rating) {
    const card = this.currentSet.cards[this.currentCardIndex];

    // --- Simple SM-2 based SRS Algorithm ---
    let { srs_level, ease_factor, next_review_at } = card;

    if (rating >= 2) {
      // Correctly recalled (Good or Easy)
      if (srs_level === 0) {
        card.srs_level = 1;
        card.interval = 1; // 1 day
      } else if (srs_level === 1) {
        card.srs_level = 2;
        card.interval = 6; // 6 days
      } else {
        card.srs_level += 1;
        card.interval = Math.ceil(card.interval * ease_factor);
      }
    } else {
      // Incorrectly recalled (Hard)
      card.srs_level = 0; // Reset progress
      card.interval = 1; // Review again tomorrow
    }

    // Adjust ease factor
    card.ease_factor =
      ease_factor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02));
    if (card.ease_factor < 1.3) card.ease_factor = 1.3; // Minimum ease factor

    // Calculate next review date
    const now = new Date();
    card.next_review_at = new Date(now.setDate(now.getDate() + card.interval));

    // --- End of Algorithm ---

    // Send the update to the server
    this.updateSrsData(card);

    // Move to the next card
    this.nextCard();
  }

  async updateSrsData(card) {
    try {
      await fetch(`/api/flashcards/${card.id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          srs_level: card.srs_level,
          ease_factor: card.ease_factor,
          next_review_at: card.next_review_at.toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to update SRS data for card:", card.id, error);
    }
  }
}

// Initialize the study session when the page loads
let studySession;
document.addEventListener("DOMContentLoaded", () => {
  studySession = new StudySession();
});
