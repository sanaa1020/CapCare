import React, { useEffect, useRef, useState } from "react";

interface Props { onBack: () => void; }

const MOCK_INGREDIENTS = [
  "Wheat flour", "Sugar", "Palm oil", "Cocoa butter",
  "Skim milk powder", "Soy lecithin", "Natural flavour",
  "Salt", "Vanillin", "Peanut traces",
];

const ALLERGEN_FLAGS: Record<string, { label: string; color: string }> = {
  "Wheat flour":      { label: "Gluten",    color: "#e67e22" },
  "Skim milk powder": { label: "Dairy",     color: "#3498db" },
  "Soy lecithin":     { label: "Soy",       color: "#27ae60" },
  "Peanut traces":    { label: "Peanuts ⚠", color: "#c0392b" },
};

const SAFER_ALTERNATIVES: Record<string, { name: string; note: string }[]> = {
  "Wheat flour":      [{ name: "Rice flour", note: "Gluten-free, mild flavour" }, { name: "Almond flour", note: "Rich, higher protein" }],
  "Skim milk powder": [{ name: "Oat milk powder", note: "Creamy, dairy-free" }, { name: "Coconut milk powder", note: "Rich alternative" }],
  "Soy lecithin":     [{ name: "Sunflower lecithin", note: "Soy-free emulsifier" }],
  "Peanut traces":    [{ name: "Sunflower seed butter", note: "No tree nuts, no peanuts" }, { name: "Pumpkin seed products", note: "Allergy-friendly" }],
};

interface ScanRecord { date: string; time: string; product: string; flagCount: number; ingredients: string[]; }

type ScanState = "idle" | "scanning" | "done";
type MainView = "scanner" | "history";

function timeStr() { return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }); }
function dateStr() { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function loadHistory(): ScanRecord[] {
  try { return JSON.parse(localStorage.getItem("cc_scan_history") || "[]"); }
  catch { return []; }
}
function saveHistory(h: ScanRecord[]) {
  localStorage.setItem("cc_scan_history", JSON.stringify(h.slice(0, 30)));
}

// Small mascot mushroom SVG for pop sequence
function MascotMush({ delay, size = 44 }: { delay: number; size?: number }) {
  return (
    <svg viewBox="0 0 44 48" width={size} height={Math.round(size * 48 / 44)}
      style={{
        opacity: 0,
        animation: `mushPop 0.55s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms forwards`,
        willChange: "transform, opacity",
        display: "block",
      }}
    >
      {/* Body */}
      <path d="M15 32 C14 39 13 44 13 46 Q13 48 22 48 Q31 48 31 46 C31 44 30 39 29 32 Z" fill="#f2e8d6" stroke="#c9aa7c" strokeWidth="1.5"/>
      <path d="M11 32 Q22 36 33 32" fill="none" stroke="#c9aa7c" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Cheeks */}
      <ellipse cx="16" cy="42" rx="4" ry="2.5" fill="#f4a0a0" opacity="0.45"/>
      <ellipse cx="28" cy="42" rx="4" ry="2.5" fill="#f4a0a0" opacity="0.45"/>
      {/* Eyes */}
      <ellipse cx="18" cy="38" rx="2.2" ry="2.5" fill="#2a1a0a"/>
      <ellipse cx="19" cy="37" rx="0.8" ry="0.8" fill="white"/>
      <ellipse cx="26" cy="38" rx="2.2" ry="2.5" fill="#2a1a0a"/>
      <ellipse cx="27" cy="37" rx="0.8" ry="0.8" fill="white"/>
      {/* Smile */}
      <path d="M18.5 43 Q22 46 25.5 43" stroke="#2a1a0a" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Cap */}
      <path d="M5 30 Q4 18 11 12 Q15 8 22 7 Q29 8 33 12 Q40 18 39 30 Q31 33 22 34 Q13 33 5 30Z"
        fill="#c0392b" stroke="#8b1a1a" strokeWidth="1.5"/>
      <path d="M11 14 Q17 10 22 10 Q27 10 33 14" stroke="rgba(255,255,255,0.25)" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <ellipse cx="22" cy="16" rx="5.5" ry="5" fill="white" opacity="0.90"/>
      <ellipse cx="12" cy="23" rx="3.8" ry="3.4" fill="white" opacity="0.85"/>
      <ellipse cx="32" cy="22" rx="3.8" ry="3.4" fill="white" opacity="0.85"/>
    </svg>
  );
}

