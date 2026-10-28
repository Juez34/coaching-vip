const test = require("node:test");
const assert = require("node:assert/strict");
const { getMonthGrid, localDateKey } = require("../lib/sessionCalendar");

test("month grid starts on Monday and includes every day of a 31-day month", () => {
  const days = getMonthGrid(2026, 7);
  assert.equal(days.length, 42);
  assert.equal(days[0].getDay(), 1);
  assert.equal(days.filter((day) => day.getMonth() === 7).length, 31);
  assert.equal(localDateKey(days.find((day) => day.getMonth() === 7)), "2026-08-01");
});

test("month grid handles leap February and month boundaries", () => {
  const days = getMonthGrid(2028, 1);
  assert.equal(days.filter((day) => day.getMonth() === 1).length, 29);
  assert.ok(days.some((day) => day.getMonth() === 0));
  assert.ok(days.some((day) => day.getMonth() === 2));
});

test("date keys use local calendar dates and reject invalid values", () => {
  assert.equal(localDateKey(new Date(2026, 9, 28, 23, 30)), "2026-10-28");
  assert.equal(localDateKey("not-a-date"), null);
});
