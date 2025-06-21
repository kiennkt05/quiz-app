class AnalyticsManager {
  constructor() {
    this.studySets = [];
    this.studySessions = [];

    // Chart instances
    this.sessionsChart = null;
    this.performanceChart = null;

    this.loadData();
  }

  async loadData() {
    try {
      const [setsResponse, sessionsResponse] = await Promise.all([
        fetch("/api/analytics/study-sets"),
        fetch("/api/analytics/sessions"),
      ]);

      if (!setsResponse.ok || !sessionsResponse.ok) {
        throw new Error("Failed to load analytics data.");
      }

      this.studySets = await setsResponse.json();
      this.studySessions = await sessionsResponse.json();

      this.renderSummary();
      this.renderStudySets();
      this.renderCharts();
    } catch (error) {
      console.error("Error loading analytics:", error);
      document.querySelector(".container").innerHTML =
        "<p>Could not load analytics data.</p>";
    }
  }

  renderSummary() {
    const totalTime = this.studySessions.reduce((acc, session) => {
      if (session.started_at && session.completed_at) {
        const start = new Date(session.started_at);
        const end = new Date(session.completed_at);
        return acc + (end - start);
      }
      return acc;
    }, 0);
    const totalMinutes = Math.round(totalTime / (1000 * 60));
    const averageMinutes =
      this.studySessions.length > 0
        ? Math.round(totalMinutes / this.studySessions.length)
        : 0;

    document.getElementById(
      "totalTime"
    ).textContent = `${totalMinutes} minutes`;
    document.getElementById(
      "averageTime"
    ).textContent = `${averageMinutes} minutes`;
  }

  renderStudySets() {
    const setsList = document.getElementById("setsList");
    if (this.studySets.length === 0) {
      setsList.innerHTML = "<p>No study sets available.</p>";
      return;
    }

    setsList.innerHTML = `
      <ul>
        ${this.studySets
          .map(
            (set) => `
          <li>
            <strong>${set.title}</strong>
            <span>${set.flashcards.count || 0} cards</span>
            <span>Studied ${set.study_sessions.count || 0} times</span>
          </li>
        `
          )
          .join("")}
      </ul>
    `;
  }

  renderCharts() {
    this.renderSessionsChart();
    this.renderPerformanceChart();
  }

  renderSessionsChart() {
    const ctx = document.getElementById("sessionsChart").getContext("2d");
    const labels = this.studySessions
      .slice(0, 10)
      .reverse()
      .map((s) => new Date(s.started_at).toLocaleDateString());
    const data = this.studySessions
      .slice(0, 10)
      .reverse()
      .map((s) => {
        if (s.total_cards > 0) {
          return (s.correct_answers / s.total_cards) * 100;
        }
        return 0;
      });

    if (this.sessionsChart) {
      this.sessionsChart.destroy();
    }

    this.sessionsChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Session Score (%)",
            data: data,
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  }

  renderPerformanceChart() {
    const ctx = document.getElementById("performanceChart").getContext("2d");
    const labels = this.studySets.map((s) => s.title);
    const data = this.studySets.map((set) => {
      const relevantSessions = this.studySessions.filter(
        (session) => session.study_set_id === set.id
      );
      if (relevantSessions.length === 0) return 0;

      const totalCorrect = relevantSessions.reduce(
        (sum, s) => sum + s.correct_answers,
        0
      );
      const totalCards = relevantSessions.reduce(
        (sum, s) => sum + s.total_cards,
        0
      );

      return totalCards > 0 ? (totalCorrect / totalCards) * 100 : 0;
    });

    if (this.performanceChart) {
      this.performanceChart.destroy();
    }

    this.performanceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Average Performance (%)",
            data: data,
            backgroundColor: "#3498db",
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: "y",
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AnalyticsManager();
});
