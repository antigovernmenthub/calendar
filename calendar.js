const PLANNER_STORAGE_KEY = "complete-planner-tasks-v2";
const THEME_KEY = "complete-planner-theme-v2";

let currentDate = new Date();
let tasks = [];
let selectedDate = null;

// Load tasks from planner storage
function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY) || "[]");
  } catch {
    tasks = [];
  }
}

// Theme
function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");

  if (savedTheme === "light") {
    document.documentElement.classList.add("light");
    if (icon && label) {
      icon.textContent = "☀";
      label.textContent = "Light";
    }
  }
}

function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");
  if (!btn || !icon || !label) return;

  btn.addEventListener("click", () => {
    const root = document.documentElement;
    const isLight = root.classList.toggle("light");
    if (isLight) {
      icon.textContent = "☀";
      label.textContent = "Light";
      localStorage.setItem(THEME_KEY, "light");
    } else {
      icon.textContent = "☾";
      label.textContent = "Dark";
      localStorage.setItem(THEME_KEY, "dark");
    }
  });
}

// Date helpers
function getMonthName(date) {
  return date.toLocaleString(undefined, { month: "long" });
}

function getYear(date) {
  return date.getFullYear();
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function buildCalendar() {
  const monthNameEl = document.getElementById("monthName");
  const yearNumberEl = document.getElementById("yearNumber");
  const grid = document.getElementById("calendarGrid");
  if (!monthNameEl || !yearNumberEl || !grid) return;

  const year = getYear(currentDate);
  const month = currentDate.getMonth();

  monthNameEl.textContent = getMonthName(currentDate);
  yearNumberEl.textContent = year;

  grid.innerHTML = "";

  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0 = Sun
  const daysInMonth = getDaysInMonth(year, month);

  // Previous month padding
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  const cells = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const d = new Date(prevYear, prevMonth, dayNum);
    cells.push({ date: d, otherMonth: true });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ date: d, otherMonth: false });
  }

  // Next month padding to fill full weeks
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, otherMonth: true });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedStr = selectedDate
    ? selectedDate.toISOString().slice(0, 10)
    : null;

  cells.forEach((cell) => {
    const dateStr = cell.date.toISOString().slice(0, 10);
    const day = cell.date.getDate();

    const div = document.createElement("div");
    div.className = "day-cell";
    if (cell.otherMonth) {
      div.classList.add("day-cell--other-month");
    }
    if (dateStr === todayStr) {
      div.classList.add("day-cell--today");
    }
    if (selectedStr && dateStr === selectedStr) {
      div.classList.add("day-cell--selected");
    }

    const numSpan = document.createElement("div");
    numSpan.className = "day-number";
    numSpan.textContent = day;
    div.appendChild(numSpan);

    const dotRow = document.createElement("div");
    dotRow.className = "day-dot-row";

    const tasksForDay = tasks.filter((t) => t.due === dateStr);
    tasksForDay.slice(0, 4).forEach(() => {
      const dot = document.createElement("div");
      dot.className = "day-dot";
      dotRow.appendChild(dot);
    });

    div.appendChild(dotRow);

    div.addEventListener("click", () => {
      selectedDate = new Date(cell.date);
      renderSelectedDay();
      buildCalendar();
    });

    grid.appendChild(div);
  });
}

// Render selected day details
function renderSelectedDay() {
  const label = document.getElementById("selectedDateLabel");
  const countEl = document.getElementById("selectedCount");
  const listEl = document.getElementById("selectedList");
  const emptyEl = document.getElementById("selectedEmpty");

  if (!label || !countEl || !listEl || !emptyEl) return;

  if (!selectedDate) {
    label.textContent = "Select a day";
    countEl.textContent = "0";
    listEl.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }

  const dateStr = selectedDate.toISOString().slice(0, 10);
  const opts = { weekday: "long", month: "short", day: "numeric" };
  label.textContent = selectedDate.toLocaleDateString(undefined, opts);

  const tasksForDay = tasks.filter((t) => t.due === dateStr);
  countEl.textContent = tasksForDay.length.toString();

  listEl.innerHTML = "";

  tasksForDay.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;

    const metaSpan = document.createElement("span");
    metaSpan.className = "task-meta";

    if (task.className) {
      const classSpan = document.createElement("span");
      classSpan.className = "task-class";
      classSpan.textContent = task.className;
      metaSpan.appendChild(classSpan);
    }

    if (task.done) {
      const statusSpan = document.createElement("span");
      statusSpan.textContent = "Completed";
      metaSpan.appendChild(statusSpan);
    } else if (task.due && task.due < new Date().toISOString().slice(0, 10)) {
      const overdueSpan = document.createElement("span");
      overdueSpan.className = "task-status-overdue";
      overdueSpan.textContent = "Overdue";
      metaSpan.appendChild(overdueSpan);
    }

    li.appendChild(textSpan);
    if (metaSpan.childNodes.length > 0) {
      li.appendChild(metaSpan);
    }

    listEl.appendChild(li);
  });

  emptyEl.style.display = tasksForDay.length === 0 ? "block" : "none";
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  applySavedTheme();
  setupThemeToggle();

  const today = new Date();
  selectedDate = today;

  buildCalendar();
  renderSelectedDay();

  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      buildCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      buildCalendar();
    });
  }
});
