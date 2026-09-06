import { useState } from "react";

interface Props { onBack: () => void; }

const CATEGORIES = [
  { id: "symptoms",  label: "Symptoms",  icon: "🤒" },
  { id: "food",      label: "Food",      icon: "🍎" },
  { id: "medicine",  label: "Medicine",  icon: "💊" },
  { id: "activity",  label: "Activity",  icon: "🏃" },
  { id: "location",  label: "Location",  icon: "📍" },
];

const ITEMS: Record<string, { id: string; label: string; emoji: string }[]> = {
  symptoms: [
    { id: "headache",  label: "Headache",     emoji: "🤕" },
    { id: "nausea",    label: "Nausea",       emoji: "🤢" },
    { id: "fatigue",   label: "Fatigue",      emoji: "😴" },
    { id: "rash",      label: "Rash",         emoji: "🔴" },
    { id: "sneeze",    label: "Sneezing",     emoji: "🤧" },
    { id: "itch",      label: "Itching",      emoji: "😣" },
    { id: "stomach",   label: "Stomach pain", emoji: "😖" },
    { id: "swelling",  label: "Swelling",     emoji: "🫧" },
    { id: "cough",     label: "Cough",        emoji: "😮‍💨" },
    { id: "dizzy",     label: "Dizziness",    emoji: "😵" },
  ],
  food: [
    { id: "nuts",      label: "Nuts",         emoji: "🥜" },
    { id: "dairy",     label: "Dairy",        emoji: "🥛" },
    { id: "gluten",    label: "Gluten",       emoji: "🍞" },
    { id: "egg",       label: "Eggs",         emoji: "🥚" },
    { id: "fish",      label: "Fish",         emoji: "🐟" },
    { id: "soy",       label: "Soy",          emoji: "🫘" },
    { id: "fruit",     label: "Fruit",        emoji: "🍓" },
    { id: "shellfish", label: "Shellfish",    emoji: "🦐" },
    { id: "alcohol",   label: "Alcohol",      emoji: "🍺" },
    { id: "spicy",     label: "Spicy food",   emoji: "🌶️" },
  ],
  medicine: [
    { id: "antihistamine", label: "Antihistamine", emoji: "💊" },
    { id: "inhaler",       label: "Inhaler",       emoji: "💨" },
    { id: "epipen",        label: "EpiPen",        emoji: "💉" },
    { id: "steroid",       label: "Steroid cream", emoji: "🧴" },
    { id: "ibuprofen",     label: "Ibuprofen",     emoji: "🔵" },
    { id: "probiotic",     label: "Probiotic",     emoji: "🟢" },
    { id: "vitamin",       label: "Vitamin",       emoji: "⚡" },
  ],
  activity: [
    { id: "exercise",  label: "Exercise",  emoji: "🏋️" },
    { id: "walking",   label: "Walking",   emoji: "🚶" },
    { id: "swimming",  label: "Swimming",  emoji: "🏊" },
    { id: "cycling",   label: "Cycling",   emoji: "🚴" },
    { id: "resting",   label: "Resting",   emoji: "🛋️" },
    { id: "yoga",      label: "Yoga",      emoji: "🧘" },
  ],
  location: [
    { id: "home",       label: "Home",       emoji: "🏠" },
    { id: "outdoor",    label: "Outdoors",   emoji: "🌳" },
    { id: "work",       label: "Work/School",emoji: "🏢" },
    { id: "restaurant", label: "Restaurant", emoji: "🍴" },
    { id: "gym",        label: "Gym",        emoji: "🏟️" },
    { id: "travel",     label: "Travelling", emoji: "✈️" },
  ],
};

