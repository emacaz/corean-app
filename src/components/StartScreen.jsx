import React, { useState } from "react";

const LANGUAGES = [
  { code: "spanish", label: "Español 🇪🇸" },
  { code: "english", label: "English 🇺🇸" },
  { code: "french", label: "Français 🇫🇷" },
  { code: "german", label: "Deutsch 🇩🇪" },
  { code: "korean", label: "한국어 🇰🇷" },
  { code: "chinese", label: "中文 🇨🇳" },
  { code: "dutch", label: "Nederlands 🇳🇱" },
];

export default function StartScreen({ onStart }) {

  const [native, setNative] = useState("");
  const [target, setTarget] = useState("");
  // Recibe una función onStart como prop para pasar a la siguiente pantalla
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#F0FAFF",
      }}
    >
      <h1
        style={{ fontSize: "2rem", margin: "2rem", textAlign: "center", lineHeight: "1.4" }}
      >
        Train your voice 🎙️
      </h1>

      {/* Native language */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={{ marginBottom: 8 }}>I speak 🗣️:</label>

        <select
          value={native}
          onChange={(e) => setNative(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            fontSize: 16
          }}
        >
          <option value="">Select language</option>
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

      </div>

      {/* Target language */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
        <label style={{ marginBottom: 8 }}>Train 🏋:</label>

        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            fontSize: 16,
          }}
        >
          <option value="">Select language</option>
          {LANGUAGES.filter((l) => l.code !== native).map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* continue button */}
      <button
        disabled={!native || !target}
        onClick={() => onStart({ native, target })}
        style={{
          padding: "1rem 2rem",
          borderRadius: 10,
          backgroundColor: !native || !target ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          cursor: !native || !target ? "not-allowed" : "pointer",
          fontSize: 16,
          marginTop: 20,
          width: "163px",
        }}
      >
        Continue
      </button>
    </div>
  );
}
