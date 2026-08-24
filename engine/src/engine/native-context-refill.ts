import type { NativeCalendarContextState } from "./native-context-state";
import { nativeRemainderTowardZero } from "./native-cyclic";
import { nativeContextSample0x181490 } from "./native-context-sample";
import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128BitsToInt,
  nativeBinary128Compare0x195130,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Floorl0x19a380,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";

export type NativeContextRefillSampler = (
  context: NativeCalendarContextState,
  mode: 0 | 1,
  rawTarget: NativeBinary128Bits,
) => number;

const YEAR_DAYS = 365.2422;
const YEAR_BASE_BIAS = 0xac;
const YEAR_BASE_OFFSET = 0x163;
const SOLAR_SEGMENT_DAYS = 15.2184;
const ANCHOR_PRIOR_DAYS = 15.2;
const ANCHOR_TWO_PRIOR_DAYS = 30.4;
const LUNATION_ADJUST_DAYS = 29.53;
const LUNATION_DAYS = 29.5306;
const CANDIDATE_ANCHORS = [-993_847, -905_462, -810_904] as const;
const SPECIAL_SENTINEL_BOUNDARIES = new Set([-642_846, -721_751]);

export function nativeContextRefill0x182880(
  context: NativeCalendarContextState,
  targetDayIndex: number,
  sampler: NativeContextRefillSampler = nativeContextRefillSample,
): NativeCalendarContextState {
  assertSignedInt32(targetDayIndex, "targetDayIndex");

  const yearBlock = Math.floor((targetDayIndex - YEAR_BASE_BIAS) / YEAR_DAYS);
  let base = nativeDoubleToBinary128Bits(yearBlock * YEAR_DAYS + YEAR_BASE_OFFSET);
  if (sample(sampler, context, 0, base) > targetDayIndex) {
    base = nativeBinary128Subtract0x196240(base, nativeDoubleToBinary128Bits(YEAR_DAYS));
  }

  context.recordCache0x10.length = 0;
  for (let index = 0; index <= 0x18; index += 1) {
    const target = addDoubleProduct(base, index, SOLAR_SEGMENT_DAYS);
    context.recordCache0x10.push(nativeIntToBinary128Bits(sample(sampler, context, 0, target)));
  }
  for (let index = 1; index < context.recordCache0x10.length; index += 1) {
    if (
      nativeBinary128Compare0x195130(
        context.recordCache0x10[index - 1],
        context.recordCache0x10[index],
      ) >= 0
    ) {
      throw new NativeContextRefillError("native-context-refill:non-monotonic-solar-record-cache");
    }
  }

  context.anchor0x30 = nativeIntToBinary128Bits(
    sample(
      sampler,
      context,
      0,
      nativeBinary128Subtract0x196240(base, nativeDoubleToBinary128Bits(ANCHOR_PRIOR_DAYS)),
    ),
  );
  context.anchor0x40 = nativeIntToBinary128Bits(
    sample(
      sampler,
      context,
      0,
      nativeBinary128Subtract0x196240(base, nativeDoubleToBinary128Bits(ANCHOR_TWO_PRIOR_DAYS)),
    ),
  );

  const firstRecord = requireRecord(context, 0);
  let lunationAnchor = nativeIntToBinary128Bits(sample(sampler, context, 1, firstRecord));
  if (nativeBinary128Compare0x1951f0(lunationAnchor, firstRecord) > 0) {
    lunationAnchor = nativeBinary128Subtract0x196240(
      lunationAnchor,
      nativeDoubleToBinary128Bits(LUNATION_ADJUST_DAYS),
    );
  }

  context.monthBoundaries0x50.length = 0;
  for (let index = 0; index <= 0x0e; index += 1) {
    const target = addDoubleProduct(lunationAnchor, index, LUNATION_DAYS);
    context.monthBoundaries0x50.push(sample(sampler, context, 1, target));
  }

  context.leapIndex0x98 = 0;
  context.byteTable0x80.length = 0;
  context.byteTable0x68.length = 0;
  for (let index = 0; index <= 0x0d; index += 1) {
    context.byteTable0x80.push(
      subtractInt32(context.monthBoundaries0x50[index + 1], context.monthBoundaries0x50[index]),
    );
    context.byteTable0x68.push(index);
  }

  const seed = seedFromFirstRecord(firstRecord);
  if (unsignedInt32(addInt32(seed, 0xaa1)) <= 0x269) {
    rewriteNormalTable(context, addInt32(seed, 0x7d0), sampler);
  } else {
    applyFallbackMarker(context);
    normalizeFallbackTable(context);
  }

  return context;
}

