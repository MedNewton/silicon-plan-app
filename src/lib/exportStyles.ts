// src/lib/exportStyles.ts
// Shared export layout + typography constants used across PDF/DOCX/PPTX generation.

export const A4_MARGIN_CM = 2.5;
export const A4_MARGIN_MM = 25;
export const A4_MARGIN_TWIP = 1417; // 2.5cm ~= 1417 twips

export const DEFAULT_EXPORT_FONT_FAMILY = "Roboto";

export const EXPORT_TYPOGRAPHY = {
  title: 34,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 14,
  bodySmall: 12,
  caption: 10,
} as const;

export const DOCX_TYPOGRAPHY = {
  title: 56, // half-points
  h1: 40,
  h2: 34,
  h3: 30,
  body: 24,
  bodySmall: 22,
} as const;

export const PPTX_TYPOGRAPHY = {
  title: 32,
  heading: 22,
  subheading: 18,
  body: 14,
  bodySmall: 11,
  caption: 10,
} as const;

const PX_PER_INCH = 96;
const MM_PER_INCH = 25.4;

export const mmToPx = (mm: number): number => (mm * PX_PER_INCH) / MM_PER_INCH;

export const sanitizeFileName = (name: string, fallback = "export"): string => {
  return (
    name
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^[._]+/, "")
      .trim()
      .slice(0, 200) || fallback
  );
};
