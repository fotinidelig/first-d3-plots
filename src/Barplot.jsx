import { useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import studentData from "./student_data";
import { useDimensions } from "./use-dimensions";

const COUNTRY_TO_ISO2 = {
  "United States": "US",
  France: "FR",
  "United Kingdom": "GB",
  Germany: "DE",
  Switzerland: "CH",
  Spain: "ES",
  Netherlands: "NL",
  India: "IN",
  Singapore: "SG",
  Ireland: "IE",
  Sweden: "SE",
  Australia: "AU",
  Canada: "CA",
  Finland: "FI",
  Mexico: "MX",
  Brazil: "BR",
  "Saudi Arabia": "SA",
  Romania: "RO",
  Philippines: "PH",
  "New Zealand": "NZ",
};

function iso2ToFlag(iso2) {
  if (!iso2 || typeof iso2 !== "string" || iso2.length !== 2) return "";
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function Barplot({ width, height, data }) {
  const [hoveredCountry, setHoveredCountry] = useState(null);

  const safeData = useMemo(() => data ?? [], [data]);

  // Sort once so bars render from highest to lowest (top to bottom).
  const sortedData = useMemo(() => {
    return [...safeData].sort((a, b) => (b.students ?? 0) - (a.students ?? 0));
  }, [safeData]);

  // 2) Chart dimensions and margins.
  const margin = { top: 20, right: 70, bottom: 34, left: 180 };
  const innerWidth = Math.max(0, (width ?? 0) - margin.left - margin.right);
  const innerHeight = Math.max(0, (height ?? 0) - margin.top - margin.bottom);

  const xMax = useMemo(
    () => d3.max(sortedData, (d) => d.students) ?? 0,
    [sortedData],
  );

  const xScale = useMemo(() => {
    return d3.scaleLinear().domain([0, xMax]).range([0, innerWidth]).nice();
  }, [innerWidth, xMax]);

  const yScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(sortedData.map((d) => d.country))
      .range([0, innerHeight])
      .padding(0.2);
  }, [sortedData, innerHeight]);

  if (!width || !height) return null;

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
        {sortedData.map((d, i) => {
          const y = yScale(d.country);
          if (y === undefined) return null;
          const barWidth = xScale(d.students);
          const barHeight = yScale.bandwidth();
          const barCenterY = y + barHeight / 2;
          const isHovered = hoveredCountry === d.country;
          const labelFontSize = isHovered ? 14 : 12;
          const flag = iso2ToFlag(COUNTRY_TO_ISO2[d.country]);

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
                {d.country} {flag}
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

export function ResponsiveBarplot({ data = studentData }) {
  const chartRef = useRef(null);
  const chartSize = useDimensions(chartRef);

  const rowHeight = 24;
  const margin = { top: 20, right: 70, bottom: 34, left: 180 };

  const sortedData = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => (b.students ?? 0) - (a.students ?? 0));
  }, [data]);

  const height = margin.top + margin.bottom + sortedData.length * rowHeight;

  return (
    <div ref={chartRef} style={{ width: "100%", height }}>
      <Barplot width={chartSize.width} height={chartSize.height} data={sortedData} />
    </div>
  );
}

export default ResponsiveBarplot;