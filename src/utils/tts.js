/**
 * Text-to-Speech utility.
 * Provides a simple wrapper around the Web Speech Synthesis API.
 * 
 * Responsibilities:
 * - Find and use a Korean voice if available in the browser.
 * - Speak any given text with configurable options (rate, pitch, volume).
 * - Encapsulate TTS logic so components only call a single `speak()` function.
 */

export function speak(text, opts = {}) {
  const synth = window.speechSynthesis;
  if (!synth) return console.warn('Speech Synthesis not supported.');
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = opts.lang || 'ko-KR';
  utter.rate = opts.rate ?? 1;
  utter.pitch = opts.pitch ?? 1;

  // intenta seleccionar voz coreana si existe
  const pickVoice = () => {
    const voices = synth.getVoices();
    const ko = voices.find(v => v.lang?.toLowerCase().startsWith('ko'));
    if (ko) utter.voice = ko;
    synth.speak(utter);
  };

  if (!synth.getVoices().length) {
    synth.onvoiceschanged = () => pickVoice();
  } else {
    pickVoice();
  }
}
