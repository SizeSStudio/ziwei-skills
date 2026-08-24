import type { EvidenceRef } from "../schema/evidence";
import type { Palace, TransformationEdge, ZiweiChart } from "../schema/chart";
import { validateCompleteChart } from "../schema/chart";

const GRID_AREAS: Record<string, string> = {
  "巳": "si", "午": "wu", "未": "wei", "申": "shen",
  "辰": "chen", "酉": "you", "卯": "mao", "戌": "xu",
  "寅": "yin", "丑": "chou", "子": "zi", "亥": "hai",
};

export function renderHtmlChart(chart: ZiweiChart): string {
  validateCompleteChart(chart);
  const chartJson = JSON.stringify(chart);
  return `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <title>${escapeHtml(chart.meta.chartSlug)} 紫微命盘</title>
  <style>
    :root { color-scheme: light; --paper: #f5f2ea; --surface: #fffdf8; --ink: #1f2528; --muted: #697176; --line: #cbd0cf; --red: #a33b32; --blue: #245b78; --gold: #8b6a26; --green: #3f6859; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif; }
    main { max-width: 1480px; margin: 0 auto; padding: 22px; }
    header { display: flex; justify-content: space-between; align-items: end; gap: 24px; border-bottom: 2px solid var(--ink); padding-bottom: 14px; margin-bottom: 14px; }
    h1, h2, h3, p { margin-top: 0; }
    h1 { margin-bottom: 4px; font-size: 26px; line-height: 1.2; letter-spacing: 0; }
    h2 { margin-bottom: 10px; font-size: 17px; letter-spacing: 0; }
    .subtitle, .muted, dt, .label { color: var(--muted); }
    .subtitle { margin: 0; font-size: 13px; }
    .status { max-width: 360px; text-align: right; font-size: 12px; line-height: 1.5; color: var(--muted); }
    .board-scroll { overflow-x: auto; padding-bottom: 5px; }
    .board { min-width: 1160px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(228px, auto)); grid-template-areas: "si wu wei shen" "chen center center you" "mao center center xu" "yin chou zi hai"; gap: 8px; }
    .palace, .center { border: 1px solid var(--line); background: var(--surface); border-radius: 4px; }
    .palace { padding: 10px; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
    .palace.important { border-top: 3px solid var(--red); padding-top: 8px; }
    .palace h3 { display: flex; justify-content: space-between; gap: 8px; margin: 0; font-size: 15px; line-height: 1.3; letter-spacing: 0; }
    .stem { color: var(--blue); font-weight: 650; white-space: nowrap; }
    .markers { min-height: 18px; color: var(--red); font-size: 11px; font-weight: 650; }
    .stars { min-height: 42px; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
    .major { color: var(--red); font-weight: 700; }
    .brightness { color: var(--muted); font-weight: 400; }
    .minor, .transformations { font-size: 11px; line-height: 1.45; overflow-wrap: anywhere; }
    .transformations { padding-top: 5px; border-top: 1px dotted var(--line); }
    .edge { display: block; }
    .edge-lu { color: var(--red); } .edge-quan { color: var(--gold); } .edge-ke { color: var(--green); } .edge-ji { color: var(--blue); }
    .limits { margin-top: auto; padding-top: 5px; border-top: 1px dotted var(--line); font-size: 10px; line-height: 1.45; color: var(--muted); }
    .evidence { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; color: #8a8e90; overflow-wrap: anywhere; }
    .center { grid-area: center; padding: 18px; display: grid; grid-template-columns: 1.1fr .9fr; gap: 18px; align-content: start; background: #f9faf8; border: 2px solid var(--ink); }
    .center h2 { padding-bottom: 7px; border-bottom: 1px solid var(--line); }
    dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 6px 12px; margin: 0; font-size: 13px; line-height: 1.4; }
    dd { margin: 0; overflow-wrap: anywhere; }
    .anchor-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 14px 0; }
    .anchor { border-left: 3px solid var(--red); padding: 5px 8px; background: #fff; }
    .anchor b { display: block; font-size: 14px; }
    .anchor span { color: var(--muted); font-size: 10px; }
    .gua { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .gua div { border: 1px solid var(--line); padding: 7px; text-align: center; background: #fff; font-size: 12px; }
    .gua b { display: block; color: var(--blue); font-size: 15px; }
    .natal-edges p { margin: 0 0 6px; font-size: 12px; line-height: 1.45; }
    .audit { margin-top: 14px; padding-top: 12px; border-top: 2px solid var(--ink); display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .audit p { margin-bottom: 5px; font-size: 12px; line-height: 1.5; }
    @media (max-width: 760px) {
      main { padding: 12px; }
      header { align-items: start; flex-direction: column; gap: 8px; }
      .status { text-align: left; }
      .board-scroll { overflow: visible; }
      .board { min-width: 0; display: flex; flex-direction: column; }
      .center { order: -1; display: grid; grid-template-columns: 1fr; }
      .palace { min-height: 210px; }
      .audit { grid-template-columns: 1fr; }
    }
    @media print { body { background: #fff; } main { max-width: none; padding: 0; } .board { min-width: 0; grid-template-rows: repeat(4, minmax(185px, auto)); } .evidence { display: none; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div><h1>紫微命盘</h1><p class="subtitle">${escapeHtml(chart.meta.chartSlug)} · 紫微星语 APK-native 复刻</p></div>
      <div class="status">画像 ${escapeHtml(chart.meta.calculationProfile)} · 引擎 ${escapeHtml(chart.meta.engineVersion)}<br>${escapeHtml(chart.meta.parityStatus)} · 源 APK ${escapeHtml(chart.meta.apkSha256.slice(0, 16))}…</div>
    </header>
    <div class="board-scroll">
      <section class="board" aria-label="十二宫命盘">
        ${chart.palaces.map((palace, index) => renderPalace(chart, palace, index)).join("\n")}
        ${renderCenter(chart)}
      </section>
    </div>
    <section class="audit" aria-label="四化和审计信息">
      <div><h2>生年四化</h2><div class="natal-edges">${chart.natalTransformations.map(renderTransformationParagraph).join("\n")}</div></div>
      <div><h2>数据接口</h2><p>本页内嵌完整 canonical chart JSON，供其他 skill 或工具读取。</p><p class="muted">十二宫均保留四化、自化、冲化、追禄、追忌、大限、小限与原生证据标识。</p></div>
    </section>
    <script type="application/json" id="data-chart-json" data-chart-json>${escapeScriptJson(chartJson)}</script>
  </main>
</body>
</html>
`;
}

