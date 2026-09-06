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

type ScanState = "idle" | "scanning" | "done";

export default function AllergyScreen({ onBack }: Props) {
  const [mode, setMode]           = useState<"camera" | "ocr">("camera");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [results, setResults]     = useState<string[]>([]);
  const [lineY, setLineY]         = useState(0);
  const lineRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const startScan = () => {
    setScanState("scanning");
    setResults([]);
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

  useEffect(() => () => {
    if (lineRef.current)  clearInterval(lineRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const allergenCount = results.filter(r => r in ALLERGEN_FLAGS).length;

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "#06090f", display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "52px 20px 16px",
        display: "flex", alignItems: "center", gap: 14, zIndex: 10,
        position: "relative",
      }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.16)",
          borderRadius: 12, color: "white", width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: "1.1rem",
        }}>←</button>
        <div>
          <div style={{
            fontFamily: "Lora, Georgia, serif",
            fontWeight: 700, fontSize: "1.55rem", color: "#f4f0ea", lineHeight: 1.1,
          }}>Allergy Scanner</div>
          <div style={{
            fontFamily: "Outfit, Helvetica, sans-serif",
            fontSize: "0.82rem", fontWeight: 300,
            color: "rgba(180,200,230,0.55)", marginTop: 2,
          }}>Scan label · flag allergens instantly</div>
        </div>
        {/* Mode toggle */}
        <div style={{
          marginLeft: "auto", display: "flex",
          background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 3, gap: 2,
        }}>
          {(["camera", "ocr"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setScanState("idle"); setResults([]); }} style={{
              background: mode === m ? "rgba(255,255,255,0.18)" : "transparent",
              border: "none", borderRadius: 16, padding: "5px 13px",
              color: mode === m ? "white" : "rgba(255,255,255,0.40)",
              fontFamily: "Outfit, Helvetica, sans-serif",
              fontSize: "0.78rem", cursor: "pointer",
              transition: "background 0.2s ease, color 0.2s ease",
            }}>
              {m === "camera" ? "📷 Barcode" : "✍️ OCR"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Viewfinder ── */}
      <div style={{
        position: "relative", margin: "0 20px", borderRadius: 22,
        overflow: "hidden", height: 260, background: "#0e151f", flexShrink: 0,
        border: "1.5px solid rgba(80,140,220,0.22)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, #1a2438 0%, #06090f 100%)",
        }}/>
        {/* Corner brackets */}
        {[
          { top: 14, left: 14 },
          { top: 14, right: 14 },
          { bottom: 14, left: 14 },
          { bottom: 14, right: 14 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", ...pos, width: 26, height: 26,
            borderTop:    ("top"    in pos) ? "2.5px solid rgba(80,160,255,0.75)" : "none",
            borderBottom: ("bottom" in pos) ? "2.5px solid rgba(80,160,255,0.75)" : "none",
            borderLeft:   ("left"   in pos) ? "2.5px solid rgba(80,160,255,0.75)" : "none",
            borderRight:  ("right"  in pos) ? "2.5px solid rgba(80,160,255,0.75)" : "none",
          } as React.CSSProperties}/>
        ))}
        {/* Scan line */}
        {scanState === "scanning" && (
          <div style={{
            position: "absolute", left: 20, right: 20,
            top: `${10 + lineY * 0.80}%`, height: 2,
            background: "linear-gradient(to right, transparent, rgba(80,200,120,0.85) 30%, rgba(80,200,120,0.85) 70%, transparent)",
            boxShadow: "0 0 8px rgba(80,200,120,0.60)", borderRadius: 2,
          }}/>
        )}
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          {scanState === "idle" && (
            <>
              <div style={{ fontSize: "2.8rem" }}>{mode === "camera" ? "▣" : "✍"}</div>
              <div style={{
                fontFamily: "Outfit, Helvetica, sans-serif",
                fontSize: "0.88rem", color: "rgba(160,190,230,0.55)",
                textAlign: "center", padding: "0 30px",
              }}>
                {mode === "camera"
                  ? "Point at barcode or ingredient label"
                  : "Place ingredient text in frame"}
              </div>
            </>
          )}
          {scanState === "scanning" && (
            <div style={{
              fontFamily: "Outfit, Helvetica, sans-serif",
              fontSize: "0.88rem", color: "rgba(80,200,120,0.80)",
              letterSpacing: "0.12em",
            }}>SCANNING…</div>
          )}
          {scanState === "done" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "Outfit, Helvetica, sans-serif",
              fontSize: "0.92rem", color: "rgba(80,200,120,0.90)",
            }}>
              <span style={{ fontSize: "1.3rem" }}>✓</span> Scan complete
            </div>
          )}
        </div>
        {scanState === "scanning" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(30,90,50,0.06)", pointerEvents: "none" }}/>
        )}
      </div>

      {/* ── Scan button ── */}
      <div style={{ padding: "18px 20px 10px", display: "flex", gap: 12, flexShrink: 0 }}>
        <button onClick={startScan} disabled={scanState === "scanning"} style={{
          flex: 1, padding: "15px", borderRadius: 16, border: "none",
          background: scanState === "scanning"
            ? "rgba(80,160,255,0.18)"
            : "linear-gradient(135deg, #4a8cff, #2a5ccc)",
          color: "white",
          fontFamily: "'Fredoka One', cursive", fontSize: "1.08rem",
          cursor: scanState === "scanning" ? "not-allowed" : "pointer",
          boxShadow: scanState === "scanning" ? "none" : "0 4px 18px rgba(74,140,255,0.32)",
          transition: "all 0.25s ease",
        }}>
          {scanState === "scanning" ? "Scanning…" : scanState === "done" ? "Scan Again" : "Tap to Scan"}
        </button>
        {scanState === "done" && (
          <button onClick={() => { setScanState("idle"); setResults([]); }} style={{
            padding: "15px 18px", borderRadius: 16,
            border: "1.5px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.60)",
            fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", cursor: "pointer",
          }}>Clear</button>
        )}
      </div>

      {/* ── Results ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "4px 20px 40px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {scanState === "done" && (
          <>
            <div style={{
              borderRadius: 14,
              background: allergenCount > 0 ? "rgba(192,57,43,0.14)" : "rgba(39,174,96,0.14)",
              border: `1.5px solid ${allergenCount > 0 ? "rgba(192,57,43,0.35)" : "rgba(39,174,96,0.35)"}`,
              padding: "13px 16px", display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: "1.6rem" }}>{allergenCount > 0 ? "⚠️" : "✅"}</span>
              <div>
                <div style={{
                  fontFamily: "Outfit, Helvetica, sans-serif", fontWeight: 500, fontSize: "0.95rem",
                  color: allergenCount > 0 ? "#ff8070" : "#60e890",
                }}>
                  {allergenCount > 0 ? `${allergenCount} allergen${allergenCount > 1 ? "s" : ""} detected` : "No known allergens found"}
                </div>
                <div style={{
                  fontFamily: "Outfit, Helvetica, sans-serif",
                  fontSize: "0.78rem", color: "rgba(200,200,200,0.48)", marginTop: 2,
                }}>{results.length} ingredients identified</div>
              </div>
            </div>
            <div style={{
              fontFamily: "Outfit, Helvetica, sans-serif",
              fontSize: "0.72rem", color: "rgba(160,185,220,0.45)",
              letterSpacing: "0.10em", textTransform: "uppercase", padding: "8px 2px 4px",
            }}>Ingredients</div>
            {results.map((r, i) => {
              const flag = ALLERGEN_FLAGS[r];
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 14px", borderRadius: 12,
                  background: flag ? "rgba(192,57,43,0.10)" : "rgba(255,255,255,0.04)",
                  border: flag ? "1px solid rgba(192,57,43,0.25)" : "1px solid rgba(255,255,255,0.07)",
                  animation: `slideUp 0.35s ease ${i * 0.04}s both`,
                }}>
                  <span style={{
                    fontFamily: "Outfit, Helvetica, sans-serif",
                    fontSize: "0.92rem", color: flag ? "#ffd0c8" : "rgba(220,220,220,0.72)",
                  }}>{r}</span>
                  {flag && (
                    <span style={{
                      background: flag.color, color: "white",
                      fontFamily: "Outfit, Helvetica, sans-serif",
                      fontSize: "0.68rem", fontWeight: 500,
                      padding: "3px 9px", borderRadius: 20, letterSpacing: "0.04em",
                    }}>{flag.label}</span>
                  )}
                </div>
              );
            })}
          </>
        )}
        {scanState === "idle" && (
          <div style={{
            textAlign: "center", paddingTop: 32,
            fontFamily: "Outfit, Helvetica, sans-serif",
            fontSize: "0.88rem", color: "rgba(140,170,210,0.35)", lineHeight: 1.7,
          }}>
            Tap scan to check a product for allergens.<br/>
            Supports barcodes and text labels.
          </div>
        )}
      </div>
    </div>
  );
}
