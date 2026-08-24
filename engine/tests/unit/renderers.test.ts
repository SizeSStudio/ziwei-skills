import test from "node:test";
import assert from "node:assert/strict";
import { validateCompleteChart } from "../../src/schema/chart";
import { renderHtmlChart } from "../../src/render/html-renderer";
import { renderJsonChart } from "../../src/render/json-renderer";
import { renderNatalText } from "../../src/render/text-renderer";
import { completeChartFixture } from "../fixtures/complete-chart";

test("renders ziwei-natal compatible text from canonical chart json", () => {
  const text = renderNatalText(completeChartFixture());

  assert.match(text, /输入类型：出生盘/);
  assert.match(text, /计算画像：ziweixingyu-native/);
  assert.match(text, /经度来源：已验证地点表/);
  assert.match(text, /北京时间：1998-02-20 09:40:00/);
  assert.match(text, /真太阳时：1998-02-20 09:26:43/);
  assert.match(text, /APP时间：1998-02-20 10:30:30/);
  assert.match(text, /四柱八字：戊寅 甲寅 戊戌 丁巳/);
  assert.match(text, /午宫 \(来因宫\)/);
  assert.match(text, /酉宫 \(命宫\)/);
  assert.match(text, /廉贞化禄50%  -> 丑官禄宫/);
  assert.match(text, /博士十二神：/);
  assert.match(text, /将前十二神：/);
  assert.match(text, /岁前十二神：/);
  assert.equal((text.match(/宫名：/g) ?? []).length, 12);
});

test("renders static html audit surface with evidence hooks", () => {
  const html = renderHtmlChart(completeChartFixture());

  assert.match(html, /<!doctype html>/);
  assert.match(html, /data-palace-branch="酉"/);
  assert.match(html, /data-evidence-id="fixture.golden.sample"/);
  assert.match(html, /输入画像/);
  assert.match(html, /verified-place/);
  assert.match(html, /四化/);
  assert.match(html, /追忌/);
});

test("stable json renderer preserves evidence map", () => {
  const json = renderJsonChart(completeChartFixture());
  const parsed = JSON.parse(json);

  assert.equal(parsed.meta.source, "ziweixingyu-apk-native");
  assert.equal(parsed.meta.calculationProfile, "ziweixingyu-native");
  assert.equal(parsed.evidence["meta.source"][0].id, "fixture.golden.sample");
});

test("complete chart validation rejects missing palace structures", () => {
  const chart = completeChartFixture();
  chart.palaces.pop();

  assert.throws(() => validateCompleteChart(chart), /chart.palaces must contain 12 palaces/);
});