function renderCenter(chart: ZiweiChart): string {
  const gua = chart.triLayerHexagram;
  return `<section class="center">
  <div>
    <h2>历法基准</h2>
    <dl>
      <dt>输入时间</dt><dd>${escapeHtml(chart.calendar.clockTime)}</dd>
      <dt>输入画像</dt><dd>${chart.input.inputProfile === "random-event" ? "随机事件盘" : "出生盘"}</dd>
      <dt>APP 时间</dt><dd>${escapeHtml(chart.calendar.appClockTime)}</dd>
      <dt>真太阳时</dt><dd>${escapeHtml(chart.calendar.trueSolarTime)}</dd>
      <dt>阴历</dt><dd>${escapeHtml(chart.calendar.lunarTime)}</dd>
      <dt>四柱</dt><dd>${escapeHtml(chart.calendar.fourPillars)}</dd>
      <dt>性别 / 五行局</dt><dd>${escapeHtml(chart.calendar.gender)} / ${escapeHtml(chart.calendar.fiveElements)}</dd>
      <dt>经度 / 节气标号</dt><dd>${escapeHtml(chart.calendar.longitude)} / ${escapeHtml(chart.calendar.nearestSolarTerm)}</dd>
      <dt>经度来源</dt><dd>${escapeHtml(chart.input.longitudeSource)}</dd>
    </dl>
    <div class="anchor-list">
      <div class="anchor"><span>命宫</span><b>${escapeHtml(chart.anchors.mingPalace)}</b></div>
      <div class="anchor"><span>身宫</span><b>${escapeHtml(chart.anchors.shenPalace)}</b></div>
      <div class="anchor"><span>来因</span><b>${escapeHtml(chart.anchors.laiyinPalace)}</b></div>
    </div>
    <dl><dt>命主</dt><dd>${escapeHtml(chart.anchors.mingMaster)}</dd><dt>身主</dt><dd>${escapeHtml(chart.anchors.shenMaster)}</dd></dl>
  </div>
  <div>
    <h2>三层卦</h2>
    <div class="gua">
      <div><span>第一层</span><b>${renderGuaLayer(gua.layer1_1, gua.layer1_2)}</b></div>
      <div><span>第二层</span><b>${renderGuaLayer(gua.layer2_1, gua.layer2_2)}</b></div>
      <div><span>第三层</span><b>${renderGuaLayer(gua.layer3_1, gua.layer3_2)}</b></div>
    </div>
    <h2 style="margin-top:16px">生年四化</h2>
    <div class="natal-edges">${chart.natalTransformations.map(renderTransformationParagraph).join("\n")}</div>
  </div>
</section>`;
}

