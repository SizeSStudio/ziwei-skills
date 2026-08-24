export type GenderInput = "male" | "female" | "m" | "f" | "男" | "女" | "yang_male" | "yin_female" | string;

export type InputProfile = "natal" | "random-event";

export type LongitudeSource = "explicit" | "verified-place" | "app-random-event-default";

export type Mode2BuildInput = {
  year: number;
  month: number;
  day: number;
  hourCode: number;
  longitude?: string | number;
  gender?: GenderInput;
  minuteField?: number;
  secondField?: number;
  timezoneField?: number;
  tail1?: number;
  tail2?: number;
  tail3?: number;
};

export type ParsedMode2Body = {
  fieldCount: 13;
  mode: 2;
  year: number;
  month: number;
  day: number;
  hourCode: number;
  minuteField: number;
  secondField: number;
  longitude: string;
  timezoneField: number;
  genderFlag: "1" | "2";
  tail1: number;
  tail2: number;
  tail3: number;
};

export type BirthInput = {
  datetime: string;
  place?: string;
  longitude?: string | number;
  timezone?: number;
  gender: GenderInput;
  profile?: InputProfile;
};

export type NormalizedBirthInput = {
  inputProfile: InputProfile;
  originalDatetime: string;
  place?: string;
  year: number;
  month: number;
  day: number;
  clockHour: number;
  clockMinute: number;
  clockSecond: number;
  hourCode: number;
  longitude: string;
  longitudeSource: LongitudeSource;
  timezoneOffsetHours: number;
  appTimezoneField: number;
  gender: "male" | "female";
  genderFlag: "1" | "2";
  appMode2Body: string;
};

const NATIVE_LABEL_GENDER_FLAGS: Record<string, "1" | "2"> = {
  male: "1",
  m: "1",
  "男": "1",
  yang_male: "1",
  female: "2",
  f: "2",
  "女": "2",
  yin_female: "2",
};

const VERIFIED_PLACE_LONGITUDES: Record<string, string> = {
  "杭州": "120.155",
  Hangzhou: "120.155",
  hangzhou: "120.155",
};

export function formatLongitude(value: string | number = "120.000"): string {
  const numeric = Number(String(value).trim());
  if (!Number.isFinite(numeric)) {
    throw new ValueError(`invalid longitude: ${String(value)}`);
  }
  const rounded = Math.sign(numeric || 1) * (Math.round(Math.abs(numeric) * 1000) / 1000);
  return rounded.toFixed(3);
}

export function genderToNativeLabelFlag(gender: GenderInput): "1" | "2" {
  const key = String(gender).trim().toLowerCase();
  const flag = NATIVE_LABEL_GENDER_FLAGS[key];
  if (!flag) {
    throw new ValueError(`unsupported gender for native label branch: ${String(gender)}`);
  }
  return flag;
}

export function canonicalGender(gender: GenderInput): "male" | "female" {
  return genderToNativeLabelFlag(gender) === "1" ? "male" : "female";
}

export function appHourCodeFromClockHour(hour: number): number {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new ValueError(`clock hour must be an integer from 0 to 23: ${hour}`);
  }
  if (hour === 0 || hour === 23) {
    return 0;
  }
  return Math.ceil(hour / 2) * 2;
}

export function buildMode2Body(input: Mode2BuildInput): string {
  const fields = [
    "2",
    integerField(input.year, "year"),
    integerField(input.month, "month"),
    integerField(input.day, "day"),
    integerField(input.hourCode, "hourCode"),
    integerField(input.minuteField ?? 30, "minuteField"),
    integerField(input.secondField ?? 30, "secondField"),
    formatLongitude(input.longitude ?? "120.000"),
    integerField(input.timezoneField ?? -8, "timezoneField"),
    genderToNativeLabelFlag(input.gender ?? "male"),
    integerField(input.tail1 ?? 0, "tail1"),
    integerField(input.tail2 ?? 0, "tail2"),
    integerField(input.tail3 ?? 0, "tail3"),
  ];
  const body = fields.join("|");
  parseMode2Body(body);
  return body;
}

export function buildNativeInput(body: string, checks?: string): string {
  if (!checks) {
    throw new ValueError("checks prefix is required for native getzwp input");
  }
  if (checks.includes("#")) {
    throw new ValueError("checks prefix must not contain '#'");
  }
  parseMode2Body(body);
  return `${checks}#${body}`;
}

