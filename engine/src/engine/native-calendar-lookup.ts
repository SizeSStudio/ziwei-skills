import type { EvidenceRef } from "../schema/evidence";
import { nativeDateToJulianDay } from "./calendar";
import { nativeContextRefill0x182880 } from "./native-context-refill";
import type { NativeCalendarContextState } from "./native-context-state";
import { nativeTenTwelveResidues } from "./native-cyclic";
import {
  nativeBinary128Add0x194c80,
  nativeBinary128BitsToInt,
  nativeBinary128Compare0x195130,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";

export type NativeCalendarLookupResultSlice = {
  byte0x1c: number;
  byte0x68: number;
  byte0x6a: number;
  localYearOffset0x74: number;
  byte0x78: number;
  byte0x79: number;
  byte0x7a: number;
  byte0x7b: number;
};

export type CalendarCoreLookupFields = {
  output0xc8: number;
  output0xcc: number;
  output0xd0: number;
  output0xd4: number;
};

export const NATIVE_CALENDAR_YEAR_BASE = 0x7c0;

const NATIVE_DAY_INDEX_EPOCH = 0x256859;
const NATIVE_YEAR_REFERENCE_BIAS = 0x16b2;
const NATIVE_YEAR_REFERENCE_DAYS = 365;
const NATIVE_YEAR_LENGTH = 365.2422;
const NATIVE_CYCLIC_BIAS = 0x2ee0;
const NATIVE_RECORD_YEAR_SHIFT = nativeDoubleToBinary128Bits(16 * 365.25);

export const NATIVE_CALENDAR_LOOKUP_OUTPUT_OFFSETS = {
  byte0x1c: 0x1c,
  byte0x68: 0x68,
  byte0x6a: 0x6a,
  localYearOffset0x74: 0x74,
  byte0x78: 0x78,
  byte0x79: 0x79,
  byte0x7a: 0x7a,
  byte0x7b: 0x7b,
} as const;

export const CALENDAR_CORE_LOOKUP_OUTPUT_OFFSETS = {
  output0xc8: 0xc8,
  output0xcc: 0xcc,
  output0xd0: 0xd0,
  output0xd4: 0xd4,
} as const;

export const NATIVE_CALENDAR_LOOKUP_CONSUMED_FIELDS_EVIDENCE: EvidenceRef = {
  id: "calendar.native-lookup-consumed-fields-0x14bed0",
  kind: "apk-native",
  address: "0x14e32f",
  note: "0x14dbd0 consumes 0x14bed0 result offsets 0x78..0x7b into 0xa0..0xac and offsets 0x74/0x68/0x1c/0x6a into 0xc8..0xd4.",
};

export const NATIVE_CALENDAR_LOOKUP_STATIC_PORT_EVIDENCE: EvidenceRef = {
  id: "calendar.native-lookup-consumed-slice-0x14bed0",
  kind: "apk-native",
  address: "0x14bed0",
  note: "Ports cache coverage, month-boundary selection, outputs 0x1c/0x68/0x6a/0x74 and cyclic bytes 0x78..0x7b consumed by 0x14dbd0.",
};

export function nativeCalendarLookupConsumedSlice0x14bed0(
  context: NativeCalendarContextState,
  year: number,
  month: number,
  day: number,
): NativeCalendarLookupResultSlice {
  assertDateInput(year, month, day);

  const firstDayIndex = nativeMonthStartDayIndex(year, month);
  const { year: nextYear, month: nextMonth } = incrementMonth(year, month);
  const nextMonthDayIndex = nativeMonthStartDayIndex(nextYear, nextMonth);

  if (!contextCoversMonth(context, firstDayIndex, nextMonthDayIndex)) {
    nativeContextRefill0x182880(context, firstDayIndex);
  }
  assertLookupContextShape(context);

  const dayIndex = firstDayIndex + day - 1;
  if (dayIndex >= nextMonthDayIndex) {
    throw new NativeCalendarLookupError(`day is outside native month: ${year}-${month}-${day}`);
  }

  const boundaryIndex = monthBoundaryIndex(context.monthBoundaries0x50, dayIndex);
  const boundary = context.monthBoundaries0x50[boundaryIndex];
  const byte0x1c = dayIndex - boundary;
  const byte0x68 = lowByte(context.byteTable0x68[boundaryIndex]);
  const byte0x6a = context.leapIndex0x98 !== 0 && context.leapIndex0x98 === boundaryIndex ? 1 : 0;
  const localYearOffset = localYearOffset0x74(context, dayIndex);
  const alternateYearOffset = alternateYearOffset0x70(context, dayIndex);
  const alternateResidues = nativeTenTwelveResidues(alternateYearOffset + NATIVE_CYCLIC_BIAS);
  const localResidues = nativeTenTwelveResidues(localYearOffset + NATIVE_CYCLIC_BIAS);

  return {
    byte0x1c,
    byte0x68,
    byte0x6a,
    localYearOffset0x74: localYearOffset,
    byte0x78: lowByte(alternateResidues.mod10),
    byte0x79: lowByte(alternateResidues.mod12),
    byte0x7a: lowByte(localResidues.mod10),
    byte0x7b: lowByte(localResidues.mod12),
  };
}

function alternateYearOffset0x70(context: NativeCalendarContextState, dayIndex: number): number {
  const record3 = context.recordCache0x10[3];
  const day = nativeIntToBinary128Bits(dayIndex);
  const priorYearOffset = nativeBinary128Compare0x195130(day, record3) < 0 ? -365 : 0;
  let reference = nativeBinary128Add0x194c80(record3, nativeIntToBinary128Bits(priorYearOffset));
  reference = nativeBinary128Add0x194c80(reference, NATIVE_RECORD_YEAR_SHIFT);
  reference = nativeBinary128Subtract0x196240(reference, nativeIntToBinary128Bits(35));
  const integerReference = nativeBinary128BitsToInt(reference);
  return Math.floor(integerReference / NATIVE_YEAR_LENGTH + 0.5);
}

export function calendarCoreLookupFieldsFromNativeLookup(
  lookup: NativeCalendarLookupResultSlice,
): CalendarCoreLookupFields {
  assertInteger(lookup.localYearOffset0x74, "localYearOffset0x74");
  assertUint8(lookup.byte0x1c, "byte0x1c");
  assertUint8(lookup.byte0x68, "byte0x68");
  assertUint8(lookup.byte0x6a, "byte0x6a");

  return {
    output0xc8: NATIVE_CALENDAR_YEAR_BASE + lookup.localYearOffset0x74,
    output0xcc: lookup.byte0x68,
    output0xd0: lookup.byte0x1c,
    output0xd4: lookup.byte0x6a,
  };
}

function nativeMonthStartDayIndex(year: number, month: number): number {
  const julianDay = nativeDateToJulianDay({
    year,
    month,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0.1,
  });
  return Math.floor(julianDay) - NATIVE_DAY_INDEX_EPOCH;
}

function incrementMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

function contextCoversMonth(
  context: NativeCalendarContextState,
  firstDayIndex: number,
  nextMonthDayIndex: number,
): boolean {
  if (context.recordCache0x10.length < 25) {
    return false;
  }
  const firstRecord = nativeBinary128BitsToInt(context.recordCache0x10[0]);
  const lastRecord = nativeBinary128BitsToInt(context.recordCache0x10[24]);
  return firstDayIndex >= firstRecord && nextMonthDayIndex < lastRecord;
}

function assertLookupContextShape(context: NativeCalendarContextState): void {
  if (
    context.recordCache0x10.length < 25 ||
    context.monthBoundaries0x50.length < 15 ||
    context.byteTable0x68.length < 14 ||
    context.byteTable0x80.length < 14
  ) {
    throw new NativeCalendarLookupError("native 0x14bed0 context refill produced an incomplete lookup cache");
  }
}

function monthBoundaryIndex(boundaries: readonly number[], dayIndex: number): number {
  for (let index = 0; index < 14; index += 1) {
    if (dayIndex >= boundaries[index] && dayIndex < boundaries[index + 1]) {
      return index;
    }
  }
  throw new NativeCalendarLookupError(`day index is outside native month boundaries: ${dayIndex}`);
}

function localYearOffset0x74(context: NativeCalendarContextState, dayIndex: number): number {
  const boundaries = context.monthBoundaries0x50;
  const monthNumbers = context.byteTable0x68;
  let referenceDay: number;
  let adjustedToPriorYear = false;

  if (monthNumbers[0] === 2) {
    referenceDay = boundaries[0];
    if (dayIndex < referenceDay) {
      referenceDay -= NATIVE_YEAR_REFERENCE_DAYS;
      adjustedToPriorYear = true;
    }
  } else {
    referenceDay = boundaries[2];
  }

  if (!adjustedToPriorYear) {
    for (let index = 1; index <= 13; index += 1) {
      if (monthNumbers[index] !== 2 || context.leapIndex0x98 === index) {
        continue;
      }
      referenceDay = boundaries[index];
      if (dayIndex < referenceDay) {
        referenceDay -= NATIVE_YEAR_REFERENCE_DAYS;
        break;
      }
    }
  }

  return Math.floor((referenceDay + NATIVE_YEAR_REFERENCE_BIAS) / NATIVE_YEAR_LENGTH + 0.5);
}

function lowByte(value: number): number {
  return value & 0xff;
}

function assertDateInput(year: number, month: number, day: number): void {
  assertInteger(year, "year");
  assertInteger(month, "month");
  assertInteger(day, "day");
  if (month < 1 || month > 12) {
    throw new NativeCalendarLookupError(`month must be from 1 to 12: ${month}`);
  }
  if (day < 0 || day > 31) {
    throw new NativeCalendarLookupError(`day must be from 0 to 31 for native lookup: ${day}`);
  }
}

function assertUint8(value: number, field: string): void {
  assertInteger(value, field);
  if (value < 0 || value > 0xff) {
    throw new NativeCalendarLookupError(`${field} must fit uint8: ${value}`);
  }
}

function assertInteger(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new NativeCalendarLookupError(`${field} must be an integer: ${value}`);
  }
}

export class NativeCalendarLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeCalendarLookupError";
  }
}
