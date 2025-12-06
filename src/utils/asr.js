/**
 * Automatic Speech Recognition (ASR) utility.
 * Wraps the Web SpeechRecognition API (or webkitSpeechRecognition in Chrome).
 * 
 * Responsibilities:
 * - Initialize a recognizer configured for Korean language.
 * - Handle interim (live) and final recognition results.
 * - Provide a clean interface for components to start/stop listening.
 * - Keep browser-specific quirks isolated from UI components.
 */

export function createRecognizer({ lang = 'ko-KR', interimResults = true } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = interimResults;
  rec.continuous = true; // sesiones largas
  return rec;
}
