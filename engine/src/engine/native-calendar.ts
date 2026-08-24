import type { EvidenceRef } from "../schema/evidence";
import type { NativeDateTime } from "./calendar";
import { parseMode2Body, type NormalizedBirthInput, type ParsedMode2Body } from "./normalize";

export type NativeCalendarInvocation = {
  source: {
    kind: "mode2";
    appMode2Body: string;
    fields: ParsedMode2Body;
  };
  dateTime: NativeDateTime;
  longitudeDegrees: number;
  timezoneField: number;
  firstCalendarCoreMode: 0;
  evidence: {
    nativeMode2Dispatch: EvidenceRef;
    nativeWrapper: EvidenceRef;
    calendarCore: EvidenceRef;
  };
};

export const MODE2_NATIVE_CALENDAR_WRAPPER_EVIDENCE: EvidenceRef = {
  id: "mode2.native-calendar-wrapper-arm64-0x12530c",
  kind: "apk-native",
  address: "arm64:0x12530c; x86_64:0x124b80",
  note: "Mode 2 passes year/month/day, hourCode, fixed minute/second fields, longitude, and timezone into the two-pass calendar wrapper.",
};

export const NATIVE_CALENDAR_CORE_EVIDENCE: EvidenceRef = {
  id: "calendar.native-core-0x14dbd0",
  kind: "apk-native",
  address: "0x14dbd0",
  note: "Calendar core receives the mode-2 hourCode and fixed minute/second fields through 0x124b80; the canonical output slice passes the 1998 APP golden fixture.",
};

export const MODE2_NATIVE_DISPATCH_ARGUMENT_EVIDENCE: EvidenceRef = {
  id: "mode2.native-args-arm64-0x120210",
  kind: "apk-native",
  address: "arm64:0x120210",
  note: "Mode 2 parses 13 fields and calls the native chart wrapper with gender 1/2 after the calendar arguments.",
};

export function nativeCalendarInvocationFromNormalizedInput(input: NormalizedBirthInput): NativeCalendarInvocation {
  return nativeCalendarInvocationFromMode2Body(input.appMode2Body);
}

export function nativeCalendarInvocationFromMode2Body(body: string): NativeCalendarInvocation {
  return nativeCalendarInvocationFromParsedMode2(parseMode2Body(body), body);
}

export function nativeCalendarInvocationFromParsedMode2(
  fields: ParsedMode2Body,
  appMode2Body = mode2FieldsToBody(fields),
): NativeCalendarInvocation {
  return {
    source: {
      kind: "mode2",
      appMode2Body,
      fields,
    },
    dateTime: {
      year: fields.year,
      month: fields.month,
      day: fields.day,
      hour: fields.hourCode,
      minute: fields.minuteField,
      second: fields.secondField,
    },
    longitudeDegrees: parseFiniteNumber(fields.longitude, "longitude"),
    timezoneField: fields.timezoneField,
    firstCalendarCoreMode: 0,
    evidence: {
      nativeMode2Dispatch: MODE2_NATIVE_DISPATCH_ARGUMENT_EVIDENCE,
      nativeWrapper: MODE2_NATIVE_CALENDAR_WRAPPER_EVIDENCE,
      calendarCore: NATIVE_CALENDAR_CORE_EVIDENCE,
    },
  };
}

function mode2FieldsToBody(fields: ParsedMode2Body): string {
  return [
    fields.mode,
    fields.year,
    fields.month,
    fields.day,
    fields.hourCode,
    fields.minuteField,
    fields.secondField,
    fields.longitude,
    fields.timezoneField,
    fields.genderFlag,
    fields.tail1,
    fields.tail2,
    fields.tail3,
  ].join("|");
}

function parseFiniteNumber(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new NativeCalendarInputError(`${field} must be numeric for native calendar invocation: ${value}`);
  }
  return parsed;
}

export class NativeCalendarInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeCalendarInputError";
  }
}
