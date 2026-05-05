import { useEffect, useMemo, useRef, useState } from "react";
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

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function toSafeId(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function RadialBarPlot({ width, height, data }) {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [animT, setAnimT] = useState(0);

  const safeData = useMemo(() => data ?? [], [data]);

  const sortedData = useMemo(() => {
    return [...safeData].sort((a, b) => (b.students ?? 0) - (a.students ?? 0));
  }, [safeData]);

  const w = width ?? 0;
  const h = height ?? 0;

  const margin = 50;

  const cx = w / 2;
  const cy = h / 2;
  const outerRadius = Math.min(w, h) / 2 - margin;
  const innerRadius = Math.round(Math.max(0, outerRadius) * 0.35);

  const maxValue = useMemo(
    () => d3.max(sortedData, (d) => d.students) ?? 0,
    [sortedData],
  );

  const angleScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(sortedData.map((d) => d.country))
      .range([0, Math.PI * 2])
      .padding(0.08);
  }, [sortedData]);

  const radiusScale = useMemo(() => {
    const safeOuter = Math.max(innerRadius, outerRadius);
    return d3.scaleLinear().domain([0, maxValue]).range([innerRadius, safeOuter]).nice();
  }, [innerRadius, outerRadius, maxValue]);

  const arcGen = useMemo(() => {
    return d3
      .arc()
      .innerRadius((a) => a.innerRadius)
      .outerRadius((a) => a.outerRadius)
      .startAngle((a) => a.startAngle)
      .endAngle((a) => a.endAngle);
  }, []);

  const active = hoveredCountry
    ? sortedData.find((d) => d.country === hoveredCountry) ?? null
    : null;

  const totalStudents = useMemo(
    () => d3.sum(sortedData, (d) => d.students),
    [sortedData],
  );

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setAnimT(1);
      return;
    }

    let raf = 0;
    const durationMs = 1100;
    const start = performance.now();

    const tick = (now) => {
      const t = clamp01((now - start) / durationMs);
      setAnimT(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keep hook order stable: bail out only after hooks run.
  if (w <= 0 || h <= 0 || outerRadius <= 0) return null;

  return (
    <svg width={width} height={height} role="img" aria-label="Students by country radial bar chart">
      <defs>
        {sortedData.map((d) => {
          const startAngle = angleScale(d.country);
          if (startAngle === undefined) return null;
          const midAngle = startAngle + angleScale.bandwidth() / 2;

          const [ix, iy] = d3.pointRadial(midAngle, innerRadius);
          // Make the gradient extend to the global max radius so
          // shorter bars don't reach the darkest color.
          const [ox, oy] = d3.pointRadial(midAngle, outerRadius);

          const id = `radial-grad-${toSafeId(d.country)}`;
          return (
            <linearGradient
              key={id}
              id={id}
              x1={ix}
              y1={iy}
              x2={ox}
              y2={oy}
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
        {sortedData.map((d, i) => {
          const startAngle = angleScale(d.country);
          if (startAngle === undefined) return null;

          const endAngle = startAngle + angleScale.bandwidth();
          const outerR = radiusScale(d.students);
          const isHovered = hoveredCountry === d.country;
          const gradId = `radial-grad-${toSafeId(d.country)}`;

          const n = sortedData.length || 1;
          const sweep = animT * (n + 1); // +1 gives a tiny tail so last bar finishes cleanly
          const local = clamp01(sweep - i);
          const grown = easeOutCubic(local);
          const outerRAnimated = innerRadius + (outerR - innerRadius) * grown;

          const dPath =
            arcGen({
              innerRadius,
              outerRadius: outerRAnimated,
              startAngle,
              endAngle,
            }) ?? undefined;

          return (
            <path
              key={d.country}
              d={dPath}
              fill={isHovered ? "#35543b" : `url(#${gradId})`}
              opacity={local === 0 ? 0 : 1}
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
            {active
              ? `${active.country} ${iso2ToFlag(COUNTRY_TO_ISO2[active.country])}`.trim()
              : "Total"}
          </tspan>
          <tspan x={0} y={25} fontSize={34} fontWeight={900}>
            {active ? active.students : totalStudents}
          </tspan>
          <tspan x={0} y={44} fontSize={13} fontWeight={700}>
            students
          </tspan>
        </text>

        {/* Labels */}
        {sortedData.map((d) => {
          const startAngle = angleScale(d.country);
          if (startAngle === undefined) return null;
          const midAngle = startAngle + angleScale.bandwidth() / 2;

          const barOuterR = radiusScale(d.students);
          const labelR = barOuterR + 10;
          const [x, y] = d3.pointRadial(midAngle, labelR);

          const radialDeg = (midAngle * 180) / Math.PI - 90;
          const norm = ((radialDeg % 360) + 360) % 360; // [0, 360)
          const shouldFlip = norm > 90 && norm < 270;
          const rot = shouldFlip ? radialDeg + 180 : radialDeg;
          const countryLabel = d.country === "United States" ? "USA" : d.country;
          const flag = iso2ToFlag(COUNTRY_TO_ISO2[d.country]);
          const labelText = shouldFlip ? `${countryLabel} ${flag}`.trim() : `${flag} ${countryLabel}`.trim();

          return (
            <text
              key={`${d.country}-label`}
              fontSize={11}
              fill="#111827"
              textAnchor={shouldFlip ? "end" : "start"}
              dominantBaseline="middle"
              transform={`translate(${x}, ${y}) rotate(${rot})`}
            >
              {labelText}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

export function ResponsiveRadialBarPlot({ data = studentData, maxSize = 650 }) {
  const chartRef = useRef(null);
  const chartSize = useDimensions(chartRef);

  const safeMaxSize = Number.isFinite(maxSize) ? maxSize : 650;
  const size = Math.max(0, Math.min(chartSize.width, safeMaxSize));

  const sortedData = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => (b.students ?? 0) - (a.students ?? 0));
  }, [data]);

  return (
    <div
      ref={chartRef}
      style={{
        width: "100%",
        maxWidth: safeMaxSize,
        margin: "0 auto",
        aspectRatio: "1 / 1",
      }}
    >
      <RadialBarPlot width={size} height={size} data={sortedData} />
    </div>
  );
}

export default ResponsiveRadialBarPlot;

