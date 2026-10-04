import test from "node:test";
import assert from "node:assert/strict";
import { progressGroups, progressDateLabel } from "./progress.js";

const tasks = ["2026-09-27", "2026-09-28", "2026-09-30", "2026-10-01", "2026-10-01", "2026-10-04", "2026-10-05"].map((taskDate, id) => ({ id, taskDate }));
const filter = (mode, date = "2026-09-30", month = "2026-09") => progressGroups(tasks, mode, date, month, "2026-10-01");
test("today groups only today's tasks", () => {
  assert.equal(filter("today").length, 1);
  assert.equal(filter("today")[0][1].length, 2);
});
test("week includes Monday to Sunday across a month boundary", () => {
  assert.deepEqual(filter("week").map(([date]) => date), ["2026-10-04", "2026-10-01", "2026-09-30", "2026-09-28"]);
});
test("month supports older history and calendar selects exactly one day", () => {
  assert.deepEqual(filter("month").map(([date]) => date), ["2026-09-30", "2026-09-28", "2026-09-27"]);
  assert.equal(filter("calendar")[0][0], "2026-09-30");
  assert.deepEqual(filter("calendar", "2025-01-01"), []);
});
test("date headings include weekday and day/month/year", () => {
  assert.equal(progressDateLabel("2026-03-30"), "Monday 30/03/2026");
});
test('started assignments stay separate while pending/completed assignments enter progress',()=>{
 const rows=[
  {id:1,taskDate:'2026-10-04',assignedBy:'Manager',status:'Started'},
  {id:2,taskDate:'2026-10-04',assignedBy:'Manager',status:'Pending'},
  {id:3,taskDate:'2026-10-04',assignedBy:'Manager',status:'Complete'},
  {id:4,taskDate:'2026-10-04',status:'Started'}
 ];
 assert.deepEqual(progressGroups(rows,'today','','','2026-10-04')[0][1].map(t=>t.id),[2,3,4]);
});
