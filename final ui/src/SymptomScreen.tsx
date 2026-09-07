import React, { useEffect, useRef, useState } from "react";

function TrashIcon() {
  return (
    <svg viewBox="0 0 18 20" width="14" height="15" fill="none" style={{ display: "block" }}>
      <path d="M1.5 5 H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6.5 5 V3 H11.5 V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 5 L3.5 17 H14.5 L15.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 9 V14 M11 9 V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

interface Props { onBack: () => void; onOpenTutorial?: () => void; }

const CATEGORIES = [
  { id: "symptoms",  label: "Symptoms",  icon: "🤒" },
  { id: "food",      label: "Food",      icon: "🍎" },
  { id: "medicine",  label: "Medicine",  icon: "💊" },
  { id: "activity",  label: "Activity",  icon: "🏃" },
  { id: "location",  label: "Location",  icon: "📍" },
];

const ITEMS: Record<string, { id: string; label: string }[]> = {
  symptoms: [
    { id: "headache",  label: "Headache"     },
    { id: "nausea",    label: "Nausea"       },
    { id: "fatigue",   label: "Fatigue"      },
    { id: "rash",      label: "Rash"         },
    { id: "sneeze",    label: "Sneezing"     },
    { id: "itch",      label: "Itching"      },
    { id: "stomach",   label: "Stomach pain" },
    { id: "swelling",  label: "Swelling"     },
    { id: "cough",     label: "Cough"        },
    { id: "dizzy",     label: "Dizziness"    },
  ],
  food: [
    { id: "nuts",      label: "Nuts"       },
    { id: "dairy",     label: "Dairy"      },
    { id: "gluten",    label: "Gluten"     },
    { id: "egg",       label: "Eggs"       },
    { id: "fish",      label: "Fish"       },
    { id: "soy",       label: "Soy"        },
    { id: "fruit",     label: "Fruit"      },
    { id: "shellfish", label: "Shellfish"  },
    { id: "alcohol",   label: "Alcohol"    },
    { id: "spicy",     label: "Spicy food" },
  ],
  medicine: [
    { id: "antihistamine", label: "Antihistamine" },
    { id: "inhaler",       label: "Inhaler"       },
    { id: "epipen",        label: "EpiPen"        },
    { id: "steroid",       label: "Steroid cream" },
    { id: "ibuprofen",     label: "Ibuprofen"     },
    { id: "probiotic",     label: "Probiotic"     },
    { id: "vitamin",       label: "Vitamin"       },
  ],
  activity: [
    { id: "exercise",  label: "Exercise"   },
    { id: "walking",   label: "Walking"    },
    { id: "swimming",  label: "Swimming"   },
    { id: "cycling",   label: "Cycling"    },
    { id: "resting",   label: "Resting"    },
    { id: "yoga",      label: "Yoga"       },
  ],
  location: [
    { id: "home",       label: "Home"        },
    { id: "outdoor",    label: "Outdoors"    },
    { id: "work",       label: "Work/School" },
    { id: "restaurant", label: "Restaurant"  },
    { id: "gym",        label: "Gym"         },
    { id: "travel",     label: "Travelling"  },
  ],
};

interface LogEntry { label: string; cat: string; time: string; date: string; }

function timeStr(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function dateStr(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function loadLog(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem("cc_symptom_log") || "[]"); }
  catch { return []; }
}
function saveLog(entries: LogEntry[]) {
  localStorage.setItem("cc_symptom_log", JSON.stringify(entries.slice(0, 60)));
}

// Burning mushroom SVG for streak
function BurningMushroom() {
  return (
    <svg width="40" height="44" viewBox="0 0 40 44" fill="none" style={{ flexShrink: 0 }}>
      <rect x="14" y="26" width="12" height="14" rx="4" fill="#d4904a"/>
      <rect x="16" y="28" width="8" height="10" rx="3" fill="#e8a860"/>
      <ellipse cx="20" cy="26" rx="14" ry="10" fill="#c0392b"/>
      <ellipse cx="20" cy="26" rx="12" ry="8.5" fill="#d94f3a"/>
      <circle cx="15" cy="23" r="2.5" fill="rgba(255,255,255,0.55)"/>
      <circle cx="23" cy="21" r="1.8" fill="rgba(255,255,255,0.50)"/>
      <circle cx="27" cy="25" r="1.4" fill="rgba(255,255,255,0.45)"/>
      <path d="M18 26 C17 22 19 20 18 17 C16 20 14 21 15 24" fill="#f4b040" opacity="0.90"/>
      <path d="M22 26 C21 21 23 18 22 15 C24 19 26 20 25 23" fill="#f4b040" opacity="0.85"/>
      <path d="M20 25 C19 20 21 17 20 14 C22 18 23 19 22 22" fill="#f87020" opacity="0.95"/>
      <ellipse cx="20" cy="15" rx="3" ry="3" fill="#ffd060" opacity="0.55"/>
    </svg>
  );
}

function StreakBanner({ streak }: { streak: number }) {
  return (
    <div style={{
      margin: "0 20px", padding: "12px 18px", borderRadius: 18,
      background: "linear-gradient(135deg, rgba(230,160,30,0.18) 0%, rgba(192,80,20,0.14) 100%)",
      border: "1px solid rgba(230,160,30,0.28)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <BurningMushroom/>
      <div>
        <div style={{ fontFamily: "'Montserrat', Helvetica, sans-serif", fontWeight: 700, fontSize: "1.18rem", color: "#c05010" }}>
          {streak}-day streak!
        </div>
        <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.75rem", color: "rgba(160,80,40,0.60)", marginTop: 2 }}>
          Keep logging daily to grow your streak
        </div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i < streak ? "#e08030" : "rgba(192,80,20,0.18)" }}/>
        ))}
      </div>
    </div>
  );
}

