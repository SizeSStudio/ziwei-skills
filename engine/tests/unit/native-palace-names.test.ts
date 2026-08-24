import test from "node:test";
import assert from "node:assert/strict";
import {
  nativePalaceNames0x157500,
  nativePalaceNamesEvidenceContract,
  NativePalaceNamesError,
} from "../../src/engine/native-palace-names";

test("ports all twelve 0x157500 palace-name assignments for the 1998 fixture", () => {
  const palaces = nativePalaceNames0x157500(9);
  assert.deepEqual(
    palaces.map(({ name, branch }) => `${name}:${branch}`),
    [
      "命宫:酉", "兄弟:申", "夫妻:未", "子女:午", "财帛:巳", "疾厄:辰",
      "迁移:卯", "交友:寅", "官禄:丑", "田宅:子", "福德:亥", "父母:戌",
    ],
  );
  assert.equal(new Set(palaces.map(({ branch }) => branch)).size, 12);
});

test("wraps the native signed offsets across 子 and rejects invalid anchors", () => {
  const palaces = nativePalaceNames0x157500(0);
  assert.equal(palaces[0]?.branch, "子");
  assert.equal(palaces[1]?.branch, "亥");
  assert.equal(palaces[11]?.branch, "丑");
  assert.throws(() => nativePalaceNames0x157500(12), NativePalaceNamesError);
});

test("exposes every native string address and signed relative lookup", () => {
  const contract = nativePalaceNamesEvidenceContract();
  assert.equal(contract.functionRange, "[0x157500, 0x1583ca)");
  assert.equal(contract.stringAddresses.length, 12);
  assert.deepEqual(contract.relativeOffsets, [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11]);
});
