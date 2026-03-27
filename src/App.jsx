import './App.css'
import Barplot from "./Barplot";

function App() {

  return (
    <>
    <section id="center">
      <div className="hero">
        <h1>D3 <span className="hero-heart">❤️</span> React students around the world</h1>
        <h2><span style={{ fontWeight: "bold" }}>232</span> students from <span style={{ fontWeight: "bold" }}>20</span> countries</h2>
      </div>
      <div className="container">
        <div className="barplot">
          <Barplot />
        </div>
      </div>
    </section>
    </>
  )
}

export default App