function nativeContextRefillSample(
  context: NativeCalendarContextState,
  mode: 0 | 1,
  rawTarget: NativeBinary128Bits,
): number {
  const result = mode === 0
    ? nativeContextSample0x181490({
        rawTarget,
        mode,
        records: context.modeZeroRecords0x8,
        coldMarkers: context.modeZeroMarkers0xb8,
      })
    : nativeContextSample0x181490({
        rawTarget,
        mode,
        records: context.modeOneRecords0x0,
        coldMarkers: context.modeOneMarkers0xa0,
      });

  if (!("value" in result)) {
    throw new NativeContextRefillError(
      `native-context-refill:sample-without-value:mode-${mode}:${result.reason}`,
    );
  }
  return result.value;
}

function rewriteNormalTable(
  context: NativeCalendarContextState,
  adjustedSeed: number,
  sampler: NativeContextRefillSampler,
): void {
  const candidates: Array<number | undefined> = [undefined, undefined, undefined];
  const classes: Array<number | undefined> = [undefined, undefined, undefined];

  for (let index = 0; index < 3; index += 1) {
    const candidateSeed = addInt32(adjustedSeed, index);
    if (candidateSeed < -0x2d0) {
      continue;
    }
    setCandidate(context, sampler, candidates, classes, index, candidateSeed, {
      thresholdBias: 0x2d0,
      multiplier: 12.368422,
      additive: 0.342,
      anchor: CANDIDATE_ANCHORS[0],
      classValue: 2,
    });
    if (candidateSeed < -0x1de) {
      continue;
    }
    setCandidate(context, sampler, candidates, classes, index, candidateSeed, {
      thresholdBias: 0x1de,
      multiplier: 12.368422,
      additive: 0.5,
      anchor: CANDIDATE_ANCHORS[1],
      classValue: 2,
    });
    if (candidateSeed < -0xdb) {
      continue;
    }
    setCandidate(context, sampler, candidates, classes, index, candidateSeed, {
      thresholdBias: 0xdb,
      multiplier: 12.369,
      additive: 0.866,
      anchor: CANDIDATE_ANCHORS[2],
      classValue: 0x0b,
    });
  }

  if (candidates.some((value) => value === undefined) || classes.some((value) => value === undefined)) {
    throw new NativeContextRefillError("native-context-refill:normal-candidate-stack-edge");
  }
  const resolvedCandidates = candidates as number[];
  const resolvedClasses = classes as number[];

  for (let index = 0; index <= 0x0d; index += 1) {
    const boundary = context.monthBoundaries0x50[index];
    let selected = 2;
    if (boundary < resolvedCandidates[2]) {
      selected = 1;
      if (boundary < resolvedCandidates[1]) {
        selected = 0;
        if (boundary < resolvedCandidates[0]) {
          selected = -1;
        }
      }
    }
    if (selected < 0) {
      throw new NativeContextRefillError("native-context-refill:normal-pre-candidate-boundary");
    }

    const monthOffset = Math.floor(
      (subtractInt32(boundary, resolvedCandidates[selected]) + 15) / LUNATION_DAYS,
    );
    if (monthOffset > 0x0b) {
      throw new NativeContextRefillError("native-context-refill:normal-post-year-boundary");
    }
    context.byteTable0x68[index] = nativeRemainderTowardZero(
      addInt32(monthOffset, resolvedClasses[selected]),
      12,
    );
  }
}

