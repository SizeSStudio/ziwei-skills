import { julianDayToNativeDate, nativeDateToJulianDay } from "./calendar";
import {
  NativeCalendarCorePrefixInput,
  NativeCalendarCorePrefixResult,
  nativeCalendarCorePrefix0x14dbd0,
} from "./native-calendar-core-prefix";

export type NativeCalendarWrapperInput = Omit<NativeCalendarCorePrefixInput, "mode">;

export type NativeCalendarWrapperEvidenceContract = {
  function: { address: string; endExclusive: string };
  calendarCoreCalls: Array<{ callAddress: string; mode: number }>;
  reflectionRange: { start: string; through: string; expression: string };
  finalInputDateOverwrite: { start: string; through: string; outputOffsets: string };
  note: string;
};

export function nativeCalendarWrapper0x124b80(
  input: NativeCalendarWrapperInput,
): NativeCalendarCorePrefixResult {
  const first = nativeCalendarCorePrefix0x14dbd0({ ...input, mode: 0 });
  const sourceJulianDay = nativeDateToJulianDay(first.workingDateTime0x00);
  const firstTrueSolarJulianDay = nativeDateToJulianDay(first.trueSolarDateTime0x50);
  const reflectedDateTime = julianDayToNativeDate(
    sourceJulianDay + (sourceJulianDay - firstTrueSolarJulianDay),
  );
  const second = nativeCalendarCorePrefix0x14dbd0({
    ...input,
    dateTime: reflectedDateTime,
    mode: 0,
  });

  return {
    ...second,
    trueSolarDateTime0x50: { ...input.dateTime },
  };
}

export function nativeCalendarWrapperEvidenceContract(): NativeCalendarWrapperEvidenceContract {
  return {
    function: { address: "0x124b80", endExclusive: "0x124dcd" },
    calendarCoreCalls: [
      { callAddress: "0x124c58", mode: 0 },
      { callAddress: "0x124d52", mode: 0 },
    ],
    reflectionRange: {
      start: "0x124c74",
      through: "0x124cc7",
      expression: "sourceJD + (sourceJD - firstTrueSolarJD)",
    },
    finalInputDateOverwrite: {
      start: "0x124d67",
      through: "0x124da4",
      outputOffsets: "0x50..0x77",
    },
    note: "two-pass wrapper port used by the verified mode-2 APP fixture; cross-cache calendar boundaries require additional golden samples",
  };
}
