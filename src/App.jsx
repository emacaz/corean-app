import { useState } from "react";
import StartScreen from "./components/StartScreen";
import ContextScreen from "./components/ContextScreen";
import PracticeScreen from "./components/PracticeScreen";
import ProgressScreen from "./components/ProgressScreen";

function App() {
  const [screen, setScreen] = useState("start");
  const [currentContext, setCurrentContext] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);
  const [languagePair, setLanguagePair] = useState(null);
  // languagePair = { native: "spanish", target: "korean" }

  return (
    <div style={{ maxWidth: "380px", margin: "0 auto", padding: "1rem" }}>
      <div className="App">
        {/* --- START SCREEN --- */}
        {screen === "start" && (
          <StartScreen
            onStart={(pairObject) => {
              setLanguagePair(pairObject);
              setScreen("context");
            }}
          />
        )}

        {/* --- CONTEXT SCREEN --- */}
        {screen === "context" && (
          <ContextScreen
            native={languagePair?.native}
            target={languagePair?.target}
            onBack={() => setScreen("start")}
            onSelectContext={(ctx) => {
              setCurrentContext(ctx);
              setScreen("practice");
            }}
          />
        )}

        {/* --- PRACTICE SCREEN --- */}
        {screen === "practice" && (
          <PracticeScreen
            contextKey={currentContext}
            languagePair={languagePair}
            // target={languagePair?.target}
            onExit={(destination, progress) => {
              if (destination === "progress") {
                setSavedProgress(progress || null);
                setScreen("progress");
              } else {
                setScreen("context");
              }
            }}
          />
        )}

        {/* --- PROGRESS SCREEN --- */}
        {screen === "progress" && (
          <ProgressScreen
            progress={
              savedProgress ||
              JSON.parse(localStorage.getItem("lp-progress-v1") || "null") ||
              {}
            }
            totalPhrases={(savedProgress && savedProgress.totalPhrases) || 0}
            onContinue={() => setScreen("context")}
          />
        )}
      </div>
    </div>
  );
}

export default App;
