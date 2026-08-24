import type { NativeDateTime } from "./calendar";
import type {
  NativeCalendarCoreEventBoundary,
  NativeCalendarCorePrefixResult,
} from "./native-calendar-core-prefix";

export type NativeNamedCyclicPair = {
  stemIndex: number;
  branchIndex: number;
  stem: string;
  branch: string;
  text: string;
};

export type NativeCalendarNamedResult = {
  formattedWorkingDate0xa0: string;
  formattedInputDate0xb8: string;
  cyclicPair0xe0_0xf8FromCalendar0xa0_0xa4: NativeNamedCyclicPair;
  cyclicPair0x110_0x128FromCalendar0xa8_0xac: NativeNamedCyclicPair;
  cyclicPair0x140_0x158FromCalendar0xb0_0xb4: NativeNamedCyclicPair;
  cyclicPair0x178_0x190FromCalendar0xb8_0xbc: NativeNamedCyclicPair;
  cyclicPair0x1a8_0x1c0FromCalendar0xc0_0xc4: NativeNamedCyclicPair;
  lunar0x1d8_0x214: {
    year: number;
    monthTableIndex: number;
    monthName: string;
    normalizedMonth0x234: number;
    dayTableIndex: number;
    dayName: string;
    dayNumber0x210: number;
    leapFlag0x214: number;
    leapMarker0x238: string;
    text: string;
  };
  boundary0x218_0x230: {
    formattedDate: string;
    label: number;
    source: NativeCalendarCoreEventBoundary;
  };
};

export type NativeCalendarNamedEvidenceContract = {
  function: { address: string; endExclusive: string };
  dateFormatter: { functionAddress: string; formatStringAddress: string; format: string };
  cyclicTables: Array<{
    kind: "stem" | "branch";
    virtualAddress: string;
    count: number;
    readAddresses: string[];
  }>;
  lunarTables: Array<{
    kind: "month" | "day";
    virtualAddress: string;
    count: number;
    readAddress: string;
  }>;
  monthNormalization: { start: string; through: string; expression: string };
  leapMarker: { stringAddress: string; text: string; branchAddress: string };
  boundary: { dateReadAddress: string; labelReadAddress: string };
  note: string;
};

export const NATIVE_STEMS_0X19ED00 = [
  "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸",
] as const;

export const NATIVE_BRANCHES_0X19EE10 = [
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
] as const;

export const NATIVE_LUNAR_MONTH_NAMES_0X1A5CA0 = [
  "冬", "腊", "正", "二", "三", "四", "五", "六", "七", "八", "九", "十",
] as const;

export const NATIVE_LUNAR_DAY_NAMES_0X1A5D00 = [
  "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十", "卅一",
] as const;

export function nativeCalendarNamed0x11b600(
  calendar: NativeCalendarCorePrefixResult,
): NativeCalendarNamedResult {
  const final = calendar.finalLookupCyclicFields0xa0_0xac;
  const preliminary = calendar.preliminaryCyclicFields;
  const lookup = calendar.lookupFields0xc8_0xd4;
  const monthName = tableValue(
    NATIVE_LUNAR_MONTH_NAMES_0X1A5CA0,
    lookup.output0xcc,
    "calendar output 0xcc lunar month table index",
  );
  const dayName = tableValue(
    NATIVE_LUNAR_DAY_NAMES_0X1A5D00,
    lookup.output0xd0,
    "calendar output 0xd0 lunar day table index",
  );
  const leapMarker = lookup.output0xd4 === 0 ? "" : "闰";

  return {
    formattedWorkingDate0xa0: formatNativeDate0x11ba60(calendar.workingDateTime0x00),
    formattedInputDate0xb8: formatNativeDate0x11ba60(calendar.trueSolarDateTime0x50),
    cyclicPair0xe0_0xf8FromCalendar0xa0_0xa4: namedPair(
      final.output0xa0,
      final.output0xa4,
    ),
    cyclicPair0x110_0x128FromCalendar0xa8_0xac: namedPair(
      final.output0xa8,
      final.output0xac,
    ),
    cyclicPair0x140_0x158FromCalendar0xb0_0xb4: namedPair(
      preliminary.output0xb0_0xb4.mod10,
      preliminary.output0xb0_0xb4.mod12,
    ),
    cyclicPair0x178_0x190FromCalendar0xb8_0xbc: namedPair(
      preliminary.output0xb8_0xbc.mod10,
      preliminary.output0xb8_0xbc.mod12,
    ),
    cyclicPair0x1a8_0x1c0FromCalendar0xc0_0xc4: namedPair(
      preliminary.output0xc0_0xc4.mod10,
      preliminary.output0xc0_0xc4.mod12,
    ),
    lunar0x1d8_0x214: {
      year: lookup.output0xc8,
      monthTableIndex: lookup.output0xcc,
      monthName,
      normalizedMonth0x234: normalizeMonth0x11b955(lookup.output0xcc),
      dayTableIndex: lookup.output0xd0,
      dayName,
      dayNumber0x210: lookup.output0xd0 + 1,
      leapFlag0x214: lookup.output0xd4,
      leapMarker0x238: leapMarker,
      text: `${lookup.output0xc8}年${leapMarker}${monthName}月${dayName}`,
    },
    boundary0x218_0x230: {
      formattedDate: formatNativeDate0x11ba60(
        calendar.eventBoundaries0xd8_0x183.atOrBefore0xd8.dateTime,
      ),
      label: calendar.eventBoundaries0xd8_0x183.atOrBefore0xd8.label,
      source: calendar.eventBoundaries0xd8_0x183.atOrBefore0xd8,
    },
  };
}

