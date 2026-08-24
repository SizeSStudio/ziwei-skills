import test from "node:test";
import assert from "node:assert/strict";
import {
  appHourCodeFromClockHour,
  buildMode2Body,
  buildNativeInput,
  formatLongitude,
  genderToNativeLabelFlag,
  normalizeBirthInput,
  parseMode2Body,
} from "../../src/engine/normalize";

test("normalizes Hangzhou birth input into the APK mode 2 body", () => {
  const normalized = normalizeBirthInput({
    datetime: "1998-02-20 09:40",
    place: "杭州",
    gender: "male",
  });

  assert.equal(normalized.hourCode, 10);
  assert.equal(normalized.inputProfile, "natal");
  assert.equal(normalized.longitude, "120.155");
  assert.equal(normalized.longitudeSource, "verified-place");
  assert.equal(normalized.timezoneOffsetHours, 8);
  assert.equal(normalized.appTimezoneField, -8);
  assert.equal(normalized.appMode2Body, "2|1998|2|20|10|30|30|120.155|-8|1|0|0|0");
});

test("uses longitude 120 only for the explicit random-event profile", () => {
  const event = normalizeBirthInput({
    datetime: "5205-12-17 23:12:51",
    gender: "female",
    profile: "random-event",
  });

  assert.equal(event.inputProfile, "random-event");
  assert.equal(event.longitude, "120.000");
  assert.equal(event.longitudeSource, "app-random-event-default");
  assert.equal(event.appMode2Body, "2|5205|12|17|0|30|30|120.000|-8|2|0|0|0");
  assert.throws(
    () => normalizeBirthInput({ datetime: "1998-02-20 09:40", gender: "male" }),
    /longitude is required for natal charts/,
  );
});

test("uses the native mode 2 gender flags", () => {
  assert.equal(genderToNativeLabelFlag("male"), "1");
  assert.equal(genderToNativeLabelFlag("female"), "2");
});

test("builds and parses exactly thirteen mode 2 fields", () => {
  const body = buildMode2Body({
    year: 1998,
    month: 2,
    day: 20,
    hourCode: 10,
    longitude: 120.155,
    gender: "male",
  });

  assert.equal(body.split("|").length, 13);
  assert.deepEqual(parseMode2Body(body), {
    fieldCount: 13,
    mode: 2,
    year: 1998,
    month: 2,
    day: 20,
    hourCode: 10,
    minuteField: 30,
    secondField: 30,
    longitude: "120.155",
    timezoneField: -8,
    genderFlag: "1",
    tail1: 0,
    tail2: 0,
    tail3: 0,
  });
});

test("requires checks before constructing native getzwp input", () => {
  const body = buildMode2Body({ year: 1998, month: 2, day: 20, hourCode: 10, gender: "female" });

  assert.throws(() => buildNativeInput(body), /checks prefix is required/);
  assert.equal(
    buildNativeInput(body, "123456789012345678"),
    "123456789012345678#2|1998|2|20|10|30|30|120.000|-8|2|0|0|0",
  );
});

test("formats longitude and derives APP hour code from clock hour", () => {
  assert.equal(formatLongitude(120), "120.000");
  assert.equal(formatLongitude("120.1545"), "120.155");
  assert.equal(appHourCodeFromClockHour(0), 0);
  assert.equal(appHourCodeFromClockHour(9), 10);
  assert.equal(appHourCodeFromClockHour(22), 22);
});
