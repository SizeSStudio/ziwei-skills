import type { EvidenceRef } from "../schema/evidence";

export type NativeTenTwelveResidues = {
  mod10: number;
  mod12: number;
};

export const NATIVE_TEN_TWELVE_RESIDUE_EVIDENCE: EvidenceRef = {
  id: "calendar.native-ten-twelve-residues-0x14dbd0",
  kind: "apk-native",
  address: "0x14e0a6",
  note: "0x14dbd0 repeatedly derives dword fields by signed division remainders mod 10 and mod 12.",
};

export function nativeTenTwelveResidues(seed: number): NativeTenTwelveResidues {
  return {
    mod10: nativeRemainderTowardZero(seed, 10),
    mod12: nativeRemainderTowardZero(seed, 12),
  };
}

export function nativeRemainderTowardZero(seed: number, modulus: number): number {
  assertSignedInt32(seed, "seed");
  assertPositiveInteger(modulus, "modulus");
  const quotient = seed < 0 ? Math.ceil(seed / modulus) : Math.floor(seed / modulus);
  const remainder = seed - quotient * modulus;
  return Object.is(remainder, -0) ? 0 : remainder;
}

function assertSignedInt32(value: number, field: string): void {
  assertInteger(value, field);
  if (value < -0x80000000 || value > 0x7fffffff) {
    throw new NativeCyclicError(`${field} must fit signed int32 native arithmetic: ${value}`);
  }
}

function assertPositiveInteger(value: number, field: string): void {
  assertInteger(value, field);
  if (value <= 0) {
    throw new NativeCyclicError(`${field} must be positive: ${value}`);
  }
}

function assertInteger(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new NativeCyclicError(`${field} must be an integer: ${value}`);
  }
}

export class NativeCyclicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeCyclicError";
  }
}
