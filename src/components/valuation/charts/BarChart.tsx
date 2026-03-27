// src/components/valuation/charts/BarChart.tsx
"use client";

import type { FC } from "react";
import {
  SERIES_PALETTE,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  PADDING,
  CHART_FONT,
  AXIS_FONT_SIZE,
  LABEL_FONT_SIZE,
  TITLE_FONT_SIZE,
  AXIS_COLOR,
  GRID_COLOR,
  TEXT_COLOR,
  MUTED_COLOR,
  formatCurrency,
  computeNiceScale,
  lerp,
} from "@/lib/valuation/charts/chartUtils";

export type BarChartDatum = {
  label: string;
  value: number;
  color?: string;
};

export type BarChartProps = {
  data: BarChartDatum[];
  width?: number;
  height?: number;
  title?: string;
  formatValue?: (v: number) => string;
};

const BarChart: FC<BarChartProps> = ({
  data,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  title,
  formatValue = (v) => formatCurrency(v),
}) => {
  if (data.length === 0) return null;

  const pad = PADDING;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const values = data.map((d) => d.value);
  const dataMin = Math.min(0, ...values);
  const dataMax = Math.max(0, ...values);
  const { min: yMin, max: yMax, ticks } = computeNiceScale(dataMin, dataMax, 5);

  const barCount = data.length;
  const barGap = Math.max(8, plotW * 0.05);
  const barWidth = Math.max(20, (plotW - barGap * (barCount + 1)) / barCount);

  const yOf = (v: number) => lerp(v, yMin, yMax, pad.top + plotH, pad.top);
  const zeroY = yOf(0);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ fontFamily: CHART_FONT }}
    >
      {/* Title */}
      {title && (
        <text
          x={width / 2}
          y={16}
          textAnchor="middle"
          fontSize={TITLE_FONT_SIZE}
          fontWeight={600}
          fill={TEXT_COLOR}
        >
          {title}
        </text>
      )}

      {/* Horizontal grid lines + Y axis labels */}
      {ticks.map((tick) => {
        const y = yOf(tick);
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              y1={y}
              x2={width - pad.right}
              y2={y}
              stroke={GRID_COLOR}
              strokeDasharray={tick === 0 ? undefined : "4 3"}
              strokeWidth={tick === 0 ? 1 : 0.5}
            />
            <text
              x={pad.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={AXIS_FONT_SIZE}
              fill={MUTED_COLOR}
            >
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = pad.left + barGap + i * (barWidth + barGap);
        const barY = d.value >= 0 ? yOf(d.value) : zeroY;
        const barH = Math.abs(yOf(d.value) - zeroY);
        const color = d.color ?? SERIES_PALETTE[i % SERIES_PALETTE.length]!;

        return (
          <g key={i}>
            <rect
              x={x}
              y={barY}
              width={barWidth}
              height={Math.max(1, barH)}
              rx={3}
              fill={color}
              opacity={0.85}
            />
            {/* Value label on top */}
            <text
              x={x + barWidth / 2}
              y={barY - 6}
              textAnchor="middle"
              fontSize={LABEL_FONT_SIZE}
              fontWeight={600}
              fill={TEXT_COLOR}
            >
              {formatValue(d.value)}
            </text>
            {/* X axis label */}
            <text
              x={x + barWidth / 2}
              y={height - pad.bottom + 16}
              textAnchor="middle"
              fontSize={AXIS_FONT_SIZE}
              fill={MUTED_COLOR}
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Y axis line */}
      <line
        x1={pad.left}
        y1={pad.top}
        x2={pad.left}
        y2={pad.top + plotH}
        stroke={AXIS_COLOR}
        strokeWidth={1}
      />
    </svg>
  );
};

export default BarChart;
