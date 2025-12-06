/**
 * ProgressScreen.jsx
 *
 * Final summary screen shown after the user completes all phrases in a context.
 *
 * Responsibilities:
 * - Display practice results:
 *   - Number of phrases attempted
 *   - Total speaking time (timeSpoken)
 *   - Conversation Time Created (CTC) as an additional learning metric
 * - Optionally show per-phrase CTC breakdown for deeper insights
 * - Provide a button to return to the ContextScreen ("Continue tomorrow")
 * - Read progress data passed from PracticeScreen (localStorage fallback included)
 *
 * Navigation:
 * - Triggered from PracticeScreen when all phrases are completed
 * - Returns control back to ContextScreen via the "onContinue" callback
 *
 * Notes:
 * - This screen does not allow practice; it's purely reflective.
 * - Progress persistence is handled in PracticeScreen, so this component is read-only.
 */

import React from 'react';

export default function ProgressScreen({ progress = {}, totalPhrases = 0, onContinue }) {
  const practiced = (progress.phrasesSeen || []).length;
  const timeSpoken = progress.timeSpoken || 0; // segundos
  const ctc = progress.conversationTimeCreated || 0; // segundos

  const fmtTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.round(s % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: 8 }}></h2>

			<img src="/images/ok-icon.png" alt="ok" width={120} opacity="0.7" />

      <p style={{ color: '#4b5563', marginBottom: 20, textAlign: "left" }}>Today you spoke:</p>

			<p style={{ marginBottom: 0, fontSize: 26, fontWeight: 700, textAlign: "left" }}>5 minutes spoken:</p>

			<p style={{ color: '#4b5563', marginBottom: 20, marginTop: 0, fontSize: 20, fontWeight: 500, textAlign: "left" }}>in Korean</p>

      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 14, borderRadius: 12, background: '#F8FAFC', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Phrases practiced</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{practiced} / {totalPhrases}</div>
        </div>

        <div style={{ padding: 14, borderRadius: 12, background: '#F8FAFC' }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Total time spoken</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{fmtTime(timeSpoken)}</div>
        </div>

        <div style={{ padding: 14, borderRadius: 12, background: '#F8FAFC' }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Conversation time created (CTC)</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{fmtTime(ctc)}</div>
        </div>
      </div>

      <p style={{ color: '#6b7280', marginBottom: 18 }}>Keep it light — come back tomorrow to keep improving.</p>

      <button
        onClick={onContinue}
        style={{
          padding: '12px 18px',
          borderRadius: 12,
          background: '#A7C7E7',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Continue tomorrow
      </button>
    </div>
  );
}