export function parseMode2Body(body: string): ParsedMode2Body {
  const fields = body.split("|");
  if (fields.length !== 13) {
    throw new ValueError(`mode 2 body must have 13 fields, got ${fields.length}`);
  }
  if (fields[0] !== "2") {
    throw new ValueError(`mode 2 body must start with '2', got ${fields[0]}`);
  }
  const genderFlag = fields[9];
  if (genderFlag !== "1" && genderFlag !== "2") {
    throw new ValueError(`mode 2 genderFlag must be '1' or '2', got ${genderFlag}`);
  }
  return {
    fieldCount: 13,
    mode: parseInteger(fields[0], "mode") as 2,
    year: parseInteger(fields[1], "year"),
    month: parseInteger(fields[2], "month"),
    day: parseInteger(fields[3], "day"),
    hourCode: parseInteger(fields[4], "hourCode"),
    minuteField: parseInteger(fields[5], "minuteField"),
    secondField: parseInteger(fields[6], "secondField"),
    longitude: fields[7],
    timezoneField: parseInteger(fields[8], "timezoneField"),
    genderFlag,
    tail1: parseInteger(fields[10], "tail1"),
    tail2: parseInteger(fields[11], "tail2"),
    tail3: parseInteger(fields[12], "tail3"),
  };
}

export function normalizeBirthInput(input: BirthInput): NormalizedBirthInput {
  const parts = parseDatetime(input.datetime);
  const inputProfile = input.profile ?? "natal";
  const timezoneOffsetHours = input.timezone ?? 8;
  const appTimezoneField = -timezoneOffsetHours;
  const { longitude, source: longitudeSource } = resolveLongitude(input, inputProfile);
  const hourCode = appHourCodeFromClockHour(parts.hour);
  const gender = canonicalGender(input.gender);
  const appMode2Body = buildMode2Body({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hourCode,
    longitude,
    gender,
    timezoneField: appTimezoneField,
  });

  return {
    inputProfile,
    originalDatetime: input.datetime,
    place: input.place,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    clockHour: parts.hour,
    clockMinute: parts.minute,
    clockSecond: parts.second,
    hourCode,
    longitude,
    longitudeSource,
    timezoneOffsetHours,
    appTimezoneField,
    gender,
    genderFlag: genderToNativeLabelFlag(gender),
    appMode2Body,
  };
}

function resolveLongitude(input: BirthInput, profile: InputProfile): { longitude: string; source: LongitudeSource } {
  if (input.longitude !== undefined) {
    return { longitude: formatLongitude(input.longitude), source: "explicit" };
  }
  if (input.place) {
    const longitude = VERIFIED_PLACE_LONGITUDES[input.place.trim()];
    if (longitude) {
      return { longitude, source: "verified-place" };
    }
  }
  if (profile === "random-event") {
    return { longitude: "120.000", source: "app-random-event-default" };
  }
  throw new ValueError("longitude is required for natal charts unless place exists in the verified place table");
}

function parseDatetime(datetime: string): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const match = datetime
    .trim()
    .match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T])(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new ValueError(`datetime must match "YYYY-MM-DD HH:mm": ${datetime}`);
  }
  const [, year, month, day, hour, minute, second = "0"] = match;
  const parts = {
    year: parseInteger(year, "year"),
    month: parseInteger(month, "month"),
    day: parseInteger(day, "day"),
    hour: parseInteger(hour, "hour"),
    minute: parseInteger(minute, "minute"),
    second: parseInteger(second, "second"),
  };
  assertRange(parts.month, 1, 12, "month");
  assertRange(parts.day, 1, 31, "day");
  assertRange(parts.hour, 0, 23, "hour");
  assertRange(parts.minute, 0, 59, "minute");
  assertRange(parts.second, 0, 59, "second");
  return parts;
}

function integerField(value: number, field: string): string {
  return String(assertInteger(value, field));
}

function parseInteger(value: string, field: string): number {
  if (!/^-?\d+$/.test(value)) {
    throw new ValueError(`${field} must be an integer: ${value}`);
  }
  return Number(value);
}

function assertInteger(value: number, field: string): number {
  if (!Number.isInteger(value)) {
    throw new ValueError(`${field} must be an integer: ${value}`);
  }
  return value;
}

function assertRange(value: number, min: number, max: number, field: string): void {
  if (value < min || value > max) {
    throw new ValueError(`${field} must be from ${min} to ${max}: ${value}`);
  }
}

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
}
