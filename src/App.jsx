import './App.css'
import Barplot from "./Barplot";
import ChartArea from "./ChartArea";
import IconBarPlot from "./IconBarPlot";
import RadialBarPlot from "./RadialBarPlot";

function App() {

  return (
    <>
    <section id="center">
      <div className="hero">
        <h1>D3 <span className="hero-heart">❤️</span> React students around the world</h1>
        <h2><span className="hero-stat">232</span> students from <span className="hero-stat">20</span> countries!</h2>
      </div>
      <ChartArea
        charts={[
          { id: "bars", label: "BarPlot", node: <Barplot /> },
          {
            id: "alt",
            label: "IconBarPlot",
            node: <IconBarPlot />,
          },
          {
            id: "radial",
            label: "RadialBarPlot",
            node: <RadialBarPlot />,
          },
        ]}
        initialChartId="bars"
      />
    </section>
    </>
  )
}

export default App
