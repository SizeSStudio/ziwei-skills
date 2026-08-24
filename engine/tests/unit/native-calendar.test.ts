import test from "node:test";
import assert from "node:assert/strict";
import { nativeCalendarInvocationFromNormalizedInput, nativeCalendarInvocationFromMode2Body } from "../../src/engine/native-calendar";
import { normalizeBirthInput } from "../../src/engine/normalize";

test("maps APP mode 2 body into the native calendar invocation", () => {
  const invocation = nativeCalendarInvocationFromMode2Body("2|1998|2|20|10|30|30|120.155|-8|1|0|0|0");

  assert.deepEqual(invocation.dateTime, {
    year: 1998,
    month: 2,
    day: 20,
    hour: 10,
    minute: 30,
    second: 30,
  });
  assert.equal(invocation.longitudeDegrees, 120.155);
  assert.equal(invocation.timezoneField, -8);
  assert.equal(invocation.firstCalendarCoreMode, 0);
  assert.equal(invocation.evidence.nativeWrapper.address, "arm64:0x12530c; x86_64:0x124b80");
  assert.equal(invocation.evidence.calendarCore.address, "0x14dbd0");
});

test("keeps user clock time separate from APP native calendar fields", () => {
  const normalized = normalizeBirthInput({
    datetime: "1998-02-20 09:40",
    place: "杭州",
    gender: "male",
  });

  const invocation = nativeCalendarInvocationFromNormalizedInput(normalized);

  assert.equal(normalized.clockHour, 9);
  assert.equal(normalized.clockMinute, 40);
  assert.equal(invocation.dateTime.hour, 10);
  assert.equal(invocation.dateTime.minute, 30);
  assert.equal(invocation.dateTime.second, 30);
  assert.equal(invocation.source.appMode2Body, "2|1998|2|20|10|30|30|120.155|-8|1|0|0|0");
});
