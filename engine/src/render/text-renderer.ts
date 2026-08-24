import type { Palace, StarPlacement, TransformationEdge, ZiweiChart } from "../schema/chart";
import { validateCompleteChart } from "../schema/chart";

export function renderNatalText(chart: ZiweiChart): string {
  validateCompleteChart(chart);
  const lines: string[] = [
    "出生于",
    `输入类型：${chart.input.inputProfile === "random-event" ? "随机事件盘" : "出生盘"}`,
    `计算画像：${chart.meta.calculationProfile}`,
    `北京时间：${chart.calendar.clockTime}`,
    `APP时间：${chart.calendar.appClockTime}`,
    `真太阳时：${chart.calendar.trueSolarTime}`,
    `阴历时间：${chart.calendar.lunarTime}`,
    `四柱八字：${chart.calendar.fourPillars}`,
    `性别：${chart.calendar.gender}`,
    `五行局：${chart.calendar.fiveElements}`,
    `经度：${chart.calendar.longitude}`,
    `经度来源：${longitudeSourceLabel(chart.input.longitudeSource)}`,
    `最近节气编号：${chart.calendar.nearestSolarTerm}`,
    `来因宫：${chart.anchors.laiyinPalace}`,
    `命宫：${chart.anchors.mingPalace}`,
    `身宫：${chart.anchors.shenPalace}`,
    `命主：${chart.anchors.mingMaster}`,
    `身主：${chart.anchors.shenMaster}`,
    "",
    "十二宫：",
  ];

  for (const palace of chart.palaces) {
    lines.push("", renderPalaceHeader(palace));
    lines.push(`宫名：${palaceLabel(palace.name)}`);
    lines.push(`宫干：${palace.stem}`);
    lines.push(`宫内星：${formatStars(palace.stars)}`);
    let transformationTitle = `${palace.branch}宫产生的四化`;
    if (palace.markers.includes("来因宫")) {
      transformationTitle += " (即生年四化)";
    }
    lines.push(`${transformationTitle}：`);
    for (const transformation of palace.transformationsProduced) {
      lines.push(`  ${formatTransformation(transformation)}`);
    }
    lines.push(`自化：${formatTransformations(palace.selfTransformations)}`);
    lines.push(`冲化：${formatTransformations(palace.clashTransformations)}`);
    lines.push(`追禄：${palace.followLu.join("、") || "无"}`);
    lines.push(`追忌：${palace.followJi.join("、") || "无"}`);
    lines.push(`大限：${palace.decadeRange.start}~${palace.decadeRange.end}`);
    lines.push(`小限：${palace.annualAges.join(",")}`);
    lines.push(`小星：${palace.minorStars.map((star) => star.name).join("、")}`);
    lines.push(`长生：${palace.changsheng}`);
    lines.push(`博士十二神：${palace.doctor ?? ""}`);
    lines.push(`将前十二神：${palace.generalFront ?? ""}`);
    lines.push(`岁前十二神：${palace.yearFront ?? ""}`);
  }

  const gua = chart.triLayerHexagram;
  lines.push(
    "",
    "三层卦：",
    `层1：${gua.layer1_1}${formatSecondaryGua(gua.layer1_2)}`,
    `层2：${gua.layer2_1}${formatSecondaryGua(gua.layer2_2)}`,
    `层3：${gua.layer3_1}${formatSecondaryGua(gua.layer3_2)}`,
  );

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderPalaceHeader(palace: Palace): string {
  const markerText = palace.markers.length > 0 ? ` (${palace.markers.join(" / ")})` : "";
  return `${palace.branch}宫${markerText}`;
}

function formatStars(stars: StarPlacement[]): string {
  return stars.map((star) => (star.brightness ? `${star.name}(${star.brightness})` : star.name)).join(" ");
}

function formatTransformation(transformation: TransformationEdge): string {
  return `${transformation.star}化${transformation.type}${transformation.strength}%  -> ${transformation.targetBranch}${palaceLabel(transformation.targetPalace)}`;
}

function formatTransformations(transformations: TransformationEdge[]): string {
  return transformations.map(formatTransformation).join("；");
}

function formatSecondaryGua(value: string): string {
  return value ? ` / ${value}` : "";
}

function palaceLabel(value: string): string {
  return value.endsWith("宫") ? value : `${value}宫`;
}

function longitudeSourceLabel(value: ZiweiChart["input"]["longitudeSource"]): string {
  if (value === "explicit") return "明确输入";
  if (value === "verified-place") return "已验证地点表";
  return "APP随机事件默认值";
}
