import { useMemo, useState } from "react";
import * as d3 from "d3";
import studentData from "./student_data";

function polarToCartesian(r, angleRad) {
  // Rotate so 0 rad is at 12 o'clock.
  const a = angleRad - Math.PI / 2;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

function arcPath({ innerR, outerR, startAngle, endAngle }) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  const p0 = polarToCartesian(outerR, startAngle);
  const p1 = polarToCartesian(outerR, endAngle);
  const p2 = polarToCartesian(innerR, endAngle);
  const p3 = polarToCartesian(innerR, startAngle);

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function toSafeId(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function RadialBarPlot() {
  const [hoveredCountry, setHoveredCountry] = useState(null);

  const data = useMemo(() => {
    return [...studentData].sort((a, b) => b.students - a.students);
  }, []);

  const width = 650;
  const height = 650;
  const margin = 50;

  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) / 2 - margin;
  const innerRadius = Math.round(outerRadius * 0.35);

  const maxValue = useMemo(() => d3.max(data, (d) => d.students) ?? 0, [data]);

  // D3 scales for math only.
  const angleScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(data.map((d) => d.country))
      .range([0, Math.PI * 2])
      .padding(0.08);
  }, [data]);

  const radiusScale = useMemo(() => {
    return d3.scaleLinear().domain([0, maxValue]).range([innerRadius, outerRadius]).nice();
  }, [innerRadius, outerRadius, maxValue]);

  const active = hoveredCountry
    ? data.find((d) => d.country === hoveredCountry) ?? null
    : null;

  const totalStudents = useMemo(() => d3.sum(data, (d) => d.students), [data]);

  return (
    <svg width={width} height={height} role="img" aria-label="Students by country radial bar chart">
      <defs>
        {data.map((d) => {
          const startAngle = angleScale(d.country);
          if (startAngle === undefined) return null;
          const midAngle = startAngle + angleScale.bandwidth() / 2;

          const pInner = polarToCartesian(innerRadius, midAngle);
          // Make the gradient extend to the global max radius so
          // shorter bars don't reach the darkest color.
          const pOuter = polarToCartesian(outerRadius, midAngle);

          const id = `radial-grad-${toSafeId(d.country)}`;
          return (
            <linearGradient
              key={id}
              id={id}
              x1={pInner.x}
              y1={pInner.y}
              x2={pOuter.x}
              y2={pOuter.y}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#b1cdb6" />
              <stop offset="100%" stopColor="#35543b" />
            </linearGradient>
          );
        })}
      </defs>

      <g transform={`translate(${cx}, ${cy})`}>
        {/* Bars */}
        {data.map((d) => {
          const startAngle = angleScale(d.country);
          if (startAngle === undefined) return null;

          const endAngle = startAngle + angleScale.bandwidth();
          const outerR = radiusScale(d.students);
          const isHovered = hoveredCountry === d.country;
          const gradId = `radial-grad-${toSafeId(d.country)}`;

          const dPath = arcPath({
            innerR: innerRadius,
            outerR,
            startAngle,
            endAngle,
          });

          return (
            <path
              key={d.country}
              d={dPath}
              fill={isHovered ? "#35543b" : `url(#${gradId})`}
              onMouseEnter={() => setHoveredCountry(d.country)}
              onMouseLeave={() => setHoveredCountry(null)}
              style={{ cursor: "pointer" }}
            />
          );
        })}

        {/* Hole (covers inner edges, provides clean donut) */}
        <circle r={innerRadius - 1} fill="#c9dcce" />

        {/* Center value */}
        <text style={{ textAnchor: "middle", fill: "#111827" }}>
          <tspan x={0} y={-6} fontSize={13} fontWeight={700}>
            {active ? active.country : "Total"}
          </tspan>
          <tspan x={0} y={25} fontSize={34} fontWeight={900}>
            {active ? active.students : totalStudents}
          </tspan>
          <tspan x={0} y={44} fontSize={13} fontWeight={700}>
            students
          </tspan>
        </text>

        {/* Labels */}
        {data.map((d) => {
          const startAngle = angleScale(d.country);
          if (startAngle === undefined) return null;
          const midAngle = startAngle + angleScale.bandwidth() / 2;

          const barOuterR = radiusScale(d.students);
          const labelR = barOuterR + 10;
          const { x, y } = polarToCartesian(labelR, midAngle);

          // Align text with the radial line through the bar center.
          // (SVG rotation 0° points right, our polar 0 rad points up)
          const radialDeg = (midAngle * 180) / Math.PI - 90;
          // Flip labels only when they'd be upside down after our -90° orientation.
          const norm = ((radialDeg % 360) + 360) % 360; // [0, 360)
          const shouldFlip = norm > 90 && norm < 270;
          const rot = shouldFlip ? radialDeg + 180 : radialDeg;

          return (
            <text
              key={`${d.country}-label`}
              fontSize={11}
              fill="#111827"
              textAnchor={shouldFlip ? "end" : "start"}
              dominantBaseline="middle"
              transform={`translate(${x}, ${y}) rotate(${rot})`}
            >
              {d.country === "United States" ? "USA" : d.country}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

export default RadialBarPlot;

