import { useMemo, useState } from "react";

function ChartArea({ charts, initialChartId }) {
  const safeCharts = useMemo(() => charts ?? [], [charts]);

  const fallbackId = safeCharts[0]?.id ?? null;
  const [activeId, setActiveId] = useState(initialChartId ?? fallbackId);

  const activeChart = safeCharts.find((c) => c.id === activeId) ?? safeCharts[0] ?? null;

  return (
    <section className="chartArea">
      <div className="chartAreaTabs" role="tablist" aria-label="Chart variations">
        {safeCharts.map((chart) => {
          const isActive = chart.id === activeId;
          return (
            <button
              key={chart.id}
              type="button"
              className={`chartAreaTab${isActive ? " is-active" : ""}`}
              onClick={() => setActiveId(chart.id)}
              role="tab"
              aria-selected={isActive}
            >
              {chart.label}
            </button>
          );
        })}
      </div>

      <div className="chartAreaPanel" role="tabpanel">
        {activeChart?.node}
      </div>
    </section>
  );
}

export default ChartArea;

