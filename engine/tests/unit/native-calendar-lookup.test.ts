import test from "node:test";
import assert from "node:assert/strict";
import {
  CALENDAR_CORE_LOOKUP_OUTPUT_OFFSETS,
  NATIVE_CALENDAR_LOOKUP_OUTPUT_OFFSETS,
  NATIVE_CALENDAR_LOOKUP_STATIC_PORT_EVIDENCE,
  NATIVE_CALENDAR_YEAR_BASE,
  calendarCoreLookupFieldsFromNativeLookup,
  nativeCalendarLookupConsumedSlice0x14bed0,
} from "../../src/engine/native-calendar-lookup";
import { nativeCalendarContextState0x17f450 } from "../../src/engine/native-context-state";

test("documents the 0x14bed0 output offsets consumed by 0x14dbd0", () => {
  assert.deepEqual(NATIVE_CALENDAR_LOOKUP_OUTPUT_OFFSETS, {
    byte0x1c: 0x1c,
    byte0x68: 0x68,
    byte0x6a: 0x6a,
    localYearOffset0x74: 0x74,
    byte0x78: 0x78,
    byte0x79: 0x79,
    byte0x7a: 0x7a,
    byte0x7b: 0x7b,
  });
  assert.deepEqual(CALENDAR_CORE_LOOKUP_OUTPUT_OFFSETS, {
    output0xc8: 0xc8,
    output0xcc: 0xcc,
    output0xd0: 0xd0,
    output0xd4: 0xd4,
  });
});

test("maps the 0x14bed0 result slice into the 0x14dbd0 caller fields", () => {
  assert.equal(NATIVE_CALENDAR_YEAR_BASE, 0x7c0);
  assert.deepEqual(
    calendarCoreLookupFieldsFromNativeLookup({
      byte0x1c: 12,
      byte0x68: 5,
      byte0x6a: 1,
      localYearOffset0x74: 98,
      byte0x78: 0,
      byte0x79: 0,
      byte0x7a: 0,
      byte0x7b: 0,
    }),
    {
      output0xc8: 0x7c0 + 98,
      output0xcc: 5,
      output0xd0: 12,
      output0xd4: 1,
    },
  );
});

test("keeps consumed 0x14bed0 byte fields in unsigned byte range", () => {
  assert.throws(
    () =>
      calendarCoreLookupFieldsFromNativeLookup({
        byte0x1c: 256,
        byte0x68: 5,
        byte0x6a: 1,
        localYearOffset0x74: 98,
        byte0x78: 0,
        byte0x79: 0,
        byte0x7a: 0,
        byte0x7b: 0,
      }),
    /byte0x1c must fit uint8/,
  );
});

test("ports the 0x14bed0 slice consumed by 0x14dbd0 for the 1998 Hangzhou fixture date", () => {
  const context = nativeCalendarContextState0x17f450();

  assert.deepEqual(nativeCalendarLookupConsumedSlice0x14bed0(context, 1998, 2, 20), {
    byte0x1c: 23,
    byte0x68: 2,
    byte0x6a: 0,
    localYearOffset0x74: 14,
    byte0x78: 4,
    byte0x79: 2,
    byte0x7a: 4,
    byte0x7b: 2,
  });
  assert.equal(context.recordCache0x10.length, 25);
  assert.equal(context.monthBoundaries0x50.length, 15);
  assert.equal(NATIVE_CALENDAR_LOOKUP_STATIC_PORT_EVIDENCE.address, "0x14bed0");
});

test("switches lookup fields exactly at native month boundaries", () => {
  const context = nativeCalendarContextState0x17f450();

  assert.deepEqual(nativeCalendarLookupConsumedSlice0x14bed0(context, 1998, 1, 27), {
    byte0x1c: 28,
    byte0x68: 1,
    byte0x6a: 0,
    localYearOffset0x74: 13,
    byte0x78: 3,
    byte0x79: 1,
    byte0x7a: 3,
    byte0x7b: 1,
  });
  assert.deepEqual(nativeCalendarLookupConsumedSlice0x14bed0(context, 1998, 1, 28), {
    byte0x1c: 0,
    byte0x68: 2,
    byte0x6a: 0,
    localYearOffset0x74: 14,
    byte0x78: 3,
    byte0x79: 1,
    byte0x7a: 4,
    byte0x7b: 2,
  });
  assert.deepEqual(nativeCalendarLookupConsumedSlice0x14bed0(context, 1998, 2, 27), {
    byte0x1c: 0,
    byte0x68: 3,
    byte0x6a: 0,
    localYearOffset0x74: 14,
    byte0x78: 4,
    byte0x79: 2,
    byte0x7a: 4,
    byte0x7b: 2,
  });
});

test("accepts day zero because 0x14dbd0 uses it for the previous-day fallback", () => {
  assert.deepEqual(
    nativeCalendarLookupConsumedSlice0x14bed0(nativeCalendarContextState0x17f450(), 1998, 3, 0),
    nativeCalendarLookupConsumedSlice0x14bed0(nativeCalendarContextState0x17f450(), 1998, 2, 28),
  );
});

test("rejects impossible civil dates before reading native lookup tables", () => {
  const context = nativeCalendarContextState0x17f450();
  assert.throws(
    () => nativeCalendarLookupConsumedSlice0x14bed0(context, 1998, 2, 30),
    /day is outside native month/,
  );
});
