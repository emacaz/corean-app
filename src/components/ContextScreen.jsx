import React from "react";

const CONTEXTS = [
  { key: "church", label: "💒 Church" },
];

export default function ContextScreen({ native, target, onSelectContext, onBack }) {

  return (
    <div>
      {/* Botón de "Atrás" */}
      <button
        onClick={onBack}
        style={{ marginBottom: 10, padding: "0.5rem 1rem", borderRadius: 8, backgroundColor: "#f0f0f0", border: "1px solid #ccc", cursor: "pointer",}}
      >
        ← Back
      </button>

      <h1 style={{ textAlign: "center", margin: "0" }}>Context</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", padding: "2rem", }} >
        {CONTEXTS.map((ctx) => (
          <button
            key={ctx.key}
            onClick={() => onSelectContext(ctx.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem 1.7rem",
              borderRadius: "1rem",
              backgroundColor: "rgb(224, 247, 250)",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {ctx.label}
          </button>
        ))}
      </div>
    </div>
  );
}
