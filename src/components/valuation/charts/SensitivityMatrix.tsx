// src/components/valuation/charts/SensitivityMatrix.tsx
"use client";

import type { FC } from "react";
import {
  CHART_FONT,
  AXIS_FONT_SIZE,
  LABEL_FONT_SIZE,
  TITLE_FONT_SIZE,
  TEXT_COLOR,
  MUTED_COLOR,
  CHART_COLORS,
  formatCurrency,
  formatPercent,
} from "@/lib/valuation/charts/chartUtils";

export type SensitivityMatrixProps = {
  rowLabels: number[]; // e.g. IRR values [0.15, 0.25, ...]
  colLabels: number[]; // e.g. Multiple values [8, 12, ...]
  grid: number[][];    // [row][col] = computed value
  rowHeader?: string;
  colHeader?: string;
  title?: string;
  width?: number;
  formatRow?: (v: number) => string;
  formatCol?: (v: number) => string;
  formatCell?: (v: number) => string;
};

const SensitivityMatrix: FC<SensitivityMatrixProps> = ({
  rowLabels,
  colLabels,
  grid,
  rowHeader = "IRR",
  colHeader = "Multiple",
  title,
  width = 560,
  formatRow = formatPercent,
  formatCol = (v) => `${v}x`,
  formatCell = (v) => formatCurrency(v),
}) => {
  const rows = rowLabels.length;
  const cols = colLabels.length;

  if (rows === 0 || cols === 0) return null;

  const cellW = 80;
  const cellH = 32;
  const headerW = 70;
  const headerH = 32;
  const topPad = title ? 30 : 10;

  const totalW = Math.max(width, headerW + cols * cellW + 10);
  const totalH = topPad + headerH + rows * cellH + 10;

  // Find min/max for color scaling
  const allValues = grid.flat();
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const cellColor = (value: number): string => {
    if (value < 0) return "#FEE2E2"; // red tint for negative
    const normalized = (value - minVal) / range;
    const alpha = Math.max(0.05, Math.min(0.35, normalized * 0.35));
    return `rgba(76, 106, 210, ${alpha})`;
  };

  const textColorForCell = (value: number): string => {
    return value < 0 ? "#DC2626" : TEXT_COLOR;
  };

  return (
    <svg
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      style={{ fontFamily: CHART_FONT }}
    >
      {/* Title */}
      {title && (
        <text
          x={totalW / 2}
          y={18}
          textAnchor="middle"
          fontSize={TITLE_FONT_SIZE}
          fontWeight={600}
          fill={TEXT_COLOR}
        >
          {title}
        </text>
      )}

      {/* Column header row */}
      <text
        x={headerW / 2}
        y={topPad + headerH / 2 + 4}
        textAnchor="middle"
        fontSize={LABEL_FONT_SIZE}
        fontWeight={700}
        fill={CHART_COLORS.primary}
      >
        {rowHeader} \ {colHeader}
      </text>

      {colLabels.map((col, cIdx) => (
        <g key={cIdx}>
          <rect
            x={headerW + cIdx * cellW}
            y={topPad}
            width={cellW}
            height={headerH}
            fill="#F3F4FB"
            stroke="#E5E7EB"
            strokeWidth={0.5}
          />
          <text
            x={headerW + cIdx * cellW + cellW / 2}
            y={topPad + headerH / 2 + 4}
            textAnchor="middle"
            fontSize={AXIS_FONT_SIZE}
            fontWeight={600}
            fill={CHART_COLORS.primary}
          >
            {formatCol(col)}
          </text>
        </g>
      ))}

      {/* Rows */}
      {rowLabels.map((row, rIdx) => (
        <g key={rIdx}>
          {/* Row header */}
          <rect
            x={0}
            y={topPad + headerH + rIdx * cellH}
            width={headerW}
            height={cellH}
            fill="#F9FAFB"
            stroke="#E5E7EB"
            strokeWidth={0.5}
          />
          <text
            x={headerW / 2}
            y={topPad + headerH + rIdx * cellH + cellH / 2 + 4}
            textAnchor="middle"
            fontSize={AXIS_FONT_SIZE}
            fontWeight={600}
            fill={MUTED_COLOR}
          >
            {formatRow(row)}
          </text>

          {/* Data cells */}
          {grid[rIdx]!.map((val, cIdx) => (
            <g key={cIdx}>
              <rect
                x={headerW + cIdx * cellW}
                y={topPad + headerH + rIdx * cellH}
                width={cellW}
                height={cellH}
                fill={cellColor(val)}
                stroke="#E5E7EB"
                strokeWidth={0.5}
              />
              <text
                x={headerW + cIdx * cellW + cellW / 2}
                y={topPad + headerH + rIdx * cellH + cellH / 2 + 4}
                textAnchor="middle"
                fontSize={LABEL_FONT_SIZE}
                fontWeight={500}
                fill={textColorForCell(val)}
              >
                {formatCell(val)}
              </text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
};

export default SensitivityMatrix;
