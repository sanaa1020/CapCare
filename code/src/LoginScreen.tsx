import React, { useState } from "react";

interface Props { onBack: () => void; onSuccess: () => void; }

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 18px", borderRadius: 14,
  border: "2px solid rgba(192,57,43,0.22)", outline: "none",
  fontFamily: "'Fredoka One', cursive", fontSize: "1.05rem",
  background: "rgba(255,255,255,0.72)", color: "#3a1810",
  boxSizing: "border-box",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
};

function Field({ placeholder, type = "text", value, onChange }: {
  placeholder: string; type?: string;
  value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      style={{
        ...inputStyle,
        borderColor: focused ? "#c0392b" : "rgba(192,57,43,0.22)",
        boxShadow: focused ? "0 0 0 3px rgba(192,57,43,0.12)" : "none",
      }}
      placeholder={placeholder} type={type}
      value={value} onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    />
  );
}

// Small inline CapCare mushroom logo
function CapCareIcon() {
  return (
    <svg viewBox="0 0 80 72" width="64" height="64" style={{ marginBottom: 6 }}>
      <path d="M8 52 Q7 34 16 22 Q25 12 40 10 Q55 12 64 22 Q73 34 72 52 Q56 58 40 59 Q24 58 8 52Z"
        fill="#c0392b" stroke="#8b1a1a" strokeWidth="2"/>
      <ellipse cx="40" cy="30" rx="10" ry="9" fill="white" opacity="0.9"/>
      <ellipse cx="24" cy="38" rx="7"  ry="6" fill="white" opacity="0.82"/>
      <ellipse cx="57" cy="37" rx="7"  ry="6" fill="white" opacity="0.82"/>
      <path d="M18 54 C17 65 40 68 40 68 C40 68 63 65 62 54 C58 57 40 58 40 58 C40 58 22 57 18 54Z"
        fill="#f0e0c8" stroke="#c9aa7c" strokeWidth="1.5"/>
    </svg>
  );
}

export default function LoginScreen({ onBack, onSuccess }: Props) {
  const [phone,    setPhone   ] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      className="size-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(160deg,#fff8f5 0%,#fde8e0 55%,#f8d8cc 100%)",
        fontFamily: "'Fredoka One', cursive",
        padding: "0 32px",
      }}
    >
      {/* Brand */}
      <div style={{ marginBottom: 36, textAlign: "center", animation: "slideUp 0.55s ease both" }}>
        <CapCareIcon/>
        <div style={{ fontSize: "2.3rem", color: "#c0392b", lineHeight: 1, letterSpacing: "-0.01em" }}>
          CapCare<sup style={{ fontSize: "1.1rem", verticalAlign: "super" }}>+</sup>
        </div>
        <div style={{ fontSize: "1rem", color: "#9a5040", marginTop: 5 }}>Welcome back</div>
      </div>

      {/* Form */}
      <div
        style={{
          width: "100%", maxWidth: 340,
          display: "flex", flexDirection: "column", gap: 14,
          animation: "slideUp 0.55s 0.08s ease both",
        }}
      >
        {/* Phone number with country code prefix */}
        <div style={{ position: "relative", display: "flex", gap: 0 }}>
          <div style={{
            padding: "14px 14px", borderRadius: "14px 0 0 14px",
            border: "2px solid rgba(192,57,43,0.22)", borderRight: "none",
            background: "rgba(255,255,255,0.72)",
            fontFamily: "'Fredoka One', cursive", fontSize: "1.05rem", color: "#9a5040",
            whiteSpace: "nowrap", flexShrink: 0, userSelect: "none",
          }}>
            +91
          </div>
          <input
            style={{
              ...inputStyle,
              borderRadius: "0 14px 14px 0",
              flex: 1,
            }}
            placeholder="Phone number"
            type="tel" inputMode="numeric"
            value={phone} onChange={e => setPhone(e.target.value)}
          />
        </div>

        <Field placeholder="Password" type="password" value={password} onChange={setPassword}/>

        <div style={{
          textAlign: "right", marginTop: -6,
          fontFamily: "'Fredoka One', cursive", fontSize: "0.88rem",
          color: "rgba(154,80,64,0.75)", cursor: "pointer",
        }}>
          Forgot password?
        </div>

        <button
          style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: "#c0392b", color: "white",
            fontFamily: "'Fredoka One', cursive", fontSize: "1.15rem",
            cursor: "pointer", marginTop: 2,
            boxShadow: "0 4px 16px rgba(192,57,43,0.28)",
            transition: "background 0.15s ease, transform 0.12s ease",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={e => { e.currentTarget.style.transform = ""; onSuccess(); }}
        >
          Log In
        </button>

        <button
          onClick={onBack}
          style={{
            width: "100%", padding: "13px", borderRadius: 14,
            border: "2px solid rgba(192,57,43,0.28)", background: "transparent",
            color: "#c0392b", fontFamily: "'Fredoka One', cursive",
            fontSize: "1rem", cursor: "pointer",
            transition: "background 0.15s ease",
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