// ── Records view ──────────────────────────────────────────────────────────────
function RecordsView({ log, onClose, onDelete }: { log: LogEntry[]; onClose: () => void; onDelete: (e: LogEntry) => void }) {
  const grouped = log.reduce<Record<string, LogEntry[]>>((acc, e) => {
    const key = e.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 40px", display: "flex", flexDirection: "column", gap: 0, animation: "slideUp 0.32s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 12px" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.4rem", color: "#3a1810" }}>Records</div>
        <button onClick={onClose} style={{ background: "rgba(192,57,43,0.10)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.82rem", color: "#c0392b" }}>Close</button>
      </div>
      {log.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 32, fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "rgba(154,80,64,0.40)" }}>
          No entries yet — start logging!
        </div>
      ) : Object.entries(grouped).map(([date, entries]) => (
        <div key={date} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.72rem", color: "rgba(154,80,64,0.50)", textTransform: "uppercase", letterSpacing: "0.10em", padding: "8px 2px 6px" }}>{date}</div>
          {entries.map((e, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.65)",
              borderBottom: i < entries.length - 1 ? "1px solid rgba(192,57,43,0.08)" : "none",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(192,57,43,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 20 18" width="18" height="16">
                  <path d="M2 12 Q2 7 5 4 Q8 2 10 2 Q12 2 15 4 Q18 7 18 12 Q14 13.5 10 14 Q6 13.5 2 12Z" fill="#c0392b" opacity="0.7"/>
                  <ellipse cx="10" cy="7" rx="2" ry="1.8" fill="white" opacity="0.85"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "#3a1810" }}>{e.label}</div>
                <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(154,80,64,0.50)", textTransform: "capitalize" }}>{e.cat}</div>
              </div>
              <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(154,80,64,0.40)", marginRight: 4 }}>{e.time}</div>
              <button onClick={() => onDelete(e)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "rgba(154,80,64,0.30)", flexShrink: 0 }}><TrashIcon/></button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SymptomScreen({ onBack }: Props) {
  const [cat, setCat]           = useState("symptoms");
  const [tapped, setTapped]     = useState<Set<string>>(new Set());
  const [log, setLog]           = useState<LogEntry[]>(loadLog);
  const [animId, setAnimId]     = useState<string | null>(null);
  const [otherVal, setOtherVal] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [view, setView]         = useState<"log" | "records">("log");
  const [showDone, setShowDone] = useState(false);
  const otherRef = useRef<HTMLInputElement>(null);

  // Persist log to localStorage on changes
  useEffect(() => { saveLog(log); }, [log]);

  const addEntry = (label: string, category: string) => {
    const entry: LogEntry = { label, cat: category, time: timeStr(), date: dateStr() };
    setLog(prev => [entry, ...prev.slice(0, 59)]);
  };

  const handleTap = (item: { id: string; label: string }) => {
    setTapped(prev => {
      const next = new Set(prev);
      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
      if (next.size > 0) setShowDone(true);
      return next;
    });
    setAnimId(item.id);
    setTimeout(() => setAnimId(null), 320);
    addEntry(item.label, cat);
  };

  const handleOtherSubmit = () => {
    const val = otherVal.trim();
    if (!val) return;
    addEntry(val, cat);
    setOtherVal("");
    setShowOther(false);
    setShowDone(true);
  };

  const handleDone = () => {
    setTapped(new Set());
    setShowDone(false);
    setOtherVal("");
    setShowOther(false);
  };

  const deleteEntry = (entry: LogEntry) => {
    setLog(prev => {
      const idx = prev.findIndex(e => e.label === entry.label && e.time === entry.time && e.date === entry.date);
      if (idx === -1) return prev;
      const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      saveLog(next);
      return next;
    });
  };

  const currentItems = ITEMS[cat] ?? [];

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "linear-gradient(160deg,#fff8f5 0%,#fde8e0 55%,#f8d8cc 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 0", flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.78rem", fontWeight: 300, color: "rgba(154,80,64,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Quick Log</div>
          <div style={{ fontFamily: "'Montserrat', Helvetica, sans-serif", fontWeight: 700, fontSize: "1.75rem", color: "#3a1810", lineHeight: 1.1, marginTop: 2 }}>Symptom Tracker</div>
        </div>
        <button onClick={onBack} style={{
          background: "rgba(192,57,43,0.10)", border: "1.5px solid rgba(192,57,43,0.22)",
          borderRadius: 12, color: "#c0392b", width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: "1.1rem", flexShrink: 0, marginTop: 6,
        }}>←</button>
      </div>

      {/* Streak */}
      <div style={{ marginTop: 16, flexShrink: 0 }}>
        <StreakBanner streak={3}/>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 0, padding: "16px 20px 0", flexShrink: 0, overflowX: "auto" }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => { setCat(c.id); setShowOther(false); }} style={{
            flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 14px", background: "none", border: "none", cursor: "pointer",
            borderBottom: cat === c.id ? "2.5px solid #c0392b" : "2.5px solid transparent",
          }}>
            <span style={{ fontSize: "1.4rem" }}>{c.icon}</span>
            <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.68rem", fontWeight: cat === c.id ? 500 : 300, color: cat === c.id ? "#c0392b" : "rgba(154,80,64,0.50)" }}>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Icon grid — text only (no emojis on items) */}
      <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {currentItems.map(item => {
            const active = tapped.has(item.id);
            return (
              <button key={item.id} onClick={() => handleTap(item)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "10px 4px 8px", borderRadius: 14, border: "none",
                background: active ? "rgba(192,57,43,0.16)" : "rgba(255,255,255,0.65)",
                outline: active ? "1.5px solid rgba(192,57,43,0.50)" : "1.5px solid rgba(192,57,43,0.12)",
                cursor: "pointer", minHeight: 56,
                transform: animId === item.id ? "scale(1.14)" : "scale(1.0)",
                transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.14s ease",
                boxShadow: active ? "0 3px 12px rgba(192,57,43,0.18)" : "0 1px 4px rgba(192,57,43,0.06)",
              }}>
                {/* Small mushroom dot indicator when active */}
                {active && (
                  <svg viewBox="0 0 12 10" width="10" height="9" style={{ marginBottom: 3 }}>
                    <path d="M1 8 Q1 4 3.5 2 Q6 0.5 6 0.5 Q6 0.5 8.5 2 Q11 4 11 8 Q8.5 9 6 9 Q3.5 9 1 8Z" fill="#c0392b"/>
                    <circle cx="6" cy="4" r="1.2" fill="white" opacity="0.8"/>
                  </svg>
                )}
                <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.64rem", fontWeight: active ? 500 : 400, color: active ? "#c0392b" : "rgba(80,40,30,0.75)", textAlign: "center", lineHeight: 1.25 }}>{item.label}</span>
              </button>
            );
          })}
          {/* Other */}
          <button onClick={() => { setShowOther(s => !s); setTimeout(() => otherRef.current?.focus(), 80); }} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "10px 4px 8px", borderRadius: 14, border: "none",
            background: showOther ? "rgba(192,57,43,0.16)" : "rgba(255,255,255,0.65)",
            outline: showOther ? "1.5px solid rgba(192,57,43,0.50)" : "1.5px dashed rgba(192,57,43,0.30)",
            cursor: "pointer", minHeight: 56,
            transition: "background 0.14s ease",
          }}>
            <svg viewBox="0 0 18 18" width="18" height="18" style={{ marginBottom: 3 }}>
              <circle cx="9" cy="9" r="8" fill="rgba(192,57,43,0.15)" stroke="rgba(192,57,43,0.45)" strokeWidth="1.2"/>
              <path d="M6 9 H12 M9 6 V12" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.64rem", color: showOther ? "#c0392b" : "rgba(80,40,30,0.60)", textAlign: "center" }}>Other</span>
          </button>
        </div>

        {showOther && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, animation: "slideUp 0.22s ease both" }}>
            <input
              ref={otherRef}
              value={otherVal}
              onChange={e => setOtherVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleOtherSubmit()}
              placeholder={`Describe your ${cat}…`}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 12,
                border: "1.5px solid rgba(192,57,43,0.28)",
                background: "rgba(255,255,255,0.80)",
                fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem",
                color: "#3a1810", outline: "none",
              }}
            />
            <button onClick={handleOtherSubmit} style={{
              padding: "10px 16px", borderRadius: 12, border: "none",
              background: "#c0392b", color: "white",
              fontFamily: "'Fredoka One', cursive", fontSize: "0.95rem", cursor: "pointer",
            }}>Log</button>
          </div>
        )}

        {/* Done button */}
        {showDone && (
          <button onClick={handleDone} style={{
            width: "100%", marginTop: 12, padding: "13px", borderRadius: 14, border: "none",
            background: "#c0392b", color: "white",
            fontFamily: "'Fredoka One', cursive", fontSize: "1.05rem",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(192,57,43,0.28)",
            animation: "slideUp 0.28s ease both",
          }}>
            Done — confirm entries
          </button>
        )}
      </div>

      {/* Log / Records toggle */}
      <div style={{ padding: "12px 20px 0", display: "flex", gap: 8, flexShrink: 0 }}>
        {(["log", "records"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer",
            background: view === v ? "#c0392b" : "rgba(192,57,43,0.08)",
            color: view === v ? "white" : "rgba(154,80,64,0.70)",
            fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.80rem",
            fontWeight: view === v ? 500 : 400,
            boxShadow: view === v ? "0 3px 10px rgba(192,57,43,0.25)" : "none",
            transition: "background 0.2s ease",
          }}>{v === "log" ? "Today" : "Records"}</button>
        ))}
      </div>

      {view === "records" ? (
        <RecordsView log={log} onClose={() => setView("log")} onDelete={deleteEntry}/>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 40px", display: "flex", flexDirection: "column", gap: 0 }}>
          {log.filter(e => e.date === dateStr()).length > 0 ? (
            <>
              <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(154,80,64,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 8 }}>
                Today&apos;s log
              </div>
              {log.filter(e => e.date === dateStr()).map((entry, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 12,
                  background: "rgba(255,255,255,0.60)",
                  borderBottom: "1px solid rgba(192,57,43,0.07)",
                  animation: i === 0 ? "slideUp 0.25s ease both" : "none",
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 18 16" width="16" height="14">
                      <path d="M1 11 Q1 6 4 3.5 Q6.5 1.5 9 1.5 Q11.5 1.5 14 3.5 Q17 6 17 11 Q13.5 12.5 9 13 Q4.5 12.5 1 11Z" fill="#c0392b" opacity="0.65"/>
                      <ellipse cx="9" cy="6.5" rx="2" ry="1.8" fill="white" opacity="0.85"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "#3a1810" }}>{entry.label}</div>
                    <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(154,80,64,0.45)", marginTop: 1, textTransform: "capitalize" }}>{entry.cat}</div>
                  </div>
                  <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(154,80,64,0.40)", flexShrink: 0, marginRight: 4 }}>{entry.time}</div>
                  <button onClick={() => deleteEntry(entry)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "rgba(154,80,64,0.28)", flexShrink: 0 }}><TrashIcon/></button>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 24, fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.84rem", color: "rgba(154,80,64,0.35)", lineHeight: 1.7 }}>
              Tap any item above to log<br/>your symptoms, food, or activity.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