interface LogEntry { emoji: string; label: string; cat: string; time: string; }
function timeStr(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function StreakBanner({ streak }: { streak: number }) {
  return (
    <div style={{
      margin: "0 20px", padding: "12px 18px", borderRadius: 18,
      background: "linear-gradient(135deg, rgba(230,160,30,0.22) 0%, rgba(192,80,20,0.18) 100%)",
      border: "1px solid rgba(230,160,30,0.30)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: "1.8rem" }}>🔥</span>
      <div>
        <div style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 700, fontSize: "1.22rem", color: "#f4d060" }}>
          {streak}-day streak!
        </div>
        <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.75rem", color: "rgba(230,200,130,0.60)", marginTop: 2 }}>
          Keep logging daily to grow your streak
        </div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i < streak ? "#f4d060" : "rgba(255,255,255,0.14)" }}/>
        ))}
      </div>
    </div>
  );
}

export default function SymptomScreen({ onBack }: Props) {
  const [cat, setCat]       = useState("symptoms");
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const [log, setLog]       = useState<LogEntry[]>([]);
  const [animId, setAnimId] = useState<string | null>(null);

  const handleTap = (item: { id: string; label: string; emoji: string }) => {
    setTapped(prev => {
      const next = new Set(prev);
      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
      return next;
    });
    setAnimId(item.id);
    setTimeout(() => setAnimId(null), 380);
    setLog(prev => [{ emoji: item.emoji, label: item.label, cat, time: timeStr() }, ...prev.slice(0, 19)]);
  };

  const currentItems = ITEMS[cat] ?? [];

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "linear-gradient(170deg, #0b080e 0%, #160c1e 45%, #0a0810 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 0", flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.78rem", fontWeight: 300, color: "rgba(190,170,220,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Quick Log</div>
          <div style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 700, fontSize: "1.8rem", color: "#f0ecf8", lineHeight: 1.1, marginTop: 2 }}>Symptom Tracker</div>
        </div>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.14)",
          borderRadius: 12, color: "rgba(255,255,255,0.65)", width: 40, height: 40,
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
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 14px", background: "none", border: "none", cursor: "pointer",
            borderBottom: cat === c.id ? "2.5px solid #a060e8" : "2.5px solid transparent",
          }}>
            <span style={{ fontSize: "1.4rem" }}>{c.icon}</span>
            <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.68rem", fontWeight: cat === c.id ? 500 : 300, color: cat === c.id ? "#c890f8" : "rgba(200,185,220,0.45)" }}>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Icon grid */}
      <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {currentItems.map(item => {
            const active = tapped.has(item.id);
            return (
              <button key={item.id} onClick={() => handleTap(item)} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "12px 4px 10px", borderRadius: 16, border: "none",
                background: active ? "rgba(160,96,232,0.24)" : "rgba(255,255,255,0.05)",
                outline: active ? "1.5px solid rgba(160,96,232,0.55)" : "1.5px solid rgba(255,255,255,0.08)",
                cursor: "pointer", gap: 6,
                transform: animId === item.id ? "scale(1.18)" : "scale(1.0)",
                transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.18s ease",
              }}>
                <span style={{ fontSize: "1.55rem", lineHeight: 1 }}>{item.emoji}</span>
                <span style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.58rem", color: active ? "#d8b8f8" : "rgba(200,185,220,0.50)", textAlign: "center", lineHeight: 1.25 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log section */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 40px", display: "flex", flexDirection: "column", gap: 0 }}>
        {log.length > 0 ? (
          <>
            <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(180,160,210,0.40)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 10 }}>
              Today&apos;s log
            </div>
            {log.map((entry, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                borderBottom: i < log.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                animation: i === 0 ? "slideUp 0.28s ease both" : "none",
              }}>
                <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{entry.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.88rem", color: "#e8e0f0" }}>{entry.label}</div>
                  <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(180,160,210,0.42)", marginTop: 1, textTransform: "capitalize" }}>{entry.cat}</div>
                </div>
                <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.70rem", color: "rgba(160,140,190,0.40)", flexShrink: 0 }}>{entry.time}</div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ textAlign: "center", paddingTop: 20, fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.84rem", color: "rgba(180,155,210,0.30)", lineHeight: 1.7 }}>
            Tap any icon above to log<br/>your symptoms, food, or activity.
          </div>
        )}
      </div>
    </div>
  );
}
