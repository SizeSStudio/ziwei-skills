import { NativeDateTime, julianDayToNativeDate, nativeDateToJulianDay } from "./calendar";
import { nativeAngleSeries0x185800 } from "./native-angle-series";
import { nativeAngleTransform0x184970 } from "./native-angle-transform";
import { nativeCalendarEventVectors0x14bed0 } from "./native-calendar-event-vectors";
import {
  CalendarCoreLookupFields,
  calendarCoreLookupFieldsFromNativeLookup,
  nativeCalendarLookupConsumedSlice0x14bed0,
} from "./native-calendar-lookup";
import type { NativeCalendarContextState } from "./native-context-state";
import { NativeTenTwelveResidues, nativeTenTwelveResidues } from "./native-cyclic";
import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128BitsToDouble,
  nativeBinary128BitsToInt,
  nativeBinary128Compare0x195130,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Floorl0x19a380,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeTransformWrapper0x183830 } from "./native-transform";

export type NativeCalendarCoreMode = 0 | 1 | 2;

export type NativeCalendarCorePrefixInput = {
  context: NativeCalendarContextState;
  dateTime: NativeDateTime;
  longitudeDegrees: number;
  timezoneHours: number;
  mode: NativeCalendarCoreMode;
};

export type NativeCalendarCorePreliminaryCyclicFields = {
  output0xa0_0xa4BeforeLookupOverwrite: NativeTenTwelveResidues;
  output0xb0_0xb4: NativeTenTwelveResidues;
  output0xb8_0xbc: NativeTenTwelveResidues;
  output0xc0_0xc4: NativeTenTwelveResidues;
};

export type NativeCalendarCorePrefixResult = {
  workingDateTime0x00: NativeDateTime;
  trueSolarDateTime0x50: NativeDateTime;
  lookupDate: { year: number; month: number; day: number };
  angleSector0x14deeb: number;
  hourIndex0x14e051: number;
  preliminaryCyclicFields: NativeCalendarCorePreliminaryCyclicFields;
  finalLookupCyclicFields0xa0_0xac: {
    output0xa0: number;
    output0xa4: number;
    output0xa8: number;
    output0xac: number;
  };
  lookupFields0xc8_0xd4: CalendarCoreLookupFields;
  eventBoundaries0xd8_0x183: {
    atOrBefore0xd8: NativeCalendarCoreEventBoundary;
    after0x130: NativeCalendarCoreEventBoundary;
  };
  intermediate: {
    relativeDayAfterTimezone0x14ddd6: NativeBinary128Bits;
    transformedTimescaleDay0x14ddf1: NativeBinary128Bits;
    centuries0x14de11: NativeBinary128Bits;
    trueSolarRelativeDay0x14df6d: NativeBinary128Bits;
  };
};

export type NativeCalendarCoreEventBoundary = {
  eventJulianDay: number;
  dateTime: NativeDateTime;
  label: number;
};

export type NativeCalendarCorePrefixEvidenceContract = {
  function: { address: string; endExclusive: string };
  implementedRange: { start: string; through: string };
  directHelpers: { address: string; callAddresses: string[] }[];
  finalOverwrite: {
    address: string;
    sourceOffsets: string;
    targetOffsets: string;
  };
  characterizationVectorCount: number;
  note: string;
};

const J2000_DAY = nativeIntToBinary128Bits(0x256859);
const HOURS_PER_DAY = nativeIntToBinary128Bits(24);
const DAYS_PER_CENTURY = nativeIntToBinary128Bits(0x8ead);
const TWO_PI = nativeDoubleToBinary128Bits(2 * Math.PI);
const PI = nativeDoubleToBinary128Bits(Math.PI);
const LONGITUDE_RADIANS_DIVISOR = nativeDoubleToBinary128Bits(180 / Math.PI);
const MODE_ADJUSTMENT = nativeDoubleToBinary128Bits(0.0833333335);
const TRUE_DAY_SHIFT = nativeDoubleToBinary128Bits(13 / 24);
const NEXT_HOUR_JD_SHIFT = 0.04166666651144624;