function setCandidate(
  context: NativeCalendarContextState,
  sampler: NativeContextRefillSampler,
  candidates: Array<number | undefined>,
  classes: Array<number | undefined>,
  index: number,
  candidateSeed: number,
  stage: {
    thresholdBias: number;
    multiplier: number;
    additive: number;
    anchor: number;
    classValue: number;
  },
): void {
  const cycle = Math.floor(
    (candidateSeed + stage.thresholdBias) * stage.multiplier + stage.additive,
  );
  const target = nativeDoubleToBinary128Bits(stage.anchor + cycle * LUNATION_DAYS);
  candidates[index] = sample(sampler, context, 1, target);
  classes[index] = stage.classValue;
}

function applyFallbackMarker(context: NativeCalendarContextState): void {
  const finalBoundary = context.monthBoundaries0x50[0x0d];
  const finalRecord = requireRecord(context, 0x18);
  if (
    nativeBinary128Compare0x195130(nativeIntToBinary128Bits(finalBoundary), finalRecord) > 0
  ) {
    return;
  }

  let marker = 1;
  for (; marker <= 0x0d; marker += 1) {
    const boundary = nativeIntToBinary128Bits(context.monthBoundaries0x50[marker + 1]);
    const record = requireRecord(context, marker * 2);
    if (nativeBinary128Compare0x1951f0(boundary, record) <= 0) {
      break;
    }
  }
  marker = Math.min(marker, 0x0d);
  context.leapIndex0x98 = marker;
  for (let index = marker; index <= 0x0d; index += 1) {
    context.byteTable0x68[index] = subtractInt32(context.byteTable0x68[index], 1);
  }
}

function normalizeFallbackTable(context: NativeCalendarContextState): void {
  for (let index = 0; index <= 0x0d; index += 1) {
    const boundary = context.monthBoundaries0x50[index];
    let value = context.byteTable0x68[index];

    if (
      unsignedInt32(addInt32(boundary, 0xb1891)) <= 0x153a ||
      unsignedInt32(addInt32(boundary, 0x9d2ed)) <= 0x3cf
    ) {
      value = addInt32(value, 1);
    } else if (unsignedInt32(addInt32(boundary, 0x6e664)) <= 0x76) {
      value = addInt32(value, 2);
    }

    value = nativeRemainderTowardZero(value, 12);
    if (
      unsignedInt32(addInt32(boundary, 0x74d0e)) <= 0xf91 &&
      value === 0
    ) {
      value = 2;
    }
    context.byteTable0x68[index] = SPECIAL_SENTINEL_BOUNDARIES.has(boundary) ? 0x0c : value;
  }
}

function seedFromFirstRecord(firstRecord: NativeBinary128Bits): number {
  let value = nativeBinary128Add0x194c80(firstRecord, nativeIntToBinary128Bits(10));
  value = nativeBinary128Add0x194c80(value, nativeIntToBinary128Bits(0xb4));
  value = nativeBinary128Divide0x1952a0(value, nativeDoubleToBinary128Bits(YEAR_DAYS));
  value = nativeBinary128Floorl0x19a380(value);
  return nativeBinary128BitsToInt(value);
}

function addDoubleProduct(base: NativeBinary128Bits, index: number, multiplier: number): NativeBinary128Bits {
  return nativeBinary128Add0x194c80(
    base,
    nativeDoubleToBinary128Bits(index * multiplier),
  );
}

function sample(
  sampler: NativeContextRefillSampler,
  context: NativeCalendarContextState,
  mode: 0 | 1,
  rawTarget: NativeBinary128Bits,
): number {
  const value = sampler(context, mode, rawTarget);
  assertSignedInt32(value, "sampler result");
  return value;
}

function requireRecord(context: NativeCalendarContextState, index: number): NativeBinary128Bits {
  const record = context.recordCache0x10[index];
  if (record === undefined) {
    throw new NativeContextRefillError(`native-context-refill:missing-record:${index}`);
  }
  return record;
}

function addInt32(left: number, right: number): number {
  return (left + right) | 0;
}

function subtractInt32(left: number, right: number): number {
  return (left - right) | 0;
}

function unsignedInt32(value: number): number {
  return value >>> 0;
}

function assertSignedInt32(value: number, field: string): void {
  if (!Number.isInteger(value) || value < -0x80000000 || value > 0x7fffffff) {
    throw new NativeContextRefillError(`native-context-refill:${field}:signed-int32:${value}`);
  }
}

export class NativeContextRefillError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeContextRefillError";
  }
}
