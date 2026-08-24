import type { ZiweiChart } from "../schema/chart";
import { validateCompleteChart } from "../schema/chart";

export function renderJsonChart(chart: ZiweiChart): string {
  validateCompleteChart(chart);
  return `${JSON.stringify(chart, null, 2)}\n`;
}
