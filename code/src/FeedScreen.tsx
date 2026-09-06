import React, { useState } from "react";

interface Props { onBack: () => void; }

function getBMI(weight: string, height: string): number | null {
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100;
  if (!w || !h) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}
function bmiLabel(bmi: number): { text: string; color: string } {
  if (bmi < 18.5) return { text: "Underweight", color: "#3498db" };
  if (bmi < 25)   return { text: "Healthy",     color: "#27ae60" };
  if (bmi < 30)   return { text: "Overweight",  color: "#e67e22" };
  return              { text: "Obese",           color: "#c0392b" };
}
interface Article {
  id: number; title: string; tag: string;
  tagColor: string; readTime: string; featured?: boolean; emoji: string;
}
const FEED: Article[] = [
  { id: 1, title: "5 hidden allergens lurking in everyday snacks",  tag: "Allergy",   tagColor: "#c0392b", readTime: "3 min", featured: true, emoji: "🔍" },
  { id: 2, title: "Reading ingredient labels like a pro",           tag: "Education", tagColor: "#8e44ad", readTime: "4 min", emoji: "📋" },
  { id: 3, title: "Gut microbiome and food sensitivities",          tag: "Research",  tagColor: "#2980b9", readTime: "6 min", emoji: "🔬" },
  { id: 4, title: "Managing cross-contamination when eating out",   tag: "Tips",      tagColor: "#e67e22", readTime: "3 min", emoji: "🍽️" },
  { id: 5, title: "Seasonal pollen and food allergy overlap",       tag: "Health",    tagColor: "#27ae60", readTime: "5 min", emoji: "🌸" },
  { id: 6, title: "Plant-based proteins low in common allergens",   tag: "Nutrition", tagColor: "#16a085", readTime: "4 min", emoji: "🥦" },
  { id: 7, title: "When to carry an EpiPen — a practical guide",    tag: "Safety",    tagColor: "#c0392b", readTime: "7 min", emoji: "💉" },
];
function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{
      flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 12px",
      border: "1px solid rgba(255,255,255,0.10)", minWidth: 0,
    }}>
      <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.65rem", color: "rgba(220,210,200,0.45)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 700, fontSize: "1.4rem", color: accent, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.68rem", color: "rgba(200,190,175,0.48)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
function FeaturedCard({ a }: { a: Article }) {
  return (
    <div style={{
      borderRadius: 20, cursor: "pointer",
      background: "linear-gradient(135deg, rgba(192,57,43,0.22) 0%, rgba(80,40,20,0.18) 100%)",
      border: "1px solid rgba(192,57,43,0.28)", padding: "22px 20px 18px",
    }}>
      <div style={{ fontSize: "2.4rem", marginBottom: 10 }}>{a.emoji}</div>
      <span style={{ background: a.tagColor, color: "white", fontFamily: "'Fredoka One', cursive", fontSize: "0.70rem", padding: "3px 11px", borderRadius: 20, display: "inline-block", marginBottom: 10 }}>{a.tag}</span>
      <div style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 700, fontSize: "1.22rem", color: "#f4ede4", lineHeight: 1.38, marginBottom: 8 }}>{a.title}</div>
      <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.76rem", color: "rgba(200,185,168,0.52)" }}>{a.readTime} read · Featured</div>
    </div>
  );
}
function GridCard({ a }: { a: Article }) {
  return (
    <div style={{
      borderRadius: 16, cursor: "pointer", padding: "16px 14px",
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
      display: "flex", flexDirection: "column", gap: 8, minHeight: 148,
    }}>
      <div style={{ fontSize: "1.8rem" }}>{a.emoji}</div>
      <span style={{ background: a.tagColor + "30", color: a.tagColor, fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.65rem", fontWeight: 500, padding: "2px 9px", borderRadius: 20, display: "inline-block", alignSelf: "flex-start" }}>{a.tag}</span>
      <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontWeight: 500, fontSize: "0.88rem", color: "#eae0d5", lineHeight: 1.38, flex: 1 }}>{a.title}</div>
      <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.68rem", color: "rgba(180,168,152,0.42)" }}>{a.readTime} read</div>
    </div>
  );
}

export default function FeedScreen({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "allergy" | "nutrition" | "tips">("all");

  const name   = localStorage.getItem("cc_user_name") || "there";
  const weight = localStorage.getItem("cc_weight") || "";
  const height = localStorage.getItem("cc_height") || "";
  const age    = localStorage.getItem("cc_age")    || "";
  const bmi    = getBMI(weight, height);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const TABS = ["all", "allergy", "nutrition", "tips"] as const;
  const filtered = activeTab === "all" ? FEED : FEED.filter(a =>
    a.tag.toLowerCase().includes(activeTab === "allergy" ? "allerg" : activeTab)
  );
  const featured = filtered.find(a => a.featured) ?? filtered[0];
  const grid     = filtered.filter(a => a.id !== featured?.id);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "linear-gradient(170deg, #0e0a08 0%, #1a0e08 40%, #0c0608 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 0", flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.82rem", fontWeight: 300, color: "rgba(220,200,175,0.48)", letterSpacing: "0.04em" }}>{greeting}</div>
          <div style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 700, fontSize: "2.0rem", color: "#f4ede4", lineHeight: 1.1, marginTop: 2 }}>{name}</div>
        </div>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.14)",
          borderRadius: 12, color: "rgba(255,255,255,0.65)", width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: "1.1rem", flexShrink: 0, marginTop: 6,
        }}>←</button>
      </div>

      {/* Stat tiles */}
      {(bmi || age || height || weight) ? (
        <div style={{ display: "flex", gap: 8, padding: "16px 20px 0", flexShrink: 0 }}>
          {bmi && (() => { const { text, color } = bmiLabel(bmi); return <StatTile key="bmi" label="BMI" value={String(bmi)} sub={text} accent={color}/>; })()}
          {age    && <StatTile key="age"    label="Age"    value={age}         sub="years" accent="#b8a896"/>}
          {height && <StatTile key="ht"     label="Height" value={`${height}cm`}           accent="#8aaccc"/>}
          {weight && <StatTile key="wt"     label="Weight" value={`${weight}kg`}           accent="#a0cc8a"/>}
        </div>
      ) : (
        <div style={{ margin: "16px 20px 0", padding: "12px 16px", borderRadius: 14, background: "rgba(192,57,43,0.10)", border: "1px solid rgba(192,57,43,0.20)", fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.84rem", color: "rgba(220,190,175,0.65)" }}>
          Complete your profile to see personal health stats.
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, padding: "16px 20px 0", overflowX: "auto", flexShrink: 0 } as React.CSSProperties}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            background: activeTab === t ? "#c0392b" : "rgba(255,255,255,0.07)",
            border: activeTab === t ? "none" : "1px solid rgba(255,255,255,0.10)",
            borderRadius: 20, padding: "7px 18px", cursor: "pointer",
            fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.80rem",
            fontWeight: activeTab === t ? 500 : 400,
            color: activeTab === t ? "white" : "rgba(210,195,175,0.60)",
            whiteSpace: "nowrap", transition: "background 0.2s ease, color 0.2s ease",
            boxShadow: activeTab === t ? "0 3px 12px rgba(192,57,43,0.32)" : "none",
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 48px", display: "flex", flexDirection: "column", gap: 14, animation: "slideUp 0.42s ease both" }}>
        {featured && <FeaturedCard a={featured}/>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {grid.map(a => <GridCard key={a.id} a={a}/>)}
        </div>
      </div>
    </div>
  );
}
