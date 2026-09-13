(() => {
  "use strict";

  const YEAR = 2026;
  const STORAGE_KEY = "lavender-planner-2026-todos";
  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const holidays = {
    "2026-01-01": "1월 1일",
    "2026-02-16": "설날 연휴",
    "2026-02-17": "설날",
    "2026-02-18": "설날 연휴",
    "2026-03-01": "삼일절",
    "2026-03-02": "삼일절 대체공휴일",
    "2026-05-05": "어린이날",
    "2026-05-24": "부처님오신날",
    "2026-05-25": "부처님오신날 대체공휴일",
    "2026-06-03": "전국동시지방선거일",
    "2026-06-06": "현충일",
    "2026-08-15": "광복절",
    "2026-08-17": "광복절 대체공휴일",
    "2026-09-24": "추석 연휴",
    "2026-09-25": "추석",
    "2026-09-26": "추석 연휴",
    "2026-10-03": "개천절",
    "2026-10-05": "개천절 대체공휴일",
    "2026-10-09": "한글날",
    "2026-12-25": "기독탄신일"
  };
  const now = new Date();
  const initialMonth = now.getFullYear() === YEAR ? now.getMonth() : 0;
  const initialDay = now.getFullYear() === YEAR ? now.getDate() : 1;

  let currentMonth = initialMonth;
  let selectedDate = toDateKey(currentMonth, initialDay);
  let todos = loadTodos();

  const elements = {
    grid: document.querySelector("#calendarGrid"),
    monthTitle: document.querySelector("#monthTitle"),
    monthPicker: document.querySelector("#monthPicker"),
    monthMenu: document.querySelector("#monthMenu"),
    prevMonth: document.querySelector("#prevMonth"),
    nextMonth: document.querySelector("#nextMonth"),
    todayButton: document.querySelector("#todayButton"),
    selectedDateSub: document.querySelector("#selectedDateSub"),
    selectedDateTitle: document.querySelector("#selectedDateTitle"),
    selectedHoliday: document.querySelector("#selectedHoliday"),
    todoForm: document.querySelector("#todoForm"),
    todoInput: document.querySelector("#todoInput"),
    todoList: document.querySelector("#todoList"),
    emptyState: document.querySelector("#emptyState"),
    taskSummary: document.querySelector("#taskSummary"),
    clearCompleted: document.querySelector("#clearCompleted"),
    progressRing: document.querySelector("#progressRing"),
    progressText: document.querySelector("#progressText")
  };

  function loadTodos() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function toDateKey(month, day) {
    return `${YEAR}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function parseDateKey(key) {
    const [, month, day] = key.split("-").map(Number);
    return { month: month - 1, day };
  }

  function makeId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function renderCalendar() {
    elements.monthTitle.textContent = `${currentMonth + 1}월`;
    elements.monthMenu.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.month) === currentMonth);
    });

    const firstDay = new Date(YEAR, currentMonth, 1).getDay();
    const lastDate = new Date(YEAR, currentMonth + 1, 0).getDate();
    const prevLastDate = new Date(YEAR, currentMonth, 0).getDate();
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
      let month = currentMonth;
      let day = index - firstDay + 1;
      let outside = false;

      if (day < 1) {
        month -= 1;
        day = prevLastDate + day;
        outside = true;
      } else if (day > lastDate) {
        month += 1;
        day -= lastDate;
        outside = true;
      }

      if (month < 0 || month > 11) {
        cells.push('<span class="day-cell outside" aria-hidden="true"></span>');
        continue;
      }

      const key = toDateKey(month, day);
      const dayTodos = todos[key] || [];
      const holiday = outside ? "" : holidays[key] || "";
      const classes = ["day-cell"];
      if (outside) classes.push("outside");
      if (index % 7 === 0) classes.push("sunday");
      if (index % 7 === 6) classes.push("saturday");
      if (holiday) classes.push("holiday");
      if (key === selectedDate) classes.push("selected");
      if (now.getFullYear() === YEAR && month === now.getMonth() && day === now.getDate()) classes.push("today");

      const dots = dayTodos.slice(0, 3).map((todo) => `<i class="task-dot${todo.completed ? " done" : ""}"></i>`).join("");
      const more = dayTodos.length > 3 ? `<small class="task-more">+${dayTodos.length - 3}</small>` : "";
      const holidayLabel = holiday ? `<span class="holiday-name" title="${holiday}">${holiday}</span>` : "";
      const ariaHoliday = holiday ? `, ${holiday}` : "";
      cells.push(`<button type="button" role="gridcell" class="${classes.join(" ")}" data-date="${key}" aria-label="${currentMonth + (outside ? (month < currentMonth ? 0 : 2) : 1)}월 ${day}일${ariaHoliday}, 할 일 ${dayTodos.length}개"><span class="day-number">${day}</span>${holidayLabel}<span class="task-dots" aria-hidden="true">${dots}${more}</span></button>`);
    }

    elements.grid.innerHTML = cells.join("");
  }

  function renderTodos() {
    const { month, day } = parseDateKey(selectedDate);
    const date = new Date(YEAR, month, day);
    const list = todos[selectedDate] || [];
    const completed = list.filter((item) => item.completed).length;
    const percent = list.length ? Math.round((completed / list.length) * 100) : 0;

    elements.selectedDateSub.textContent = `${YEAR}년 ${month + 1}월`;
    elements.selectedDateTitle.textContent = `${month + 1}월 ${day}일 ${weekdays[date.getDay()]}`;
    elements.selectedHoliday.textContent = holidays[selectedDate] || "";
    elements.selectedHoliday.hidden = !holidays[selectedDate];
    elements.progressText.textContent = `${percent}%`;
    elements.progressRing.classList.toggle("has-progress", percent > 0 && percent < 100);
    elements.progressRing.classList.toggle("complete", percent === 100 && list.length > 0);
    elements.progressRing.setAttribute("aria-label", `할 일 진행률 ${percent}%`);
    elements.taskSummary.textContent = list.length ? `${list.length}개 중 ${completed}개 완료` : "할 일이 없습니다";
    elements.clearCompleted.hidden = completed === 0;
    elements.emptyState.hidden = list.length > 0;
    elements.todoList.hidden = list.length === 0;

    elements.todoList.innerHTML = list.map((item) => `
      <li class="todo-item${item.completed ? " completed" : ""}" data-id="${item.id}">
        <label>
          <input type="checkbox" ${item.completed ? "checked" : ""} aria-label="${escapeHtml(item.text)} 완료 표시">
          <span class="checkmark" aria-hidden="true"></span>
        </label>
        <span class="todo-text">${escapeHtml(item.text)}</span>
        <button class="delete-button" type="button" aria-label="${escapeHtml(item.text)} 삭제">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"/></svg>
        </button>
      </li>`).join("");
  }

  function escapeHtml(value) {
    const span = document.createElement("span");
    span.textContent = value;
    return span.innerHTML;
  }

  function selectDate(key, focusInput = false) {
    selectedDate = key;
    currentMonth = parseDateKey(key).month;
    renderCalendar();
    renderTodos();
    if (focusInput) elements.todoInput.focus();
  }

  function addTodo(text, dateKey = selectedDate) {
    const cleanText = String(text || "").trim();
    if (!cleanText || cleanText.length > 80 || !/^2026-\d{2}-\d{2}$/.test(dateKey)) throw new Error("올바른 날짜와 할 일을 입력해 주세요.");
    const parsed = parseDateKey(dateKey);
    const date = new Date(YEAR, parsed.month, parsed.day);
    if (date.getFullYear() !== YEAR || date.getMonth() !== parsed.month || date.getDate() !== parsed.day) throw new Error("2026년의 올바른 날짜를 입력해 주세요.");
    const item = { id: makeId(), text: cleanText, completed: false };
    todos[dateKey] = [...(todos[dateKey] || []), item];
    saveTodos();
    selectDate(dateKey);
    return item;
  }

  function toggleTodo(id, completed, dateKey = selectedDate) {
    const list = todos[dateKey] || [];
    const item = list.find((todo) => todo.id === id);
    if (!item) throw new Error("할 일을 찾을 수 없습니다.");
    item.completed = typeof completed === "boolean" ? completed : !item.completed;
    saveTodos();
    renderCalendar();
    renderTodos();
    return item;
  }

  function deleteTodo(id, dateKey = selectedDate) {
    const list = todos[dateKey] || [];
    const next = list.filter((todo) => todo.id !== id);
    if (next.length === list.length) throw new Error("할 일을 찾을 수 없습니다.");
    if (next.length) todos[dateKey] = next;
    else delete todos[dateKey];
    saveTodos();
    renderCalendar();
    renderTodos();
  }

  elements.grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (button) selectDate(button.dataset.date, window.innerWidth < 921);
  });

  elements.prevMonth.addEventListener("click", () => {
    if (currentMonth > 0) { currentMonth -= 1; selectDate(toDateKey(currentMonth, 1)); }
  });
  elements.nextMonth.addEventListener("click", () => {
    if (currentMonth < 11) { currentMonth += 1; selectDate(toDateKey(currentMonth, 1)); }
  });
  elements.prevMonth.addEventListener("dblclick", (event) => event.preventDefault());

  elements.monthPicker.addEventListener("click", () => { elements.monthMenu.hidden = !elements.monthMenu.hidden; });
  elements.monthMenu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-month]");
    if (!button) return;
    currentMonth = Number(button.dataset.month);
    elements.monthMenu.hidden = true;
    selectDate(toDateKey(currentMonth, 1));
  });
  document.addEventListener("click", (event) => {
    if (!elements.monthMenu.contains(event.target) && !elements.monthPicker.contains(event.target)) elements.monthMenu.hidden = true;
  });

  elements.todayButton.addEventListener("click", () => {
    const month = now.getFullYear() === YEAR ? now.getMonth() : 0;
    const day = now.getFullYear() === YEAR ? now.getDate() : 1;
    selectDate(toDateKey(month, day));
  });

  elements.todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addTodo(elements.todoInput.value);
    elements.todoInput.value = "";
    elements.todoInput.focus();
  });

  elements.todoList.addEventListener("change", (event) => {
    if (event.target.matches('input[type="checkbox"]')) {
      toggleTodo(event.target.closest(".todo-item").dataset.id, event.target.checked);
    }
  });

  elements.todoList.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-button");
    if (button) deleteTodo(button.closest(".todo-item").dataset.id);
  });

  elements.clearCompleted.addEventListener("click", () => {
    const remaining = (todos[selectedDate] || []).filter((item) => !item.completed);
    if (remaining.length) todos[selectedDate] = remaining;
    else delete todos[selectedDate];
    saveTodos();
    renderCalendar();
    renderTodos();
  });

  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const schemas = {
      date: { type: "string", pattern: "^2026-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$", description: "2026년 날짜, YYYY-MM-DD 형식" },
      id: { type: "string", minLength: 1 },
      text: { type: "string", minLength: 1, maxLength: 80 }
    };
    const tools = [
      {
        name: "list_todos", title: "할 일 조회", description: "선택한 2026년 날짜의 할 일 목록을 조회합니다.",
        inputSchema: { type: "object", properties: { date: schemas.date }, required: ["date"], additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: ({ date }) => ({ date, todos: todos[date] || [] })
      },
      {
        name: "add_todo", title: "할 일 추가", description: "선택한 2026년 날짜에 새 할 일을 추가하고 화면에 표시합니다.",
        inputSchema: { type: "object", properties: { date: schemas.date, text: schemas.text }, required: ["date", "text"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: ({ date, text }) => ({ date, todo: addTodo(text, date) })
      },
      {
        name: "set_todo_completed", title: "할 일 완료 상태 변경", description: "할 일의 완료 여부를 변경하고 화면에 반영합니다.",
        inputSchema: { type: "object", properties: { date: schemas.date, id: schemas.id, completed: { type: "boolean" } }, required: ["date", "id", "completed"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: ({ date, id, completed }) => ({ date, todo: toggleTodo(id, completed, date) })
      },
      {
        name: "delete_todo", title: "할 일 삭제", description: "선택한 날짜의 할 일을 삭제하고 화면에서 제거합니다.",
        inputSchema: { type: "object", properties: { date: schemas.date, id: schemas.id }, required: ["date", "id"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: ({ date, id }) => { deleteTodo(id, date); return { date, deletedId: id }; }
      }
    ];
    tools.forEach((tool) => { try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch {} });
  }

  renderCalendar();
  renderTodos();
  registerWebMcpTools();
})();
