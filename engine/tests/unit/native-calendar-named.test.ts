import test from "node:test";
import assert from "node:assert/strict";
import { nativeCalendarContextState0x17f450 } from "../../src/engine/native-context-state";
import {
  nativeCalendarNamed0x11b600,
  nativeCalendarNamedEvidenceContract,
} from "../../src/engine/native-calendar-named";
import { nativeCalendarWrapper0x124b80 } from "../../src/engine/native-calendar-wrapper";

test("ports the APK 0x11b600 calendar naming adapter for the 1998 fixture", () => {
  const sourceDateTime = { year: 1998, month: 2, day: 20, hour: 10, minute: 30, second: 30 };
  const calendar = nativeCalendarWrapper0x124b80({
    context: nativeCalendarContextState0x17f450(),
    dateTime: sourceDateTime,
    longitudeDegrees: 120.155,
    timezoneHours: -8,
  });
  const named = nativeCalendarNamed0x11b600(calendar);

  assert.equal(named.formattedInputDate0xb8, "1998-02-20 10:30:30");
  assert.equal(named.cyclicPair0xe0_0xf8FromCalendar0xa0_0xa4.text, "戊寅");
  assert.equal(named.cyclicPair0x110_0x128FromCalendar0xa8_0xac.text, "戊寅");
  assert.equal(named.cyclicPair0x140_0x158FromCalendar0xb0_0xb4.text, "甲寅");
  assert.equal(named.cyclicPair0x178_0x190FromCalendar0xb8_0xbc.text, "戊戌");
  assert.equal(named.cyclicPair0x1a8_0x1c0FromCalendar0xc0_0xc4.text, "丁巳");
  assert.deepEqual(named.lunar0x1d8_0x214, {
    year: 1998,
    monthTableIndex: 2,
    monthName: "正",
    normalizedMonth0x234: 1,
    dayTableIndex: 23,
    dayName: "廿四",
    dayNumber0x210: 24,
    leapFlag0x214: 0,
    leapMarker0x238: "",
    text: "1998年正月廿四",
  });
  assert.equal(named.boundary0x218_0x230.label, 4);
  assert.equal(named.boundary0x218_0x230.formattedDate, "1998-02-19 10:57:15");
});

test("documents the APK tables and direct calendar offset reads", () => {
  const contract = nativeCalendarNamedEvidenceContract();
  assert.deepEqual(contract.function, { address: "0x11b600", endExclusive: "0x11ba2b" });
  assert.equal(contract.cyclicTables[0].virtualAddress, "0x19ed00");
  assert.equal(contract.cyclicTables[1].virtualAddress, "0x19ee10");
  assert.equal(contract.lunarTables[0].virtualAddress, "0x1a5ca0");
  assert.equal(contract.lunarTables[1].virtualAddress, "0x1a5d00");
  assert.equal(contract.monthNormalization.expression, "index == 0 ? 11 : index == 1 ? 12 : index - 1");
});
