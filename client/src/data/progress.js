export function progressGroups(tasks, mode, selectedDate, selectedMonth, today) {
  const weekStart = new Date(`${today}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const key = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  const groups = new Map();
  for (const task of tasks) {
    if(task.assignedBy&&task.status==='Started')continue;
    const date = (task.taskDate || "").slice(0, 10);
    const matches = mode === "today" ? date === today
      : mode === "week" ? date >= key(weekStart) && date <= key(weekEnd)
      : mode === "month" ? date.slice(0, 7) === selectedMonth
      : date === selectedDate;
    if (!date || !matches) continue;
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(task);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

export function progressDateLabel(date) {
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date(`${date}T12:00:00`));
  const [year, month, day] = date.split("-");
  return `${weekday} ${day}/${month}/${year}`;
}
