import { useMemo, useState } from "react";
import * as d3 from "d3";
import studentData from "./student_data";

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

function IconBarPlot() {
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // 1) Sort once so bars render from highest to lowest (top to bottom).
  const data = useMemo(() => {
    return [...studentData].sort((a, b) => b.students - a.students);
  }, []);

  // 2) Chart dimensions and margins.
  const width = 800;
  const rowHeight = 24;
  const margin = { top: 20, right: 70, bottom: 34, left: 180 };
  const height = margin.top + margin.bottom + data.length * rowHeight;

  const innerHeight = height - margin.top - margin.bottom;

  const yScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(data.map((d) => d.country))
      .range([0, innerHeight])
      .padding(0.2);
  }, [data, innerHeight]);

  // Icon layout: one book per student.
  const iconSize = 6.5;
  const iconGap = 2;
  const iconStep = iconSize + iconGap;

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
        {data.map((d, i) => {
          const y = yScale(d.country);
          if (y === undefined) return null;
          const barHeight = yScale.bandwidth();
          const barCenterY = y + barHeight / 2;
          const isHovered = hoveredCountry === d.country;
          const labelFontSize = isHovered ? 14 : 12;
          const iconSizeToUse = isHovered ? 7 : 6.5;
          const flag = iso2ToFlag(COUNTRY_TO_ISO2[d.country]);

          const iconsCount = d.students;

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
                x={iconsCount * iconStep + 6}
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

export default IconBarPlot;