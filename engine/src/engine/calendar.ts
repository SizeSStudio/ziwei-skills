export type NativeDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const GREGORIAN_FORWARD_PROBE = 0x8fc1d;
const GREGORIAN_INVERSE_SWITCH = 0x231519;
const DAYS_PER_JULIAN_YEAR = 365.25;
const NATIVE_FORWARD_MONTH_FACTOR = 30.6001;
const NATIVE_INVERSE_MONTH_FACTOR = 30.601;
const FORWARD_EPOCH_OFFSET = 1524.5;
const INVERSE_GREGORIAN_OFFSET = 1867216.25;
const DAYS_PER_GREGORIAN_CENTURY = 36524.25;
const INVERSE_YEAR_OFFSET = 4716;

export function nativeDateToJulianDay(input: NativeDateTime): number {
  validateNativeDateTime(input);
  const dayWithTime = input.day + (((input.second / 60 + input.minute) / 60 + input.hour) / 24);
  let yearForCorrection = input.month < 3 ? input.year - 1 : input.year;
  const ordinalProbe = Math.trunc(dayWithTime) + input.year * 372 + input.month * 31;
  let gregorianCorrection = 0;

  if (ordinalProbe >= GREGORIAN_FORWARD_PROBE) {
    const century = truncTowardZero(yearForCorrection / 100);
    gregorianCorrection = truncTowardZero(century / 4) - century + 2;
  }

  const formulaMonth = input.month < 3 ? input.month | 12 : input.month;
  return (
    Math.floor(DAYS_PER_JULIAN_YEAR * (yearForCorrection + INVERSE_YEAR_OFFSET)) +
    Math.floor(NATIVE_FORWARD_MONTH_FACTOR * (formulaMonth + 1)) +
    dayWithTime +
    gregorianCorrection -
    FORWARD_EPOCH_OFFSET
  );
}

export function julianDayToNativeDate(julianDay: number): NativeDateTime {
  assertFiniteNumber(julianDay, "julianDay");
  const shifted = julianDay + 0.5;
  let wholeDay = Math.floor(shifted);
  let fraction = shifted - wholeDay;

  if (wholeDay >= GREGORIAN_INVERSE_SWITCH) {
    const century = truncTowardZero((wholeDay - INVERSE_GREGORIAN_OFFSET) / DAYS_PER_GREGORIAN_CENTURY);
    wholeDay = wholeDay + century - truncTowardZero(century / 4) + 1;
  }

  const b = wholeDay + 1524;
  const c = Math.floor((b - 122.1) / DAYS_PER_JULIAN_YEAR);
  const d = Math.floor(DAYS_PER_JULIAN_YEAR * c);
  const e = Math.floor((b - d) / NATIVE_INVERSE_MONTH_FACTOR);
  const day = b - d - Math.floor(NATIVE_INVERSE_MONTH_FACTOR * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = c + (e >= 14 ? 1 : 0) - INVERSE_YEAR_OFFSET;

  const hour = Math.floor(fraction * 24);
  fraction = fraction * 24 - hour;
  const minute = Math.floor(fraction * 60);
  fraction = fraction * 60 - minute;
  const second = fraction * 60;

  return { year, month, day, hour, minute, second };
}

export function secondsBetweenNativeDates(start: NativeDateTime, end: NativeDateTime): number {
  return (nativeDateToJulianDay(end) - nativeDateToJulianDay(start)) * 86400;
}

function validateNativeDateTime(input: NativeDateTime): void {
  assertInteger(input.year, "year");
  assertInteger(input.month, "month");
  assertInteger(input.day, "day");
  assertInteger(input.hour, "hour");
  assertInteger(input.minute, "minute");
  assertFiniteNumber(input.second, "second");
  assertRange(input.month, 1, 12, "month");
  assertRange(input.day, 1, 31, "day");
  assertRange(input.hour, 0, 23, "hour");
  assertRange(input.minute, 0, 59, "minute");
  if (input.second < 0 || input.second >= 60) {
    throw new CalendarError(`second must be from 0 to less than 60: ${input.second}`);
  }
}

function truncTowardZero(value: number): number {
  return value < 0 ? Math.ceil(value) : Math.floor(value);
}

function assertInteger(value: number, field: string): void {
  assertFiniteNumber(value, field);
  if (!Number.isInteger(value)) {
    throw new CalendarError(`${field} must be an integer: ${value}`);
  }
}

function assertFiniteNumber(value: number, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CalendarError(`${field} must be finite: ${value}`);
  }
}

function assertRange(value: number, min: number, max: number, field: string): void {
  if (value < min || value > max) {
    throw new CalendarError(`${field} must be from ${min} to ${max}: ${value}`);
  }
}

export class CalendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarError";
  }
}
