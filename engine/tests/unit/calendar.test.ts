import test from "node:test";
import assert from "node:assert/strict";
import {
  julianDayToNativeDate,
  nativeDateToJulianDay,
  secondsBetweenNativeDates,
  type NativeDateTime,
} from "../../src/engine/calendar";

function assertDateClose(actual: NativeDateTime, expected: NativeDateTime): void {
  assert.equal(actual.year, expected.year);
  assert.equal(actual.month, expected.month);
  assert.equal(actual.day, expected.day);
  assert.equal(actual.hour, expected.hour);
  assert.equal(actual.minute, expected.minute);
  assert.ok(Math.abs(actual.second - expected.second) < 0.001, `${actual.second} != ${expected.second}`);
}

test("ports 0x187270 Gregorian date to JD-like day count", () => {
  assert.equal(nativeDateToJulianDay({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 }), 2451545);
  assert.ok(
    Math.abs(nativeDateToJulianDay({ year: 1998, month: 2, day: 20, hour: 9, minute: 40, second: 30 }) - 2450864.903125) < 1e-9,
  );
  assert.equal(nativeDateToJulianDay({ year: 1582, month: 10, day: 4, hour: 0, minute: 0, second: 0 }), 2299159.5);
  assert.equal(nativeDateToJulianDay({ year: 1582, month: 10, day: 15, hour: 0, minute: 0, second: 0 }), 2299160.5);
});

test("ports 0x187090 JD-like day count back to native date structure", () => {
  assertDateClose(julianDayToNativeDate(2451545), { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 });
  assertDateClose(julianDayToNativeDate(2450864.903125), { year: 1998, month: 2, day: 20, hour: 9, minute: 40, second: 30 });
  assertDateClose(julianDayToNativeDate(2299159.5), { year: 1582, month: 10, day: 4, hour: 0, minute: 0, second: 0 });
  assertDateClose(julianDayToNativeDate(2299160.5), { year: 1582, month: 10, day: 15, hour: 0, minute: 0, second: 0 });
});

test("computes seconds between native date structures through the native JD-like count", () => {
  const start = { year: 1998, month: 2, day: 20, hour: 9, minute: 40, second: 30 };
  const end = { year: 1998, month: 2, day: 21, hour: 10, minute: 40, second: 30 };

  assert.ok(Math.abs(secondsBetweenNativeDates(start, end) - 90000) < 0.001);
});
