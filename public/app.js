const STORAGE_KEY = "habit-tracker-data";
const DAYS_TO_SHOW = 14;

const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitList = document.getElementById("habit-list");
const habitCount = document.getElementById("habit-count");
const todayCount = document.getElementById("today-count");
const progressChartCanvas = document.getElementById("progress-chart");
const habitChartCanvas = document.getElementById("habit-chart");

const state = loadState();

const progressChart = new Chart(progressChartCanvas, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Habits completed",
        data: [],
        borderColor: "#3e5cf6",
        backgroundColor: "rgba(62, 92, 246, 0.15)",
        tension: 0.4,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  },
});

const habitChart = new Chart(habitChartCanvas, {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        label: "Completions",
        data: [],
        backgroundColor: "rgba(62, 92, 246, 0.6)",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  },
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = habitNameInput.value.trim();
  if (!name) return;

  state.habits.push({
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    completions: {},
  });

  habitNameInput.value = "";
  saveState();
  render();
});

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { habits: [] };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
    };
  } catch (error) {
    return { habits: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getISODate(date) {
  return date.toISOString().split("T")[0];
}

function getRecentDates() {
  const dates = [];
  const today = new Date();
  for (let offset = DAYS_TO_SHOW - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    dates.push(date);
  }
  return dates;
}

function getCompletionCountForDate(dateKey) {
  return state.habits.reduce((total, habit) => {
    return total + (habit.completions?.[dateKey] ? 1 : 0);
  }, 0);
}

function getHabitTotal(habit) {
  return Object.values(habit.completions || {}).filter(Boolean).length;
}

function render() {
  habitCount.textContent = state.habits.length;
  const todayKey = getISODate(new Date());
  todayCount.textContent = getCompletionCountForDate(todayKey);

  renderHabitList(todayKey);
  updateCharts();
}

function renderHabitList(todayKey) {
  habitList.innerHTML = "";

  if (!state.habits.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Add your first habit to start tracking.";
    habitList.appendChild(empty);
    return;
  }

  state.habits.forEach((habit) => {
    const item = document.createElement("div");
    item.className = "habit-item";

    const left = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = habit.name;
    left.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "habit-meta";
    meta.textContent = `${getHabitTotal(habit)} completions · Started ${
      new Date(habit.createdAt).toLocaleDateString()
    }`;
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(habit.completions?.[todayKey]);
    checkbox.addEventListener("change", () => {
      habit.completions = habit.completions || {};
      habit.completions[todayKey] = checkbox.checked;
      saveState();
      render();
    });

    const label = document.createElement("span");
    label.textContent = "Done today";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      state.habits = state.habits.filter((item) => item.id !== habit.id);
      saveState();
      render();
    });

    right.appendChild(checkbox);
    right.appendChild(label);
    right.appendChild(removeButton);

    item.appendChild(left);
    item.appendChild(right);
    habitList.appendChild(item);
  });
}

function updateCharts() {
  const dates = getRecentDates();
  const labels = dates.map((date) =>
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  );
  const values = dates.map((date) => getCompletionCountForDate(getISODate(date)));

  progressChart.data.labels = labels;
  progressChart.data.datasets[0].data = values;
  progressChart.update();

  habitChart.data.labels = state.habits.map((habit) => habit.name);
  habitChart.data.datasets[0].data = state.habits.map((habit) => getHabitTotal(habit));
  habitChart.update();
}

render();
