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

export function IconBarPlot({ width, height, data }) {
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

  const yScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(sortedData.map((d) => d.country))
      .range([0, innerHeight])
      .padding(0.2);
  }, [sortedData, innerHeight]);

  // Icon layout: one book per student.
  const iconSize = 6.5;
  const iconGap = 2;
  const iconStep = iconSize + iconGap;

  if (!width || !height) return null;

  // If the full icon count can't fit, scale *all* bars proportionally.
  const maxStudents = useMemo(
    () => d3.max(sortedData, (d) => d.students) ?? 0,
    [sortedData],
  );
  const valueLabelPad = 44; // reserved space for the numeric label
  const maxIconsThatFit = Math.max(0, Math.floor((innerWidth - valueLabelPad) / iconStep));
  const iconsPerStudent = maxStudents > 0 ? Math.min(1, maxIconsThatFit / maxStudents) : 1;
  const scaledIcons = (students) => {
    if (!students || students <= 0) return 0;
    if (maxIconsThatFit <= 0) return 0;
    return Math.max(1, Math.round(students * iconsPerStudent));
  };

  return (
    <svg width={width} height={height} role="img" aria-label="Students by country bar chart">
      <style>
        {`
          .iconbar-book {
            opacity: 0;
            transform: translateX(-4px);
            animation: iconbar-in 450ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          @keyframes iconbar-in {
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
      <defs>
        {/* Simple "book" icon as a reusable symbol */}
        <symbol id="book-icon" viewBox="0 0 24 24">
          <path
            d="M6 4.5c0-.83.67-1.5 1.5-1.5H20v17h-12c-.83 0-1.5.67-1.5 1.5V4.5Z"
            fill="currentColor"
            opacity="0.92"
          />
          <path
            d="M4 4.5C4 3.67 4.67 3 5.5 3H18v17H6c-1.1 0-2 .9-2 2V4.5Z"
            fill="currentColor"
          />
          <path d="M7 7h8" stroke="#ecf3ed" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
          <path d="M7 10h7" stroke="#ecf3ed" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        </symbol>
      </defs>
      <g transform={`translate(${margin.left}, ${margin.top})`}>

        {/* icon bars + y labels + value labels */}
        {sortedData.map((d, i) => {
          const y = yScale(d.country);
          if (y === undefined) return null;
          const barHeight = yScale.bandwidth();
          const barCenterY = y + barHeight / 2;
          const isHovered = hoveredCountry === d.country;
          const labelFontSize = isHovered ? 14 : 12;
          const iconSizeToUse = isHovered ? 7 : 6.5;
          const flag = iso2ToFlag(COUNTRY_TO_ISO2[d.country]);

          const iconsCount = scaledIcons(d.students);

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

              {/* Render one icon per student */}
              {Array.from({ length: iconsCount }).map((_, j) => {
                const x = j * iconStep;
                const iconY = barCenterY - iconSize / 2;
                return (
                  <image
                    key={`${d.country}-${j}`}
                    href="student-cap-svgrepo-com.svg"
                    x={x}
                    y={iconY}
                    width={iconSizeToUse}
                    height={iconSizeToUse}
                    className="iconbar-book"
                    style={{ animationDelay: `${i * 120 + j * 22}ms` }}
                    preserveAspectRatio="xMidYMid meet"
                  />
                );
              })}

              <text
                x={Math.min(iconsCount * iconStep + 6, innerWidth + 6)}
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

export function ResponsiveIconBarPlot({ data = studentData }) {
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
      <IconBarPlot width={chartSize.width} height={chartSize.height} data={sortedData} />
    </div>
  );
}

export default ResponsiveIconBarPlot;