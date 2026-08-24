import { createHash, randomBytes } from "node:crypto";
import { canonicalGender, type BirthInput } from "./normalize";

export type RandomEventCandidate = {
  attempt: number;
  datetime: string;
  gender: "male" | "female";
  profile: "random-event";
};

export type RandomEventAudit = {
  algorithm: "sha256-rejection-v1";
  seed: string;
  domain: {
    startInclusive: "2000-01-01 00:00:00";
    endExclusive: "2040-01-01 00:00:00";
    rationale: string;
  };
  attempts: Array<RandomEventCandidate & { status: "rejected"; error: string }>;
  selected: RandomEventCandidate;
};

const DOMAIN_START_MS = Date.UTC(2000, 0, 1, 0, 0, 0);
const DOMAIN_END_MS = Date.UTC(2040, 0, 1, 0, 0, 0);
const DOMAIN_SECONDS = Math.floor((DOMAIN_END_MS - DOMAIN_START_MS) / 1000);

export function randomEventSeed(explicitSeed?: string): string {
  return explicitSeed === undefined ? randomBytes(32).toString("hex") : explicitSeed;
}

export function randomEventCandidate(
  seed: string,
  attempt: number,
  explicitGender?: string,
): RandomEventCandidate {
  if (!Number.isInteger(attempt) || attempt < 0) {
    throw new RandomEventError(`attempt must be a non-negative integer: ${attempt}`);
  }
  const digest = createHash("sha256")
    .update(`ziwei-chart/random-event/v1\0${seed}\0${attempt}`)
    .digest();
  const offsetSeconds = Number(digest.readBigUInt64BE(0) % BigInt(DOMAIN_SECONDS));
  const date = new Date(DOMAIN_START_MS + offsetSeconds * 1000);
  const gender = explicitGender === undefined
    ? ((digest[8] & 1) === 0 ? "female" : "male")
    : canonicalGender(explicitGender);
  return {
    attempt,
    datetime: formatUtcCivilDate(date),
    gender,
    profile: "random-event",
  };
}

export function randomEventBirthInput(candidate: RandomEventCandidate): BirthInput {
  return {
    datetime: candidate.datetime,
    gender: candidate.gender,
    profile: candidate.profile,
  };
}

export function randomEventAudit(
  seed: string,
  attempts: RandomEventAudit["attempts"],
  selected: RandomEventCandidate,
): RandomEventAudit {
  return {
    algorithm: "sha256-rejection-v1",
    seed,
    domain: {
      startInclusive: "2000-01-01 00:00:00",
      endExclusive: "2040-01-01 00:00:00",
      rationale: "The native calendar cache loses monotonicity in later years; the default random band stays inside the repeatedly sampled stable range, and any rejected candidate remains in the audit trail.",
    },
    attempts,
    selected,
  };
}

function formatUtcCivilDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
  ].join("-") + ` ${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export class RandomEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RandomEventError";
  }
}