export function nativeCalendarCorePrefix0x14dbd0(
  input: NativeCalendarCorePrefixInput,
): NativeCalendarCorePrefixResult {
  assertInput(input);

  let sourceJulianDay = nativeDoubleToBinary128Bits(nativeDateToJulianDay(input.dateTime));
  let workingDateTime0x00 = { ...input.dateTime };
  if (input.mode === 1) {
    sourceJulianDay = nativeBinary128Add0x194c80(sourceJulianDay, MODE_ADJUSTMENT);
    workingDateTime0x00 = julianDayToNativeDate(nativeBinary128BitsToDouble(sourceJulianDay));
  } else if (input.mode === 2) {
    sourceJulianDay = nativeBinary128Subtract0x196240(sourceJulianDay, MODE_ADJUSTMENT);
    workingDateTime0x00 = julianDayToNativeDate(nativeBinary128BitsToDouble(sourceJulianDay));
  }

  const longitudeRadians = nativeBinary128Divide0x1952a0(
    nativeDoubleToBinary128Bits(input.longitudeDegrees),
    LONGITUDE_RADIANS_DIVISOR,
  );
  let relativeDayAfterTimezone = nativeBinary128Subtract0x196240(sourceJulianDay, J2000_DAY);
  relativeDayAfterTimezone = nativeBinary128Add0x194c80(
    relativeDayAfterTimezone,
    nativeBinary128Divide0x1952a0(
      nativeDoubleToBinary128Bits(input.timezoneHours),
      HOURS_PER_DAY,
    ),
  );

  const transformedTimescaleDay = nativeBinary128Add0x194c80(
    relativeDayAfterTimezone,
    nativeTransformWrapper0x183830(relativeDayAfterTimezone),
  );
  const centuries = nativeBinary128Divide0x1952a0(transformedTimescaleDay, DAYS_PER_CENTURY);
  const angleSector = angleSector0x14deeb(centuries);

  let trueSolarRelativeDay = nativeBinary128Add0x194c80(
    relativeDayAfterTimezone,
    nativeAngleTransform0x184970(centuries),
  );
  let longitudeDayFraction = nativeBinary128Divide0x1952a0(longitudeRadians, PI);
  longitudeDayFraction = nativeBinary128Divide0x1952a0(
    longitudeDayFraction,
    nativeIntToBinary128Bits(2),
  );
  trueSolarRelativeDay = nativeBinary128Add0x194c80(trueSolarRelativeDay, longitudeDayFraction);

  const trueSolarJulianDay = nativeBinary128Add0x194c80(trueSolarRelativeDay, J2000_DAY);
  const trueSolarDateTime0x50 = julianDayToNativeDate(
    nativeBinary128BitsToDouble(trueSolarJulianDay),
  );

  const shiftedTrueDay = nativeBinary128Add0x194c80(trueSolarRelativeDay, TRUE_DAY_SHIFT);
  const wholeShiftedTrueDay = nativeBinary128Floorl0x19a380(shiftedTrueDay);
  const trueDayFraction = nativeBinary128Subtract0x196240(
    shiftedTrueDay,
    wholeShiftedTrueDay,
  );
  const hourIndex = nativeBinary128BitsToInt(
    nativeBinary128Floorl0x19a380(
      nativeBinary128Multiply0x195cd0(trueDayFraction, nativeIntToBinary128Bits(12)),
    ),
  );

  const preliminaryCyclicFields = preliminaryCyclicFields0x14e056(
    angleSector,
    wholeShiftedTrueDay,
    hourIndex,
  );
  const lookupDate = lookupDate0x14e2aa(trueSolarDateTime0x50);
  const firstLookup = nativeCalendarLookupConsumedSlice0x14bed0(
    input.context,
    lookupDate.year,
    lookupDate.month,
    lookupDate.day,
  );
  let finalLookupCyclicFields0xa0_0xac = {
    output0xa0: firstLookup.byte0x78,
    output0xa4: firstLookup.byte0x79,
    output0xa8: firstLookup.byte0x7a,
    output0xac: firstLookup.byte0x7b,
  };
  let lookupFields0xc8_0xd4 = calendarCoreLookupFieldsFromNativeLookup(firstLookup);

  if (trueSolarDateTime0x50.hour === 23) {
    if (lookupFields0xc8_0xd4.output0xd0 !== 0) {
      lookupFields0xc8_0xd4 = {
        ...lookupFields0xc8_0xd4,
        output0xd0: lookupFields0xc8_0xd4.output0xd0 - 1,
      };
    } else {
      lookupFields0xc8_0xd4 = calendarCoreLookupFieldsFromNativeLookup(
        nativeCalendarLookupConsumedSlice0x14bed0(
          input.context,
          lookupDate.year,
          lookupDate.month,
          lookupDate.day - 1,
        ),
      );
    }
  }

  const eventVectors = nativeCalendarEventVectors0x14bed0(input.context);
  const eventBoundaries0xd8_0x183 = selectEventBoundaries0x14e475(
    trueSolarRelativeDay,
    eventVectors.eventJulianDays0x38,
    eventVectors.eventLabels0x50,
  );
  if (
    eventBoundaries0xd8_0x183.after0x130.label === 3 &&
    sameCivilDate(trueSolarDateTime0x50, eventBoundaries0xd8_0x183.after0x130.dateTime)
  ) {
    finalLookupCyclicFields0xa0_0xac = {
      ...finalLookupCyclicFields0xa0_0xac,
      output0xa0: decrementResidue(finalLookupCyclicFields0xa0_0xac.output0xa0, 10),
      output0xa4: decrementResidue(finalLookupCyclicFields0xa0_0xac.output0xa4, 12),
    };
  }

  return {
    workingDateTime0x00,
    trueSolarDateTime0x50,
    lookupDate,
    angleSector0x14deeb: angleSector,
    hourIndex0x14e051: hourIndex,
    preliminaryCyclicFields,
    finalLookupCyclicFields0xa0_0xac,
    lookupFields0xc8_0xd4,
    eventBoundaries0xd8_0x183,
    intermediate: {
      relativeDayAfterTimezone0x14ddd6: relativeDayAfterTimezone,
      transformedTimescaleDay0x14ddf1: transformedTimescaleDay,
      centuries0x14de11: centuries,
      trueSolarRelativeDay0x14df6d: trueSolarRelativeDay,
    },
  };
}