function renderPalace(chart: ZiweiChart, palace: Palace, index: number): string {
  const evidence = firstEvidence(chart, `palaces.${index}`, "palaces", "meta.source");
  const area = GRID_AREAS[palace.branch];
  if (!area) throw new Error(`unsupported palace branch for HTML grid: ${palace.branch}`);
  const important = palace.markers.length > 0 ? " important" : "";
  const majorNames = new Set(palace.majorStars.map(({ name }) => name));
  return `<article class="palace${important}" style="grid-area:${area}" data-palace-branch="${escapeAttr(palace.branch)}" data-evidence-id="${escapeAttr(evidence?.id ?? "")}">
  <h3><span>${escapeHtml(palace.branch)}宫 · ${escapeHtml(palace.name)}</span><span class="stem">${escapeHtml(palace.stem)}${escapeHtml(palace.branch)}</span></h3>
  <div class="markers">${escapeHtml(palace.markers.join(" / "))}</div>
  <div class="stars">${palace.stars.map((star) => renderStar(star.name, star.brightness, majorNames.has(star.name))).join(" ")}</div>
  <div class="transformations"><span class="label">四化</span>${renderEdges(palace.transformationsProduced)}</div>
  <div class="minor"><span class="label">自化</span> ${renderEdgesInline(palace.selfTransformations)} · <span class="label">冲化</span> ${renderEdgesInline(palace.clashTransformations)}</div>
  <div class="minor"><span class="label">追禄</span> ${escapeHtml(palace.followLu.join("、") || "无")} · <span class="label">追忌</span> ${escapeHtml(palace.followJi.join("、") || "无")}</div>
  <div class="limits">大限 ${palace.decadeRange.start}~${palace.decadeRange.end} · 小限 ${palace.annualAges.join(",")}<br>${escapeHtml(palace.changsheng)} / ${escapeHtml(palace.doctor ?? "")} / ${escapeHtml(palace.generalFront ?? "")} / ${escapeHtml(palace.yearFront ?? "")}</div>
  <div class="evidence">${escapeHtml(evidenceLabel(evidence))}</div>
</article>`;
}

function renderStar(name: string, brightness: string | undefined, major: boolean): string {
  const value = `${escapeHtml(name)}${brightness ? `<span class="brightness">(${escapeHtml(brightness)})</span>` : ""}`;
  return major ? `<span class="major">${value}</span>` : `<span>${value}</span>`;
}

function renderEdges(edges: TransformationEdge[]): string {
  if (edges.length === 0) return " <span class=\"muted\">无</span>";
  return edges.map((edge) => `<span class="edge edge-${edgeClass(edge.type)}">${renderTransformationInline(edge)}</span>`).join("");
}

function renderEdgesInline(edges: TransformationEdge[]): string {
  return edges.length === 0 ? "无" : edges.map(renderTransformationInline).join("；");
}

function renderTransformationParagraph(edge: TransformationEdge): string {
  return `<p class="edge-${edgeClass(edge.type)}">${renderTransformationInline(edge)}</p>`;
}

function renderTransformationInline(edge: TransformationEdge): string {
  return `${escapeHtml(edge.star)}化${escapeHtml(edge.type)}${edge.strength}% → ${escapeHtml(edge.targetBranch)}${escapeHtml(edge.targetPalace)}`;
}

function edgeClass(type: string): string {
  return ({ "禄": "lu", "权": "quan", "科": "ke", "忌": "ji" } as Record<string, string>)[type] ?? "unknown";
}

function renderGuaLayer(primary: string, secondary: string): string {
  return escapeHtml(secondary ? `${primary} / ${secondary}` : primary);
}

function firstEvidence(chart: ZiweiChart, ...paths: string[]): EvidenceRef | undefined {
  for (const path of paths) {
    const refs = chart.evidence[path];
    if (refs?.[0]) return refs[0];
  }
  return undefined;
}

function evidenceLabel(evidence: EvidenceRef | undefined): string {
  if (!evidence) return "evidence: none";
  return `evidence: ${evidence.id}${evidence.address ? ` ${evidence.address}` : ""}`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function escapeScriptJson(value: string): string {
  return value.replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}