export function nativeCalendarNamedEvidenceContract(): NativeCalendarNamedEvidenceContract {
  return {
    function: { address: "0x11b600", endExclusive: "0x11ba2b" },
    dateFormatter: {
      functionAddress: "0x11ba60",
      formatStringAddress: "0x7709e",
      format: "%d-%02d-%02d %02d:%02d:%02d",
    },
    cyclicTables: [
      {
        kind: "stem",
        virtualAddress: "0x19ed00",
        count: 10,
        readAddresses: ["0x11b7ef", "0x11b824", "0x11b852", "0x11b88e", "0x11b8b5"],
      },
      {
        kind: "branch",
        virtualAddress: "0x19ee10",
        count: 12,
        readAddresses: ["0x11b806", "0x11b83b", "0x11b869", "0x11b89e", "0x11b8cc"],
      },
    ],
    lunarTables: [
      { kind: "month", virtualAddress: "0x1a5ca0", count: 12, readAddress: "0x11b8f7" },
      { kind: "day", virtualAddress: "0x1a5d00", count: 31, readAddress: "0x11b90e" },
    ],
    monthNormalization: {
      start: "0x11b955",
      through: "0x11b973",
      expression: "index == 0 ? 11 : index == 1 ? 12 : index - 1",
    },
    leapMarker: { stringAddress: "0x734f4", text: "闰", branchAddress: "0x11b982" },
    boundary: { dateReadAddress: "0x11b9aa", labelReadAddress: "0x11b99d" },
    note: "static adapter port from the 0x184-byte calendar result into APK table-backed names; field roles beyond the direct offset map remain neutral until 0x155370 is mapped",
  };
}

function namedPair(stemIndex: number, branchIndex: number): NativeNamedCyclicPair {
  const stem = tableValue(NATIVE_STEMS_0X19ED00, stemIndex, "stem index");
  const branch = tableValue(NATIVE_BRANCHES_0X19EE10, branchIndex, "branch index");
  return { stemIndex, branchIndex, stem, branch, text: `${stem}${branch}` };
}

function normalizeMonth0x11b955(index: number): number {
  if (index === 0) {
    return 11;
  }
  if (index === 1) {
    return 12;
  }
  return index - 1;
}

function formatNativeDate0x11ba60(dateTime: NativeDateTime): string {
  return [
    String(dateTime.year),
    pad2(dateTime.month),
    pad2(dateTime.day),
  ].join("-") + ` ${pad2(Math.trunc(dateTime.hour))}:${pad2(Math.trunc(dateTime.minute))}:${pad2(Math.trunc(dateTime.second))}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function tableValue<const Values extends readonly string[]>(
  values: Values,
  index: number,
  label: string,
): Values[number] {
  if (!Number.isInteger(index) || index < 0 || index >= values.length) {
    throw new NativeCalendarNamedError(`${label} is outside APK table: ${index}`);
  }
  return values[index];
}

export class NativeCalendarNamedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeCalendarNamedError";
  }
}