// ── 3 staggered mascot mushrooms pointing toward View Results ─────────────────
function MushroomPopSequence({ onViewResults }: { onViewResults: () => void }) {
  return (
    <div style={{ padding: "14px 20px 0", animation: "slideUp 0.35s ease both" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, justifyContent: "center" }}>
          <MascotMush delay={80}  size={36}/>
          <MascotMush delay={200} size={44}/>
          <MascotMush delay={320} size={36}/>
        </div>
        <button
          onClick={onViewResults}
          style={{
            padding: "14px 32px", borderRadius: 16, border: "none",
            background: "linear-gradient(135deg, #c0392b 0%, #e04030 100%)",
            color: "white", fontFamily: "'Fredoka One', cursive", fontSize: "1.12rem",
            cursor: "pointer",
            boxShadow: "0 6px 22px rgba(192,57,43,0.38)",
            opacity: 0,
            animation: "slideUp 0.40s ease 0.50s both",
          }}
        >
          View Results →
        </button>
      </div>
    </div>
  );
}

// ── Results page ──────────────────────────────────────────────────────────────
function ResultsView({
  results, onBack, onDone,
}: { results: string[]; onBack: () => void; onDone: () => void }) {
  const flagged = results.filter(r => r in ALLERGEN_FLAGS);
  const safe    = results.filter(r => !(r in ALLERGEN_FLAGS));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 48px", display: "flex", flexDirection: "column", gap: 14, animation: "slideUp 0.35s ease both" }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 4px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "#c0392b", display: "flex", alignItems: "center", gap: 4 }}>← Back</button>
        <button onClick={onDone} style={{ background: "#c0392b", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontFamily: "'Fredoka One', cursive", fontSize: "0.92rem", color: "white" }}>Done ✓</button>
      </div>

      {/* Summary banner */}
      <div style={{
        borderRadius: 16, padding: "14px 18px",
        background: flagged.length > 0 ? "rgba(192,57,43,0.12)" : "rgba(39,174,96,0.12)",
        border: `1.5px solid ${flagged.length > 0 ? "rgba(192,57,43,0.32)" : "rgba(39,174,96,0.32)"}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <svg viewBox="0 0 32 32" width="36" height="36">
          {flagged.length > 0 ? (
            <>
              <circle cx="16" cy="16" r="14" fill="rgba(192,57,43,0.18)" stroke="#c0392b" strokeWidth="1.5"/>
              <path d="M16 9 L16 18" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="16" cy="22" r="1.5" fill="#c0392b"/>
            </>
          ) : (
            <>
              <circle cx="16" cy="16" r="14" fill="rgba(39,174,96,0.18)" stroke="#27ae60" strokeWidth="1.5"/>
              <path d="M10 16 L14 20 L22 12" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          )}
        </svg>
        <div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.05rem", color: flagged.length > 0 ? "#c0392b" : "#27ae60" }}>
            {flagged.length > 0 ? `${flagged.length} allergen${flagged.length > 1 ? "s" : ""} detected` : "No known allergens found"}
          </div>
          <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.78rem", color: "rgba(154,80,64,0.55)", marginTop: 2 }}>
            {results.length} ingredients identified
          </div>
        </div>
      </div>

      {/* Flagged ingredients + alternatives */}
      {flagged.length > 0 && (
        <>
          <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.72rem", color: "rgba(154,80,64,0.50)", letterSpacing: "0.10em", textTransform: "uppercase" }}>Allergens Found</div>
          {flagged.map((r, i) => {
            const flag = ALLERGEN_FLAGS[r];
            const alts = SAFER_ALTERNATIVES[r] || [];
            return (
              <div key={i} style={{
                borderRadius: 16, overflow: "hidden",
                border: "1.5px solid rgba(192,57,43,0.25)",
                background: "rgba(255,255,255,0.80)",
                animation: `slideUp 0.30s ease ${i * 0.06}s both`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                  <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.95rem", color: "#3a1810" }}>{r}</span>
                  <span style={{ background: flag.color, color: "white", fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", fontWeight: 500, padding: "3px 10px", borderRadius: 20 }}>{flag.label}</span>
                </div>
                {alts.length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(192,57,43,0.10)", padding: "10px 16px", background: "rgba(192,57,43,0.04)" }}>
                    <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(154,80,64,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Safer alternatives</div>
                    {alts.map((a, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: j < alts.length - 1 ? 6 : 0 }}>
                        <svg viewBox="0 0 12 12" width="12" height="12"><circle cx="6" cy="6" r="5" fill="#27ae60"/><path d="M3 6 L5.5 8.5 L9 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div>
                          <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.85rem", color: "#3a1810", fontWeight: 500 }}>{a.name}</span>
                          <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.78rem", color: "rgba(154,80,64,0.60)" }}> — {a.note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* All ingredients */}
      <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.72rem", color: "rgba(154,80,64,0.50)", letterSpacing: "0.10em", textTransform: "uppercase" }}>All Ingredients</div>
      {results.map((r, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderRadius: 12,
          background: ALLERGEN_FLAGS[r] ? "rgba(192,57,43,0.08)" : "rgba(255,255,255,0.60)",
          border: ALLERGEN_FLAGS[r] ? "1px solid rgba(192,57,43,0.22)" : "1px solid rgba(192,57,43,0.08)",
        }}>
          <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: ALLERGEN_FLAGS[r] ? "#c0392b" : "#3a1810" }}>{r}</span>
          {ALLERGEN_FLAGS[r] && (
            <span style={{ background: ALLERGEN_FLAGS[r].color, color: "white", fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.65rem", fontWeight: 500, padding: "2px 8px", borderRadius: 20 }}>{ALLERGEN_FLAGS[r].label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── History view ──────────────────────────────────────────────────────────────
function HistoryView({ history, onClose }: { history: ScanRecord[]; onClose: () => void }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 48px", animation: "slideUp 0.35s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 12px" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.4rem", color: "#3a1810" }}>Scan History</div>
        <button onClick={onClose} style={{ background: "rgba(192,57,43,0.10)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.82rem", color: "#c0392b" }}>Close</button>
      </div>
      {history.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 32, fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "rgba(154,80,64,0.40)" }}>
          No scans yet — tap "Scan" to get started!
        </div>
      ) : history.map((s, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14,
          background: "rgba(255,255,255,0.70)", border: "1px solid rgba(192,57,43,0.10)",
          marginBottom: 10,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: s.flagCount > 0 ? "rgba(192,57,43,0.12)" : "rgba(39,174,96,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              {s.flagCount > 0 ? (
                <>
                  <circle cx="12" cy="12" r="10" stroke="#c0392b" strokeWidth="1.5"/>
                  <path d="M12 7 L12 13" stroke="#c0392b" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16.5" r="1.2" fill="#c0392b"/>
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" stroke="#27ae60" strokeWidth="1.5"/>
                  <path d="M7.5 12 L10.5 15 L16.5 9" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              )}
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.0rem", color: "#3a1810" }}>{s.product}</div>
            <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.75rem", color: "rgba(154,80,64,0.55)", marginTop: 2 }}>
              {s.flagCount > 0 ? `${s.flagCount} allergen${s.flagCount > 1 ? "s" : ""}` : "Clean scan"} · {s.date} at {s.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main AllergyScreen ────────────────────────────────────────────────────────
export default function AllergyScreen({ onBack }: Props) {
  const [mode, setMode]           = useState<"camera" | "ocr">("camera");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [results, setResults]     = useState<string[]>([]);
  const [lineY, setLineY]         = useState(0);
  const [mainView, setMainView]   = useState<MainView>("scanner");
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory]     = useState<ScanRecord[]>(loadHistory);
  const lineRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const startScan = () => {
    setScanState("scanning");
    setResults([]);
    setShowResults(false);
    setLineY(0);
    let y = 0;
    lineRef.current = setInterval(() => {
      y = (y + 1.4) % 100;
      setLineY(y);
    }, 16);
    timerRef.current = setTimeout(() => {
      if (lineRef.current) clearInterval(lineRef.current);
      setScanState("done");
      setResults(MOCK_INGREDIENTS);
    }, 2400);
  };

  const handleDone = () => {
    // Save to history
    const flagCount = MOCK_INGREDIENTS.filter(r => r in ALLERGEN_FLAGS).length;
    const record: ScanRecord = {
      date: dateStr(), time: timeStr(),
      product: mode === "camera" ? "Scanned Product" : "OCR Scan",
      flagCount, ingredients: MOCK_INGREDIENTS,
    };
    setHistory(prev => {
      const next = [record, ...prev.slice(0, 29)];
      saveHistory(next);
      return next;
    });
    setScanState("idle");
    setResults([]);
    setShowResults(false);
  };

  useEffect(() => () => {
    if (lineRef.current)  clearInterval(lineRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const allergenCount = results.filter(r => r in ALLERGEN_FLAGS).length;

  if (showResults) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(160deg,#fff8f5 0%,#fde8e0 55%,#f8d8cc 100%)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "52px 20px 0", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Montserrat', Helvetica, sans-serif", fontWeight: 700, fontSize: "1.55rem", color: "#c0392b" }}>Allergy Scanner</div>
        </div>
        <ResultsView results={results} onBack={() => setShowResults(false)} onDone={handleDone}/>
      </div>
    );
  }

  if (mainView === "history") {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(160deg,#fff8f5 0%,#fde8e0 55%,#f8d8cc 100%)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "52px 20px 16px", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.50)", borderBottom: "1.5px solid rgba(192,57,43,0.10)" }}>
          <button onClick={onBack} style={{ background: "rgba(192,57,43,0.10)", border: "1.5px solid rgba(192,57,43,0.22)", borderRadius: 12, color: "#c0392b", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.1rem" }}>←</button>
          <div style={{ fontFamily: "'Montserrat', Helvetica, sans-serif", fontWeight: 700, fontSize: "1.55rem", color: "#c0392b" }}>Allergy Scanner</div>
        </div>
        <HistoryView history={history} onClose={() => setMainView("scanner")}/>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(160deg,#fff8f5 0%,#fde8e0 55%,#f8d8cc 100%)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 16px", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.50)", borderBottom: "1.5px solid rgba(192,57,43,0.10)" }}>
        <button onClick={onBack} style={{ background: "rgba(192,57,43,0.10)", border: "1.5px solid rgba(192,57,43,0.22)", borderRadius: 12, color: "#c0392b", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.1rem" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Montserrat', Helvetica, sans-serif", fontWeight: 700, fontSize: "1.55rem", color: "#c0392b", lineHeight: 1.1 }}>Allergy Scanner</div>
          <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.82rem", fontWeight: 300, color: "rgba(154,80,64,0.60)", marginTop: 2 }}>Scan label · flag allergens instantly</div>
        </div>
        {/* History button */}
        <button onClick={() => setMainView("history")} style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid rgba(192,57,43,0.20)", borderRadius: 12, color: "#c0392b", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#c0392b" strokeWidth="1.5"/>
            <path d="M10 5 L10 10 L13 13" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {/* Mode toggle */}
        <div style={{ display: "flex", background: "rgba(192,57,43,0.08)", borderRadius: 20, padding: 3, gap: 2 }}>
          {(["camera", "ocr"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setScanState("idle"); setResults([]); setShowResults(false); }} style={{
              background: mode === m ? "#c0392b" : "transparent", border: "none", borderRadius: 16, padding: "5px 13px",
              color: mode === m ? "white" : "rgba(154,80,64,0.55)",
              fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.78rem", cursor: "pointer",
              transition: "background 0.2s ease, color 0.2s ease",
            }}>
              {m === "camera" ? "Barcode" : "OCR"}
            </button>
          ))}
        </div>
      </div>

      {/* Viewfinder */}
      <div style={{ position: "relative", margin: "16px 20px 0", borderRadius: 22, overflow: "hidden", height: 220, background: "linear-gradient(135deg, #1a0e08 0%, #2a1408 100%)", border: "1.5px solid rgba(192,57,43,0.28)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, #2a1a10 0%, #0e0806 100%)" }}/>
        {[{ top: 14, left: 14 }, { top: 14, right: 14 }, { bottom: 14, left: 14 }, { bottom: 14, right: 14 }].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 26, height: 26,
            borderTop:    ("top"    in pos) ? "2.5px solid rgba(192,57,43,0.70)" : "none",
            borderBottom: ("bottom" in pos) ? "2.5px solid rgba(192,57,43,0.70)" : "none",
            borderLeft:   ("left"   in pos) ? "2.5px solid rgba(192,57,43,0.70)" : "none",
            borderRight:  ("right"  in pos) ? "2.5px solid rgba(192,57,43,0.70)" : "none",
          } as React.CSSProperties}/>
        ))}
        {scanState === "scanning" && (
          <div style={{ position: "absolute", left: 20, right: 20, top: `${10 + lineY * 0.80}%`, height: 2, background: "linear-gradient(to right, transparent, rgba(80,200,120,0.85) 30%, rgba(80,200,120,0.85) 70%, transparent)", boxShadow: "0 0 8px rgba(80,200,120,0.60)", borderRadius: 2 }}/>
        )}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {scanState === "idle" && (
            <>
              {mode === "camera" ? (
                <div style={{ fontSize: "2.8rem" }}>▣</div>
              ) : (
                <svg viewBox="0 0 54 56" width="54" height="56" fill="none" style={{ marginBottom: 2 }}>
                  {/* Mushroom cap */}
                  <path d="M7 32 Q6 22 11 15 Q16 9 27 8 Q38 9 43 15 Q48 22 47 32 Q37 35.5 27 36 Q17 35.5 7 32Z"
                    fill="rgba(192,57,43,0.36)" stroke="rgba(192,57,43,0.52)" strokeWidth="1.4"/>
                  <path d="M11 16 Q18 10 27 9 Q36 10 43 16"
                    stroke="rgba(255,255,255,0.20)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <ellipse cx="27" cy="18" rx="5.5" ry="5" fill="white" opacity="0.46"/>
                  <ellipse cx="15" cy="25" rx="3.5" ry="3.1" fill="white" opacity="0.40"/>
                  <ellipse cx="39" cy="24" rx="3.5" ry="3.1" fill="white" opacity="0.40"/>
                  {/* Gill arc */}
                  <path d="M7 32 Q27 36.5 47 32" fill="none" stroke="rgba(192,57,43,0.38)" strokeWidth="1.1" strokeLinecap="round"/>
                  {/* Stem / body */}
                  <rect x="19" y="35" width="16" height="18" rx="4"
                    fill="rgba(232,216,192,0.16)" stroke="rgba(160,190,230,0.28)" strokeWidth="1.1"/>
                  {/* Text lines inside body */}
                  <line x1="23" y1="41" x2="35" y2="41" stroke="rgba(160,190,230,0.55)" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="23" y1="45" x2="32" y2="45" stroke="rgba(160,190,230,0.42)" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="23" y1="49" x2="35" y2="49" stroke="rgba(160,190,230,0.34)" strokeWidth="1.2" strokeLinecap="round"/>
                  {/* Scan line */}
                  <line x1="5" y1="22" x2="49" y2="22"
                    stroke="rgba(80,200,120,0.48)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="4 3"/>
                  {/* Corner brackets */}
                  <path d="M5 18 L5 14 L9 14" stroke="rgba(80,200,120,0.52)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M49 18 L49 14 L45 14" stroke="rgba(80,200,120,0.52)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
              <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "rgba(160,190,230,0.55)", textAlign: "center", padding: "0 30px" }}>
                {mode === "camera" ? "Point at barcode or ingredient label" : "Place ingredient text in frame"}
              </div>
            </>
          )}
          {scanState === "scanning" && <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "rgba(80,200,120,0.80)", letterSpacing: "0.12em" }}>SCANNING…</div>}
          {scanState === "done" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.92rem", color: "rgba(80,200,120,0.90)" }}>
              <span style={{ fontSize: "1.3rem" }}>✓</span> Scan complete
            </div>
          )}
        </div>
      </div>

      {/* Scan button row */}
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 12 }}>
        <button onClick={startScan} disabled={scanState === "scanning"} style={{
          flex: 1, padding: "15px", borderRadius: 16, border: "none",
          background: scanState === "scanning" ? "rgba(192,57,43,0.22)" : "#c0392b",
          color: "white", fontFamily: "'Fredoka One', cursive", fontSize: "1.08rem",
          cursor: scanState === "scanning" ? "not-allowed" : "pointer",
          boxShadow: scanState === "scanning" ? "none" : "0 4px 18px rgba(192,57,43,0.30)",
          transition: "all 0.25s ease",
        }}>
          {scanState === "scanning" ? "Scanning…" : scanState === "done" ? "Scan Again" : "Tap to Scan"}
        </button>
        {scanState === "done" && (
          <button onClick={() => { setScanState("idle"); setResults([]); setShowResults(false); }} style={{ padding: "15px 18px", borderRadius: 16, border: "1.5px solid rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.08)", color: "#c0392b", fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", cursor: "pointer" }}>Clear</button>
        )}
      </div>

      {/* 3 mushroom characters → View Results */}
      {scanState === "done" && !showResults && (
        <MushroomPopSequence onViewResults={() => setShowResults(true)}/>
      )}

      {/* Results summary + Done button while in scanner view */}
      {scanState === "done" && !showResults && (
        <div style={{ padding: "12px 20px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{
            borderRadius: 14,
            background: allergenCount > 0 ? "rgba(192,57,43,0.14)" : "rgba(39,174,96,0.14)",
            border: `1.5px solid ${allergenCount > 0 ? "rgba(192,57,43,0.35)" : "rgba(39,174,96,0.35)"}`,
            padding: "13px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: "1.6rem" }}>{allergenCount > 0 ? "⚠️" : "✅"}</span>
            <div>
              <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontWeight: 500, fontSize: "0.95rem", color: allergenCount > 0 ? "#c0392b" : "#27ae60" }}>
                {allergenCount > 0 ? `${allergenCount} allergen${allergenCount > 1 ? "s" : ""} detected` : "No known allergens"}
              </div>
              <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.78rem", color: "rgba(154,80,64,0.50)", marginTop: 2 }}>{results.length} ingredients identified</div>
            </div>
          </div>
          <button onClick={handleDone} style={{
            width: "100%", padding: "14px", borderRadius: 14,
            border: "1.5px solid rgba(192,57,43,0.22)",
            background: "rgba(192,57,43,0.10)",
            color: "#c0392b", fontFamily: "'Fredoka One', cursive", fontSize: "1.05rem",
            cursor: "pointer",
          } as React.CSSProperties}>
            Done — save & close
          </button>
        </div>
      )}

      {/* Idle empty state */}
      {scanState === "idle" && (
        <div style={{ padding: "32px 20px 48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "rgba(154,80,64,0.45)", lineHeight: 1.7 }}>
            Tap scan to check a product for allergens.<br/>Supports barcodes and text labels.
          </div>
        </div>
      )}
    </div>
  );
}
