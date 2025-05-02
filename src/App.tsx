import CustomCursor from "./components/CustomCursor";
import Hero from "./components/Hero";
import Layout from "./components/Layout";
import ParticleBackground from "./components/ParticleBackground";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <CustomCursor />
      <ParticleBackground />
      <Layout>
        <Hero />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
