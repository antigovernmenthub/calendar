const monthNameEl = document.getElementById('monthName');
const yearNumEl = document.getElementById('yearNum');
const daysGrid = document.getElementById('daysGrid');
const detailDateLabel = document.getElementById('detailDateLabel');
const detailCount = document.getElementById('detailCount');
const detailList = document.getElementById('detailList');

let currentDate = new Date();
let selectedDateStr = null;

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function goToPlanner() {
  // Navigate back to your planner list if it's in the same folder
  window.location.href = './planner.html';
}

function loadTasks() {
  // Same key as planner.js
  return JSON.parse(localStorage.getItem('planner-tasks-v3')) || [];
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function getTasksByDateMap(tasks) {
  const map = {};
  tasks.forEach(task => {
    if (!task.due) return;
    if (!map[task.due]) map[task.due] = [];
    map[task.due].push(task);
  });
  return map;
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthNameEl.textContent = months[month];
  yearNumEl.textContent = year;

  daysGrid.innerHTML = '';

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  const tasks = loadTasks();
  const tasksByDate = getTasksByDateMap(tasks);
  const todayStr = toDateStr(new Date());

  const totalCells = 42;
  let dayNum = 1;
  let nextMonthDay = 1;

  for (let cell = 0; cell < totalCells; cell++) {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'day-cell';

    let cellDay;
    let cellMonth = month;
    let cellYear = year;
    let outside = false;

    if (cell < startWeekday) {
      const d = prevLastDay - (startWeekday - 1 - cell);
      cellDay = d;
      cellMonth = month - 1;
      outside = true;
    } else if (cell >= startWeekday && dayNum <= daysInMonth) {
      cellDay = dayNum++;
    } else {
      cellDay = nextMonthDay++;
      cellMonth = month + 1;
      outside = true;
    }

    const dateObj = new Date(cellYear, cellMonth, cellDay);
    const dateStr = toDateStr(dateObj);

    cellDiv.textContent = cellDay;

    if (outside) {
      cellDiv.classList.add('outside');
    } else {
      if (dateStr === todayStr) {
        cellDiv.classList.add('today');
      }
      if (dateStr === selectedDateStr) {
        cellDiv.classList.add('selected');
      }

      const dayTasks = tasksByDate[dateStr] || [];
      if (dayTasks.length > 0) {
        const dot = document.createElement('div');
        dot.className = 'day-dot';
        const anyOverdue = dayTasks.some(t => {
          const due = new Date(t.due);
          const today = new Date(todayStr);
          return !t.completed && due < today;
        });
        if (anyOverdue) {
          dot.classList.add('overdue');
        } else {
          dot.classList.add('due');
        }
        cellDiv.appendChild(dot);
      }

      cellDiv.addEventListener('click', () => {
        selectedDateStr = dateStr;
        renderCalendar();
        renderDetail(dateStr);
      });
    }

    daysGrid.appendChild(cellDiv);
  }

  if (!selectedDateStr) {
    selectedDateStr = todayStr;
    renderDetail(selectedDateStr);
  }
}

function renderDetail(dateStr) {
  const tasks = loadTasks();
  const dayTasks = tasks.filter(t => t.due === dateStr);

  detailDateLabel.textContent = dateStr;
  detailCount.textContent = `${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''}`;
  detailList.innerHTML = '';

  dayTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'detail-item';
    li.innerHTML = `
      <div class="task-text">${task.text}</div>
      <div class="task-meta">
        ${task.completed ? 'Done' : 'Pending'}
      </div>
    `;
    detailList.appendChild(li);
  });
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderCalendar();
}

window.addEventListener('load', () => {
  renderCalendar();
});