export function nativeCalendarCorePrefixEvidenceContract(): NativeCalendarCorePrefixEvidenceContract {
  return {
    function: { address: "0x14dbd0", endExclusive: "0x14e9d6" },
    implementedRange: { start: "0x14dbd0", through: "0x14e927" },
    directHelpers: [
      { address: "0x187270", callAddresses: ["0x14dcdd", "0x14e2bc"] },
      { address: "0x187090", callAddresses: ["0x14dd4b", "0x14df99", "0x14e2d0"] },
      { address: "0x183830", callAddresses: ["0x14dddd"] },
      { address: "0x185800", callAddresses: ["0x14de2c"] },
      { address: "0x184970", callAddresses: ["0x14df07"] },
      { address: "0x14bed0", callAddresses: ["0x14e31f", "0x14e3a3"] },
    ],
    finalOverwrite: {
      address: "0x14e464",
      sourceOffsets: "0x14bed0 output bytes 0x78..0x7b",
      targetOffsets: "0x14dbd0 output dwords 0xa0..0xac",
    },
    characterizationVectorCount: 3,
    note: "fixture-range static port through vector-selected 0xd8..0x183 dates and conditional residue correction; 0x14e7bf cross-cache rollover remains a named unsupported path",
  };
}

function selectEventBoundaries0x14e475(
  trueSolarRelativeDay: NativeBinary128Bits,
  eventJulianDays: readonly number[],
  eventLabels: readonly number[],
): NativeCalendarCorePrefixResult["eventBoundaries0xd8_0x183"] {
  if (eventJulianDays.length !== 25 || eventLabels.length !== 25) {
    throw new NativeCalendarCorePrefixError("native-calendar-core-prefix:event-vector-shape");
  }
  const currentAbsoluteDay = nativeBinary128Add0x194c80(trueSolarRelativeDay, J2000_DAY);
  for (let index = 0; index < eventJulianDays.length - 1; index += 1) {
    const lower = nativeDoubleToBinary128Bits(eventJulianDays[index]);
    const upper = nativeDoubleToBinary128Bits(eventJulianDays[index + 1]);
    if (
      nativeBinary128Compare0x1951f0(currentAbsoluteDay, lower) >= 0 &&
      nativeBinary128Compare0x195130(currentAbsoluteDay, upper) < 0
    ) {
      return {
        atOrBefore0xd8: eventBoundary(eventJulianDays[index], eventLabels[index]),
        after0x130: eventBoundary(eventJulianDays[index + 1], eventLabels[index + 1]),
      };
    }
  }
  throw new NativeCalendarCorePrefixError("native-calendar-core-prefix:event-vector-rollover");
}

function eventBoundary(eventJulianDay: number, label: number): NativeCalendarCoreEventBoundary {
  return { eventJulianDay, dateTime: julianDayToNativeDate(eventJulianDay), label };
}

