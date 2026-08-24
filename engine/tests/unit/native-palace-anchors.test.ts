import test from "node:test";
import assert from "node:assert/strict";
import { nativeCalendarContextState0x17f450 } from "../../src/engine/native-context-state";
import { nativeCalendarNamed0x11b600 } from "../../src/engine/native-calendar-named";
import { nativeCalendarWrapper0x124b80 } from "../../src/engine/native-calendar-wrapper";
import {
  nativePalaceAnchors0x155370,
  nativePalaceAnchorsEvidenceContract,
} from "../../src/engine/native-palace-anchors";

test("ports the 0x155370 gender, ming-palace, and shen-palace prefix", () => {
  const calendar = nativeCalendarNamed0x11b600(
    nativeCalendarWrapper0x124b80({
      context: nativeCalendarContextState0x17f450(),
      dateTime: { year: 1998, month: 2, day: 20, hour: 10, minute: 30, second: 30 },
      longitudeDegrees: 120.155,
      timezoneHours: -8,
    }),
  );

  assert.deepEqual(nativePalaceAnchors0x155370(calendar, "male"), {
    lunarYearStem: "戊",
    yearPolarity: "yang",
    genderLabel0x128: "阳男",
    normalizedLunarMonth: 1,
    hourBranchIndex: 5,
    hourBranch: "巳",
    mingPalaceIndex0x98: 9,
    mingPalaceBranch0x98: "酉",
    shenPalaceIndex0xb0: 7,
    shenPalaceBranch0xb0: "未",
  });
  assert.equal(nativePalaceAnchors0x155370(calendar, "female").genderLabel0x128, "阳女");
});

test("documents the exact APK branch table and signed formulas", () => {
  const contract = nativePalaceAnchorsEvidenceContract();
  assert.equal(contract.orchestrator.functionAddress, "0x155370");
  assert.equal(contract.branchTable.virtualAddress, "0x19f3d0");
  assert.equal(
    contract.formulas.ming.expression,
    "mod12(index(寅) + normalizedMonth - hourBranchIndex - 1)",
  );
  assert.equal(
    contract.formulas.shen.expression,
    "mod12(index(寅) + normalizedMonth + hourBranchIndex - 1)",
  );
});
