// src/components/valuation/charts/LineChart.tsx
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

export type LineChartSeries = {
  label: string;
  values: number[];
  color?: string;
  dashed?: boolean;
};

export type LineChartProps = {
  series: LineChartSeries[];
  xLabels: string[];
  width?: number;
  height?: number;
  title?: string;
  formatValue?: (v: number) => string;
};

const LineChart: FC<LineChartProps> = ({
  series,
  xLabels,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  title,
  formatValue = (v) => formatCurrency(v),
}) => {
  if (series.length === 0 || xLabels.length === 0) return null;

  const pad = PADDING;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allValues = series.flatMap((s) => s.values);
  const dataMin = Math.min(0, ...allValues);
  const dataMax = Math.max(0, ...allValues);
  const { min: yMin, max: yMax, ticks } = computeNiceScale(dataMin, dataMax, 5);

  const pointCount = xLabels.length;
  const xStep = pointCount > 1 ? plotW / (pointCount - 1) : plotW;

  const xOf = (i: number) => pad.left + i * xStep;
  const yOf = (v: number) => lerp(v, yMin, yMax, pad.top + plotH, pad.top);

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

      {/* Horizontal grid + Y labels */}
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

      {/* X axis labels */}
      {xLabels.map((label, i) => (
        <text
          key={i}
          x={xOf(i)}
          y={height - pad.bottom + 18}
          textAnchor="middle"
          fontSize={AXIS_FONT_SIZE}
          fill={MUTED_COLOR}
        >
          {label}
        </text>
      ))}

      {/* Series */}
      {series.map((s, sIdx) => {
        const color = s.color ?? SERIES_PALETTE[sIdx % SERIES_PALETTE.length]!;
        const points = s.values.map((v, i) => `${xOf(i)},${yOf(v)}`);
        const pathD = points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p}`)
          .join(" ");

        return (
          <g key={sIdx}>
            {/* Area fill */}
            <path
              d={`${pathD} L ${xOf(s.values.length - 1)},${yOf(0)} L ${xOf(0)},${yOf(0)} Z`}
              fill={color}
              opacity={0.08}
            />
            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "6 4" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Points + value labels */}
            {s.values.map((v, i) => (
              <g key={i}>
                <circle cx={xOf(i)} cy={yOf(v)} r={3.5} fill={color} />
                <text
                  x={xOf(i)}
                  y={yOf(v) - 10}
                  textAnchor="middle"
                  fontSize={LABEL_FONT_SIZE}
                  fontWeight={600}
                  fill={TEXT_COLOR}
                >
                  {formatValue(v)}
                </text>
              </g>
            ))}
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

      {/* Legend */}
      {series.length > 1 && (
        <g>
          {series.map((s, sIdx) => {
            const color = s.color ?? SERIES_PALETTE[sIdx % SERIES_PALETTE.length]!;
            const lx = pad.left + sIdx * 120;
            const ly = height - 6;
            return (
              <g key={sIdx}>
                <line
                  x1={lx}
                  y1={ly - 4}
                  x2={lx + 16}
                  y2={ly - 4}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? "4 3" : undefined}
                />
                <text
                  x={lx + 20}
                  y={ly}
                  fontSize={LABEL_FONT_SIZE}
                  fill={MUTED_COLOR}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

export default LineChart;
