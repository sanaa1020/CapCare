import React, { useEffect, useRef, useState } from "react";

interface Props { onBack: () => void; onSuccess: () => void; }

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 18px", borderRadius: 14,
  border: "2px solid rgba(192,57,43,0.22)", outline: "none",
  fontFamily: "'Fredoka One', cursive", fontSize: "1.05rem",
  background: "rgba(255,255,255,0.72)", color: "#3a1810",
  boxSizing: "border-box",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
};

function FocusInput({ placeholder, type = "text", value, onChange }: {
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

// ── Step indicators ──────────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          height: 6, borderRadius: 3,
          width: step === n ? 24 : 8,
          background: step >= n ? "#c0392b" : "rgba(192,57,43,0.20)",
          transition: "width 0.3s ease, background 0.3s ease",
        }}/>
      ))}
    </div>
  );
}

// ── OTP input: 6 individual digit boxes ─────────────────────────────────────
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          style={{
            width: 44, height: 52, textAlign: "center", borderRadius: 12,
            border: `2px solid ${digit ? "#c0392b" : "rgba(192,57,43,0.22)"}`,
            fontFamily: "'Fredoka One', cursive", fontSize: "1.4rem",
            color: "#3a1810", background: "rgba(255,255,255,0.72)",
            outline: "none", boxSizing: "border-box",
            boxShadow: digit ? "0 0 0 3px rgba(192,57,43,0.10)" : "none",
            transition: "border-color 0.18s ease, box-shadow 0.18s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Resend timer ─────────────────────────────────────────────────────────────
function ResendTimer({ onResend }: { onResend: () => void }) {
  const [seconds, setSeconds] = useState(30);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "center", fontFamily: "'Fredoka One', cursive", fontSize: "0.9rem" }}>
      {seconds > 0 ? (
        <span style={{ color: "rgba(154,80,64,0.60)" }}>Resend code in {seconds}s</span>
      ) : (
        <span
          style={{ color: "#c0392b", cursor: "pointer" }}
          onClick={onResend}
        >
          Resend code
        </span>
      )}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function SignupScreen({ onBack, onSuccess }: Props) {
  const [step,     setStep    ] = useState(1);
  const [phone,    setPhone   ] = useState("");
  const [otp,      setOtp     ] = useState(["","","","","",""]);
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm ] = useState("");
  const [otpKey,   setOtpKey  ] = useState(0);

  const btnLabel = step === 1 ? "Send OTP" : step === 2 ? "Verify" : "Create Account";

  const handleNext = () => {
    if (step < 3) { setStep(s => s + 1); return; }
    onSuccess();
  };

  const stepTitles = ["Enter phone number", "Verify your number", "Create a password"];
  const stepSubs   = [
    "We'll send a one-time code",
    `Code sent to +91 ${phone}`,
    "Choose a strong password",
  ];

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
      <div style={{ marginBottom: 28, textAlign: "center", animation: "slideUp 0.5s ease both" }}>
        <CapCareIcon/>
        <div style={{ fontSize: "2.3rem", color: "#c0392b", lineHeight: 1, letterSpacing: "-0.01em" }}>
          CapCare<sup style={{ fontSize: "1.1rem", verticalAlign: "super" }}>+</sup>
        </div>
      </div>

      {/* Step content card */}
      <div
        key={step}
        style={{
          width: "100%", maxWidth: 340,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          animation: "slideUp 0.4s ease both",
        }}
      >
        <StepDots step={step}/>

        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: "1.4rem", color: "#3a1810", lineHeight: 1.2 }}>
            {stepTitles[step - 1]}
          </div>
          <div style={{ fontSize: "0.9rem", color: "rgba(154,80,64,0.75)", marginTop: 4 }}>
            {stepSubs[step - 1]}
          </div>
        </div>

        {/* Step 1: Phone */}
        {step === 1 && (
          <div style={{ width: "100%", display: "flex", gap: 0 }}>
            <div style={{
              padding: "14px 14px", borderRadius: "14px 0 0 14px",
              border: "2px solid rgba(192,57,43,0.22)", borderRight: "none",
              background: "rgba(255,255,255,0.72)",
              fontFamily: "'Fredoka One', cursive", fontSize: "1.05rem",
              color: "#9a5040", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              +91
            </div>
            <input
              style={{ ...inputStyle, borderRadius: "0 14px 14px 0", flex: 1 }}
              placeholder="Phone number"
              type="tel" inputMode="numeric"
              value={phone} onChange={e => setPhone(e.target.value)}
            />
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <>
            <OtpInput key={otpKey} value={otp} onChange={setOtp}/>
            <ResendTimer key={`timer-${otpKey}`} onResend={() => { setOtp(["","","","","",""]); setOtpKey(k => k+1); }}/>
          </>
        )}

        {/* Step 3: Password */}
        {step === 3 && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            <FocusInput placeholder="Password" type="password" value={password} onChange={setPassword}/>
            <FocusInput placeholder="Confirm password" type="password" value={confirm} onChange={setConfirm}/>
            {confirm && password !== confirm && (
              <div style={{ fontSize: "0.85rem", color: "#c0392b", marginTop: -6 }}>
                Passwords don't match
              </div>
            )}
          </div>
        )}

        {/* Primary CTA */}
        <button
          style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: "#c0392b", color: "white",
            fontFamily: "'Fredoka One', cursive", fontSize: "1.15rem",
            cursor: "pointer", marginTop: 2,
            boxShadow: "0 4px 16px rgba(192,57,43,0.28)",
            transition: "transform 0.12s ease",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={e => { e.currentTarget.style.transform = ""; handleNext(); }}
        >
          {btnLabel}
        </button>

        {/* Back */}
        <button
          onClick={step === 1 ? onBack : () => setStep(s => s - 1)}
          style={{
            width: "100%", padding: "13px", borderRadius: 14,
            border: "2px solid rgba(192,57,43,0.28)", background: "transparent",
            color: "#c0392b", fontFamily: "'Fredoka One', cursive",
            fontSize: "1rem", cursor: "pointer",
          }}
        >
          ← {step === 1 ? "Back" : "Previous step"}
        </button>
      </div>
    </div>
  );
}
