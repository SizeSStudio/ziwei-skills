import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeFiveElementsBureau0x1586a0,
  nativeFiveElementsBureauEvidenceContract,
  NativeFiveElementsBureauError,
} from "../../src/engine/native-five-elements-bureau";

test("ports the APK 五行局 lookup for a fire-six characterization vector", () => {
  assert.deepEqual(nativeFiveElementsBureau0x1586a0("己", "未"), {
    palaceStem: "己",
    palaceBranch: "未",
    stemGroup1Based: 3,
    branchGroup1Based: 1,
    wrappedKey0x1cc: 4,
    bureauNumber: 6,
    bureauName0x110: "火六局",
  });
});

test("maps the transcribed 2717 APP 乙巳 life palace to 火六局", () => {
  assert.deepEqual(nativeFiveElementsBureau0x1586a0("乙", "巳"), {
    palaceStem: "乙",
    palaceBranch: "巳",
    stemGroup1Based: 1,
    branchGroup1Based: 3,
    wrappedKey0x1cc: 4,
    bureauNumber: 6,
    bureauName0x110: "火六局",
  });
});

test("locks all five APK key-to-bureau nodes", () => {
  assert.equal(nativeFiveElementsBureau0x1586a0("壬", "未").bureauName0x110, "木三局");
  assert.equal(nativeFiveElementsBureau0x1586a0("甲", "子").bureauName0x110, "金四局");
  assert.equal(nativeFiveElementsBureau0x1586a0("甲", "寅").bureauName0x110, "水二局");
  assert.equal(nativeFiveElementsBureau0x1586a0("丁", "辰").bureauName0x110, "土五局");
  assert.equal(nativeFiveElementsBureau0x1586a0("己", "未").bureauName0x110, "火六局");
  assert.equal(nativeFiveElementsBureau0x1586a0("丙", "子").stemGroup1Based, 2);
});

test("rejects inputs outside native groups and exposes the final reorder", () => {
  assert.throws(() => nativeFiveElementsBureau0x1586a0("A", "未"), NativeFiveElementsBureauError);
  assert.throws(() => nativeFiveElementsBureau0x1586a0("己", "A"), NativeFiveElementsBureauError);
  assert.deepEqual(nativeFiveElementsBureauEvidenceContract().keyToBureau, [5, 3, 4, 2, 6]);
});