function sameCivilDate(left: NativeDateTime, right: NativeDateTime): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

function decrementResidue(value: number, modulus: number): number {
  return value > 0 ? value - 1 : modulus - 1;
}

function angleSector0x14deeb(centuries: NativeBinary128Bits): number {
  let angle = nativeAngleSeries0x185800(centuries, -1);
  angle = nativeBinary128Divide0x1952a0(angle, TWO_PI);
  angle = nativeBinary128Multiply0x195cd0(angle, nativeIntToBinary128Bits(360));
  angle = nativeBinary128Add0x194c80(angle, nativeIntToBinary128Bits(45));
  angle = nativeBinary128Add0x194c80(angle, nativeIntToBinary128Bits(0x1518));
  angle = nativeBinary128Divide0x1952a0(angle, nativeIntToBinary128Bits(30));
  return nativeBinary128BitsToInt(nativeBinary128Floorl0x19a380(angle));
}

function preliminaryCyclicFields0x14e056(
  angleSector: number,
  wholeShiftedTrueDay: NativeBinary128Bits,
  hourIndex: number,
): NativeCalendarCorePreliminaryCyclicFields {
  const sectorTwelfthAsDouble = (angleSector * 1.0) / 12.0;
  const firstSeed = nativeBinary128BitsToInt(
    nativeBinary128Floorl0x19a380(
      nativeBinary128Add0x194c80(
        nativeDoubleToBinary128Bits(sectorTwelfthAsDouble),
        nativeIntToBinary128Bits(0x5b8d80),
      ),
    ),
  );
  const secondSeed = toSignedInt32(angleSector + 0x3938702);

  const thirdSeed = nativeBinary128BitsToInt(
    nativeBinary128Add0x194c80(
      nativeBinary128Subtract0x196240(
        wholeShiftedTrueDay,
        nativeIntToBinary128Bits(6),
      ),
      nativeIntToBinary128Bits(0x895440),
    ),
  );

  let fourthSeedBits = nativeBinary128Subtract0x196240(
    wholeShiftedTrueDay,
    nativeIntToBinary128Bits(1),
  );
  fourthSeedBits = nativeBinary128Multiply0x195cd0(
    fourthSeedBits,
    nativeIntToBinary128Bits(12),
  );
  fourthSeedBits = nativeBinary128Add0x194c80(
    fourthSeedBits,
    nativeIntToBinary128Bits(0x55d4a80),
  );
  fourthSeedBits = nativeBinary128Add0x194c80(
    fourthSeedBits,
    nativeIntToBinary128Bits(hourIndex),
  );
  const fourthSeed = nativeBinary128BitsToInt(fourthSeedBits);

  return {
    output0xa0_0xa4BeforeLookupOverwrite: nativeTenTwelveResidues(firstSeed),
    output0xb0_0xb4: nativeTenTwelveResidues(secondSeed),
    output0xb8_0xbc: nativeTenTwelveResidues(thirdSeed),
    output0xc0_0xc4: nativeTenTwelveResidues(fourthSeed),
  };
}

function lookupDate0x14e2aa(trueSolarDateTime: NativeDateTime): {
  year: number;
  month: number;
  day: number;
} {
  if (trueSolarDateTime.hour !== 23) {
    return {
      year: trueSolarDateTime.year,
      month: trueSolarDateTime.month,
      day: trueSolarDateTime.day,
    };
  }
  const shifted = nativeDateToJulianDay(trueSolarDateTime) + NEXT_HOUR_JD_SHIFT;
  const date = julianDayToNativeDate(shifted);
  return { year: date.year, month: date.month, day: date.day };
}

function assertInput(input: NativeCalendarCorePrefixInput): void {
  if (!Number.isFinite(input.longitudeDegrees)) {
    throw new NativeCalendarCorePrefixError("native-calendar-core-prefix:non-finite-longitude");
  }
  if (!Number.isFinite(input.timezoneHours)) {
    throw new NativeCalendarCorePrefixError("native-calendar-core-prefix:non-finite-timezone");
  }
  if (input.mode !== 0 && input.mode !== 1 && input.mode !== 2) {
    throw new NativeCalendarCorePrefixError(`native-calendar-core-prefix:invalid-mode:${input.mode}`);
  }
}

function toSignedInt32(value: number): number {
  return Number(BigInt.asIntN(32, BigInt(value)));
}

export class NativeCalendarCorePrefixError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeCalendarCorePrefixError";
  }
}
