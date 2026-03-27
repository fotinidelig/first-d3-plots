import { useMemo, useState } from "react";
import * as d3 from "d3";
import studentData from "./student_data";

function Barplot() {
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // 1) Sort once so bars render from highest to lowest (top to bottom).
  const data = useMemo(() => {
    return [...studentData].sort((a, b) => b.students - a.students);
  }, []);

  // 2) Chart dimensions and margins.
  const width = 650;
  const rowHeight = 24;
  const margin = { top: 20, right: 70, bottom: 34, left: 180 };
  const height = margin.top + margin.bottom + data.length * rowHeight;

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xMax = useMemo(() => d3.max(data, (d) => d.students) ?? 0, [data]);

  const xScale = useMemo(() => {
    return d3.scaleLinear().domain([0, xMax]).range([0, innerWidth]).nice();
  }, [innerWidth, xMax]);

  const yScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(data.map((d) => d.country))
      .range([0, innerHeight])
      .padding(0.2);
  }, [data, innerHeight]);

  return (
    <svg width={width} height={height} role="img" aria-label="Students by country bar chart">
      <style>
        {`
          .barplot-bar {
            transform-origin: 0 50%;
            transform-box: fill-box;
            transform: scaleX(0);
            animation: barplot-grow 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          @keyframes barplot-grow {
            to {
              transform: scaleX(1);
            }
          }
        `}
      </style>
      <defs>
        <linearGradient id="bar-gradient" x1="0" y1="0" x2={innerWidth} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b1cdb6" />
          <stop offset="100%" stopColor="#35543b" />
        </linearGradient>
      </defs>
      <g transform={`translate(${margin.left}, ${margin.top})`}>

        {/* bars + y labels + value labels */}
        {data.map((d, i) => {
          const y = yScale(d.country);
          if (y === undefined) return null;
          const barWidth = xScale(d.students);
          const barHeight = yScale.bandwidth();
          const barCenterY = y + barHeight / 2;
          const isHovered = hoveredCountry === d.country;
          const labelFontSize = isHovered ? 14 : 12;

          return (
            <g
              key={d.country}
              onMouseEnter={() => setHoveredCountry(d.country)}
              onMouseLeave={() => setHoveredCountry(null)}
              style={{ cursor: "pointer" }}
            >
              <text
                x={-10}
                y={barCenterY}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#111827"
                fontSize={labelFontSize}
              >
                {d.country}
              </text>

              <rect
                x={0}
                y={y}
                width={barWidth}
                height={barHeight}
                className="barplot-bar"
                style={{ animationDelay: `${i * 30}ms` }}
                fill={isHovered ? "#35543b" : "url(#bar-gradient)"}
                rx={3}
              />

              <text
                x={barWidth + 8}
                y={barCenterY}
                textAnchor="start"
                dominantBaseline="middle"
                fill="#111827"
                fontSize={labelFontSize}
                fontWeight={700}
              >
                {d.students}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default Barplot;