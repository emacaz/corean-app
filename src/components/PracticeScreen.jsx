/**
 * Main practice screen where the user trains Korean spoken production.
 *
 * Responsibilities:
 * - Load phrases for the selected context from phrases.json.
 * - Display a Korean phrase with optional English translation.
 * - Play phrase audio via TTS (tts.js).
 * - Record and transcribe user speech via ASR (asr.js).
 * - Compare recognized speech with the target phrase and give affective feedback.
 * - Track practice progress (phrases attempted, speaking time) in localStorage.
 * - Provide navigation (next/previous phrase, exit to summary).
 */

import { use, useEffect, useRef, useState } from "react";
import { speak } from "../utils/tts";
import { createRecognizer } from "../utils/asr";
import ProgressBar from "./ProgressBar";

const LS_KEY = "lp-progress-v1";
const SIM_THRESHOLD = 0.75;

function norm(s) {
  return (s || "")
    .trim()
    .replace(/[.,!?;:·…“”"'\-()/]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Levenshtein simple → similitud [0..1]
function similarity(a, b) {
  a = norm(a);
  b = norm(b);
  const m = a.length,
    n = b.length;
  if (m === 0 && n === 0) return 1;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const dist = dp[m][n];
  return 1 - dist / Math.max(m, n);
}

function computeCTC(phraseText, timeSpokenSeconds, similarityScore) {
  // umbral mínimo: ignore attempts muy cortos o muy malos
  if (!phraseText) return 0;
  if (timeSpokenSeconds < 0.5) return 0; // evita clicks accidentales
  if (similarityScore < 0.5) return 0; //considera intento no válido si < 50%

  const numWords = phraseText.trim().split(/\s+/).filter(Boolean).length || 1;
  const lengthFactor = 1 + numWords / 10; // simple: +0.1 por palabra
  const ctc = lengthFactor * timeSpokenSeconds * similarityScore;
  return ctc;
}

function loadProgress() {
  // old...
  // try { return JSON.parse(localStorage.getItem(LS_KEY)) || { phrasesSeen: [], timeSpoken: 0 }; }
  // catch { return { phrasesSeen: [], timeSpoken: 0 }; }

  // new...
  try {
    return (
      JSON.parse(localStorage.getItem(LS_KEY)) || {
        phrasesSeen: [],
        timeSpoken: 0,
        conversationTimeCreated: 0, // nuevo: acumulado CTC
        ctcPerPhrase: {}, // nuevo: map phrase -> ctc acumulado por frase
      }
    );
  } catch {
    return {
      phrasesSeen: [],
      timeSpoken: 0,
      conversationTimeCreated: 0,
      ctcPerPhrase: {},
    };
  }
}
function saveProgress(p) {
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}

function computeArtificialCTC(phrase) {
	const numChars = (phrase || '').length;
	const artificialCTC = numChars * 0.25 * 0.75; // 0.25s por carácter, porque la longitud de la oración no es necesariamente proporcional a la duración hablada
	return artificialCTC;
}
function saveCTC(ctc) {
	localStorage.setItem('lp-artificial-ctc', JSON.stringify(ctc));
}
function loadCTC() {
	return JSON.parse(localStorage.getItem('lp-artificial-ctc')) || 0;
}

export default function PracticeScreen({ contextKey = "church", languagePair, onExit }) {
  const [data, setData] = useState([]);
  const [idx, setIdx] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [supported, setSupported] = useState({
    tts: !!window.speechSynthesis,
    asr: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  });
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [score, setScore] = useState(null);
  
	const recRef = useRef(null);
  const speakStartRef = useRef(0);
  const progressRef = useRef(loadProgress());

	// calcular CTC artificial actual
	const [artificialCTC, setArtificialCTC] = useState(loadCTC());

	// const [targetLang, nativeLang] = languagePair.split("_"); // underscore confirmed
  const targetLang = languagePair?.target;   // idioma que entreno
  const nativeLang = languagePair?.native;   // idioma que hablo

  // const current = data[idx] || {};
  const current = data[idx] || {};
  // const phraseMain = current[targetLang] || "...";
  const phraseMain = current.content?.[targetLang] || "...";
  // const phraseTranslation = current[nativeLang] || "";
  const phraseTranslation = current.content?.[nativeLang] || "";

	// const imageContextSrc = current.image
  //   ? `${import.meta.env.BASE_URL}images/context/${contextKey.toLowerCase()}/${current.image}`
  //   : null;
  // const imageContextSrc = `${import.meta.env.BASE_URL}images/context/${contextKey}/level${idx}.jpg`;
  const imageContextSrc = `${import.meta.env.BASE_URL}images/context/${contextKey.toLowerCase()}/level${current.level}.jpg`;


	// Cada vez que el usuario completa una frase:
	useEffect(() => {
  	const deltaCTC = computeArtificialCTC(current.korean);
  	const totalCTC = loadCTC() + deltaCTC;
  	saveCTC(totalCTC);
  	setArtificialCTC(totalCTC);
	}, [idx]); // idx cambia al pasar de frase


  // Load phrases
  // useEffect(() => {
  //   // fetch("/corean-app/json/korean_english.json")
	// 	fetch(`${import.meta.env.BASE_URL}json/${languagePair}.json`)
  //     .then((r) => r.json())
  //     .then((json) => {
  //       const arr = json[contextKey] || [];
  //       setData(arr);
  //     })
  //     .catch(() => setData([]));
  // }, [contextKey, languagePair]);
  // Load context JSON (levels)
  useEffect(() => {
    async function load() {
      try {
        const base = import.meta.env.BASE_URL || "/";
        const jsonPath = `${base}json/context/${contextKey}.json`;

        const res = await fetch(jsonPath);
        const json = await res.json();

        // levels es un array
        setData(json.levels || []);
        setIdx(0);
      } catch (e) {
        console.error("Error loading context", e);
        setData([]);
      }
    }
    load();
  }, [contextKey]);


  // Setup recognizer
  useEffect(() => {
    if (!supported.asr) return;
    // const rec = createRecognizer({ lang: "ko-KR", interimResults: true });
		// const rec = createRecognizer({ lang: targetLang === "korean" ? "ko-KR" : targetLang === "french" ? "fr-FR" : "en-US", interimResults: true });
    const LANG_ASR = {
      english: "en-US",
      spanish: "es-ES",
      french: "fr-FR",
      korean: "ko-KR",
      chinese: "zh-CN",
      dutch: "nl-NL",
      german: "de-DE"
    };

    const rec = createRecognizer({
      lang: LANG_ASR[targetLang] || "en-US",
      interimResults: true
    });


    if (!rec) return;

    rec.onresult = (ev) => {
      let chunk = "";
      let isFinal = false;

      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        chunk += ev.results[i][0].transcript;
        if (ev.results[i].isFinal) isFinal = true;
      }

      chunk = chunk.trim();
      if (!chunk) return;

      // setText(chunk);
      setLiveText(chunk);

      if (isFinal) {
        const now = performance.now();
        const delta = (now - (speakStartRef.current || now)) / 1000; // seconds

        const p = progressRef.current;
        p.timeSpoken = Math.max(
          0,
          (p.timeSpoken || 0) + (isFinite(delta) ? delta : 0)
        );

        // const currentKorean = data[idx]?.korean || "";
				// const currentTarget = current[targetLang] || "";
        const currentTarget = phraseMain;

        const s = similarity(chunk, currentTarget);
        setScore(Number.isFinite(s) ? s : 0);

        // --- calcular CTC ---
        const ctcContribution = computeCTC(currentTarget, delta, s);
        if (ctcContribution > 0) {
          p.conversationTimeCreated = (p.conversationTimeCreated || 0) + ctcContribution;
          p.ctcPerPhrase = p.ctcPerPhrase || {};
          p.ctcPerPhrase[currentTarget] = (p.ctcPerPhrase[currentTarget] || 0) + ctcContribution;
        }

        // --- marcar frase como vista ---
        if (currentTarget && !p.phrasesSeen.includes(currentTarget)) {
          p.phrasesSeen.push(currentTarget);
        }

        progressRef.current = p;
        saveProgress(p);

      }
    };

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [supported.asr, current, targetLang]);


	// async function handlePlay() {
	// 	// if (!supported.tts || !current.korean) return;
	// 	if (!current) return;

	// 	const target = targetLang.toLowerCase();
	// 	const context = contextKey.toLowerCase(); // church, food, etc...
	// 	const fileName = current.audio || (current.image ? current.image.replace(/\.(jpg|png|jpeg|gif)$/, '.mp3') : null); // audio file name from JSON

	// 	// const context = contextKey.toLowerCase(); // church, food, etc...
	// 	// const fileName = current.audio; // audio file name from JSON

	// 	// Ruta completa del archivo de audio
	// 	const base = import.meta.env.BASE_URL || '/';
	// 	const audioPath = `${base}audios/${target}/${context}/${fileName}`;

	// 	try {
	// 		// const res = await fetch(audioPath);
	// 		const res = await fetch(audioPath, { cache: "no-cache" }); // evitar caché para desarrollo
	// 		if (res.ok) {
	// 			const blob = await res.blob();
	// 			if (!blob.type.startsWith("audio/")) throw new Error("not-audio"); // nueva línea
	// 			const url = URL.createObjectURL(blob);
	// 			const audio = new Audio(url);
	// 			await audio.play();
	// 			setTimeout(() => URL.revokeObjectURL(url), 30000); // liberar URL después de 30s
	// 			return ;
	// 		} else {
	// 			console.warn("Audio file not found:", audioPath);
	// 		}
	// 	} catch(err) {
	// 		console.warn("Audio playback failed, falling back to TTS:", err);
	// 	}

	// 	// Fallback to TTS if audio file fetch/playback fails
	// 	const LOCALE_MAP = { english : "en-US", spanish: "es-ES", french: "fr-FR", korean: "ko-KR", chinese: "zh-CN" };
	// 	const synthLocale = LOCALE_MAP[target] || "en-US";
	// 	if (supported.tts && window.speechSynthesis) {
	// 		speak(current[targetLang] || current.text || "", { lang: synthLocale });
	// 	}

	// 	// speak(current.korean, { lang: "ko-KR" });

	// }
  async function handlePlay() {
    const base = import.meta.env.BASE_URL || "/";
    console.log(targetLang);
    console.log(contextKey);
    console.log(current.level);
    const audioPath = `${base}audios/languages/${targetLang}/context/${contextKey.toLowerCase()}/level${current.level}.mp3`;

    try {
      const res = await fetch(audioPath, { cache: "no-cache" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        return;
      }
    } catch (err) {
      console.warn("Audio missing:", err);
    }

    // fallback TTS
    const LOCALE_MAP = {
      english: "en-US",
      spanish: "es-ES",
      french: "fr-FR",
      korean: "ko-KR",
      chinese: "zh-CN",
      dutch: "nl-NL",
      german: "de-DE",
    };

    speak(phraseMain, { lang: LOCALE_MAP[targetLang] });
  }


  function startListening() {
    if (!recRef.current || listening) return;
    try {
      speakStartRef.current = performance.now();
      recRef.current.start();
    } catch {
      /* ignore if already started */
    }
  }

  function stopListening() {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {}
  }

  function next() {
    setScore(null);
    setLiveText("");

		const p = progressRef.current;

		if (idx + 1 >= data.length) {
			// todas las frases completadas
			p.totalPhrases = data.length; // guardar total de frases
			saveProgress(p);

			// Muestra la pantalla de progreso
			if (typeof onExit === "function") onExit("progress", p);

		} else {
			setIdx((i) => i + 1);
		}

    setIdx((i) => (i + 1 < data.length ? i + 1 : i));
  }

  function prev() {
    setScore(null);
    setLiveText("");
    setIdx((i) => (i - 1 >= 0 ? i - 1 : i));
  }

  return (
    <div style={{ position: "relative", padding: "1.25rem", maxWidth: 480, margin: "0 auto" }}>
      {/* Exit (shows summary later) */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          aria-label="Exit practice"
          onClick={onExit}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.25rem",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

				<p style={{ marginTop: 16, fontSize: 18, color: '#445' }} > LinguVits: {artificialCTC.toFixed(2)} seconds</p>
				
				{/* Progress bar */}
				<ProgressBar
					current={progressRef.current.phrasesSeen.length}
					total={data.length - 1}
				/>
			</div>


      {/* Image placeholder */}
			
      {imageContextSrc ? (
				<div style={{  }}>
					<img
						src={imageContextSrc}
						// alt={phraseTranslation || "phrase image"}
            alt={`${contextKey} level ${idx}`}
						style={{
							height: "auto",
							width: "100%",
							// maxWidth: "200px",
							objectFit: "cover",
							borderRadius: 16,
							marginBottom: 0,
						}}
					/>
				</div>
      ) : (
        <div
          style={{
            height: 160,
            borderRadius: 16,
            background: "linear-gradient(180deg,#E8F5FF,#F7FFFE)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span role="img" aria-label="context">
            🙏
          </span>
        </div>
      )}

      {/* Phrase + controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
					height: 70,
        }}
      >
        <button
          onClick={handlePlay}
          aria-label="Play audio"
          style={{
            borderRadius: 999,
            border: "1px solid #cce",
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          ▶
        </button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
          {phraseMain || "..."}
        </h2>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={showTranslation}
            onChange={(e) => setShowTranslation(e.target.checked)}
          />
          Show translation
        </label>
        {showTranslation && (
          <p style={{ marginTop: 8, color: "#445" }}>{phraseTranslation}</p>
        )}
      </div>

      {/* Mic controls */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <button
          onClick={startListening}
          disabled={!supported.asr || listening}
          style={{
            borderRadius: 999,
            padding: "14px 18px",
            border: "none",
            background: "#CFE9CF",
            cursor: supported.asr && !listening ? "pointer" : "not-allowed",
          }}
        >
          {listening ? "Listening…" : "Start speaking"}
        </button>
        <button
          onClick={stopListening}
          disabled={!listening}
          style={{
            borderRadius: 999,
            padding: "10px 14px",
            border: "1px solid #ccc",
            background: "#fff",
          }}
        >
          Stop
        </button>
      </div>

      {/* Live text (interim) */}
      {liveText && (
        <div style={{ fontSize: 14, color: "#667" }}>You said: {liveText}</div>
      )}

      {/* Affective feedback */}
      {score !== null && (
        <div
          style={{
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#F3FFF3",
            border: "1px solid #DCF5DC",
          }}
        >
          <div style={{ fontWeight: 600 }}>Well done! 🙌</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>
            {score >= SIM_THRESHOLD
              ? "That sounded great. Keep going!"
              : `Almost perfect! Tip: try saying it like: “${phraseMain}”`}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Match: {(score * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <button onClick={prev} disabled={idx === 0}>
          Previous
        </button>
        <button onClick={next} disabled={idx >= data.length - 1}>
          Next
        </button>
      </div>

      {/* Unsupported notice */}
      {(!supported.asr || !supported.tts) && (
        <p style={{ marginTop: 16, fontSize: 12, color: "#b00" }}>
          Note: Your browser may not fully support Speech APIs. Chrome desktop
          usually works best.
        </p>
      )}
    </div>
  );
}
