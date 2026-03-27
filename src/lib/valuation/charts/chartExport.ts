// src/lib/valuation/charts/chartExport.ts
// Utilities for converting SVG chart strings to embeddable formats.

/**
 * Convert an SVG string to a data URL for embedding in HTML (img src) or
 * business_plan_sections with type "image".
 */
export function svgToDataUrl(svgString: string): string {
  const encoded = Buffer.from(svgString, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Render a chart component to an SVG string (server-side).
 * This is a helper that wraps React's renderToStaticMarkup.
 * Import lazily so it works in both server and client contexts.
 */
export async function renderChartToSvg(
  element: React.ReactElement,
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(element);
}

/**
 * Render a chart component to a base64 data URL (server-side).
 */
export async function renderChartToDataUrl(
  element: React.ReactElement,
): Promise<string> {
  const svg = await renderChartToSvg(element);
  return svgToDataUrl(svg);
}
