import { julianDayToNativeDate, nativeDateToJulianDay } from "./calendar";
import { nativeAngleSeries0x185800 } from "./native-angle-series";
import type { NativeCalendarContextState } from "./native-context-state";
import { nativeIteratedCorrection0x1861d0 } from "./native-iterated-correction";
import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128BitsToDouble,
  nativeBinary128BitsToInt,
  nativeBinary128Compare0x195130,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Floorl0x19a380,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeTransformWrapper0x183830 } from "./native-transform";

export type NativeCalendarEventVectors = {
  eventJulianDays0x38: number[];
  eventLabels0x50: number[];
};

export type NativeCalendarEventVectorsEvidenceContract = {
  functionAddress: string;
  implementedRange: { start: string; through: string };
  outputOffsets: { eventJulianDays: string; eventLabels: string };
  recordCount: number;
  directHelpers: Array<{ address: string; callAddresses: string[] }>;
  note: string;
};

const RECORD_COUNT = 25;
const DAYS_PER_CENTURY = nativeIntToBinary128Bits(0x8ead);
const HOURS_EIGHT = nativeIntToBinary128Bits(8);
const HOURS_NEGATIVE_TWENTY_FOUR = nativeIntToBinary128Bits(-24);
const NEGATIVE_ONE_THIRD_DAY = nativeBinary128Divide0x1952a0(
  HOURS_EIGHT,
  HOURS_NEGATIVE_TWENTY_FOUR,
);
const HALF = nativeDoubleToBinary128Bits(0.5);
const ANGLE_BIAS = nativeDoubleToBinary128Bits(0.13);
const TWO_PI_DOUBLE = 2 * Math.PI;
const TWO_PI = nativeDoubleToBinary128Bits(TWO_PI_DOUBLE);
const LABEL_BIAS = nativeDoubleToBinary128Bits(24000005.01);
const ABSOLUTE_JULIAN_DAY_BIAS = 0x256859;

export function nativeCalendarEventVectors0x14bed0(
  context: NativeCalendarContextState,
): NativeCalendarEventVectors {
  assertContext(context);

  const firstRecord = context.recordCache0x10[0];
  let timescaleDay = nativeBinary128Add0x194c80(
    firstRecord,
    nativeTransformWrapper0x183830(firstRecord),
  );
  timescaleDay = nativeBinary128Add0x194c80(timescaleDay, NEGATIVE_ONE_THIRD_DAY);
  const centuries = nativeBinary128Divide0x1952a0(timescaleDay, DAYS_PER_CENTURY);
  let angle = nativeAngleSeries0x185800(centuries, 3);
  angle = nativeBinary128Subtract0x196240(angle, ANGLE_BIAS);
  const sector = nativeBinary128BitsToInt(
    nativeBinary128Floorl0x19a380(
      nativeBinary128Multiply0x195cd0(
        nativeBinary128Divide0x1952a0(angle, TWO_PI),
        nativeIntToBinary128Bits(24),
      ),
    ),
  );

  let targetAngle = nativeDoubleToBinary128Bits((sector * TWO_PI_DOUBLE) / 24);
  const targetAngleStep = nativeDoubleToBinary128Bits(TWO_PI_DOUBLE / 24);
  const eventJulianDays0x38: number[] = [];
  const eventLabels0x50: number[] = [];

  for (const record of context.recordCache0x10.slice(0, RECORD_COUNT)) {
    let candidate: NativeEventCandidate;
    let iterationCount = 0;
    do {
      candidate = eventCandidate0x14d440(targetAngle);
      targetAngle = nativeBinary128Add0x194c80(targetAngle, targetAngleStep);
      iterationCount += 1;
      if (iterationCount > 4) {
        throw new NativeCalendarEventVectorsError("native-calendar-event-vectors:record-search-overflow");
      }
    } while (
      nativeBinary128Compare0x195130(
        nativeIntToBinary128Bits(candidate.roundedRelativeDay),
        record,
      ) < 0
    );

    const eventTime = julianDayToNativeDate(nativeBinary128BitsToDouble(candidate.relativeDay));
    const recordDate = julianDayToNativeDate(nativeBinary128BitsToDouble(record));
    const combinedRelativeJulianDay = nativeDateToJulianDay({
      ...recordDate,
      hour: eventTime.hour,
      minute: eventTime.minute,
      second: eventTime.second,
    });
    eventJulianDays0x38.push(combinedRelativeJulianDay + ABSOLUTE_JULIAN_DAY_BIAS);
    eventLabels0x50.push(candidate.label);
  }

  return { eventJulianDays0x38, eventLabels0x50 };
}

export function nativeCalendarEventVectorsEvidenceContract(): NativeCalendarEventVectorsEvidenceContract {
  return {
    functionAddress: "0x14bed0",
    implementedRange: { start: "0x14d2aa", through: "0x14d69d" },
    outputOffsets: { eventJulianDays: "0x38", eventLabels: "0x50" },
    recordCount: RECORD_COUNT,
    directHelpers: [
      { address: "0x183830", callAddresses: ["0x14d2c1", "0x14d478"] },
      { address: "0x185800", callAddresses: ["0x14d341"] },
      { address: "0x1861d0", callAddresses: ["0x14d448"] },
      { address: "0x187090", callAddresses: ["0x14d60b", "0x14d61e"] },
      { address: "0x187270", callAddresses: ["0x14d644"] },
      { address: "0x14d870", callAddresses: ["0x14d667"] },
      { address: "0x14bcb0", callAddresses: ["0x14d689"] },
    ],
    note: "static port of the two vectors consumed by 0x14dbd0; unrelated 0x14bed0 string and day-selected side outputs remain outside this result",
  };
}

type NativeEventCandidate = {
  relativeDay: NativeBinary128Bits;
  roundedRelativeDay: number;
  label: number;
};

function eventCandidate0x14d440(targetAngle: NativeBinary128Bits): NativeEventCandidate {
  let relativeDay = nativeBinary128Multiply0x195cd0(
    nativeIteratedCorrection0x1861d0(targetAngle),
    DAYS_PER_CENTURY,
  );
  relativeDay = nativeBinary128Subtract0x196240(
    relativeDay,
    nativeTransformWrapper0x183830(relativeDay),
  );
  relativeDay = nativeBinary128Add0x194c80(relativeDay, NEGATIVE_ONE_THIRD_DAY);

  const roundedRelativeDay = nativeBinary128BitsToInt(
    nativeBinary128Floorl0x19a380(nativeBinary128Add0x194c80(relativeDay, HALF)),
  );
  let labelValue = nativeBinary128Divide0x1952a0(targetAngle, TWO_PI);
  labelValue = nativeBinary128Multiply0x195cd0(labelValue, nativeIntToBinary128Bits(24));
  labelValue = nativeBinary128Add0x194c80(labelValue, LABEL_BIAS);
  const labelSeed = nativeBinary128BitsToInt(nativeBinary128Floorl0x19a380(labelValue));

  return {
    relativeDay,
    roundedRelativeDay,
    label: signedRemainder(labelSeed, 24),
  };
}

function signedRemainder(value: number, divisor: number): number {
  return value - Math.trunc(value / divisor) * divisor;
}

function assertContext(context: NativeCalendarContextState): void {
  if (context.recordCache0x10.length < RECORD_COUNT) {
    throw new NativeCalendarEventVectorsError(
      `native-calendar-event-vectors:record-count:${context.recordCache0x10.length}`,
    );
  }
}

export class NativeCalendarEventVectorsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeCalendarEventVectorsError";
  }
}
