// src/lib/valuation/charts/chartUtils.ts
// Shared constants and helpers for SVG chart rendering.

// ========== PALETTE (matching premoney.pdf brand) ==========

export const CHART_COLORS = {
  primary: "#4C6AD2",
  secondary: "#7B4FD6",
  rose: "#C8465C",
  coral: "#FFAB91",
  green: "#8BC34A",
  purple: "#7B2D8E",
  amber: "#F59E0B",
  teal: "#14B8A6",
  slate: "#64748B",
} as const;

export const SERIES_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.rose,
  CHART_COLORS.green,
  CHART_COLORS.secondary,
  CHART_COLORS.amber,
  CHART_COLORS.teal,
  CHART_COLORS.coral,
  CHART_COLORS.purple,
  CHART_COLORS.slate,
];

// ========== CHART DIMENSIONS ==========

export const DEFAULT_WIDTH = 560;
export const DEFAULT_HEIGHT = 320;
export const PADDING = { top: 30, right: 20, bottom: 50, left: 70 };

// ========== FONT ==========

export const CHART_FONT = "'Sora', 'Inter', -apple-system, sans-serif";
export const AXIS_FONT_SIZE = 11;
export const LABEL_FONT_SIZE = 10;
export const TITLE_FONT_SIZE = 13;

// ========== AXIS COLORS ==========

export const AXIS_COLOR = "#9CA3AF";
export const GRID_COLOR = "#E5E7EB";
export const TEXT_COLOR = "#374151";
export const MUTED_COLOR = "#6B7280";

// ========== FORMATTERS ==========

export function formatCurrency(
  value: number,
  locale = "en-US",
  compact = true,
): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toLocaleString(locale, { maximumFractionDigits: 0 });
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ========== SCALE COMPUTATION ==========

/**
 * Compute "nice" axis bounds and tick marks.
 * Returns { min, max, ticks[] } where ticks are evenly spaced round numbers.
 */
export function computeNiceScale(
  dataMin: number,
  dataMax: number,
  targetTicks = 5,
): { min: number; max: number; ticks: number[] } {
  if (dataMin === dataMax) {
    const pad = Math.abs(dataMin) * 0.1 || 1;
    dataMin -= pad;
    dataMax += pad;
  }

  const range = dataMax - dataMin;
  const roughStep = range / targetTicks;

  // Round step to a "nice" value (1, 2, 5, 10, 20, 50, etc.)
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;
  let niceStep: number;
  if (residual <= 1.5) niceStep = 1 * magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMin = Math.floor(dataMin / niceStep) * niceStep;
  const niceMax = Math.ceil(dataMax / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v * 1e10) / 1e10); // avoid float drift
  }

  return { min: niceMin, max: niceMax, ticks };
}

/**
 * Linear interpolation: map value from [domainMin, domainMax] -> [rangeMin, rangeMax]
 */
export function lerp(
  value: number,
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
): number {
  if (domainMax === domainMin) return (rangeMin + rangeMax) / 2;
  return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
}

/**
 * Generate a color with variable opacity based on normalized value (0-1).
 */
export function heatColor(
  normalizedValue: number,
  baseColor: string = CHART_COLORS.primary,
): string {
  const opacity = Math.max(0.05, Math.min(0.9, normalizedValue));
  return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
