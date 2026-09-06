import { CSSProperties, useState } from "react";

interface Props { onComplete: () => void; }

// ── Mascot SVG ───────────────────────────────────────────────────────────────
// Chibi mushroom: compact rounded white blob body, red dome cap with large
// white polka dots, tiny dot eyes, pink blush, small nub arms, two feet,
// and a bold green medical cross above a thin stick (matches reference image).
function MascotSVG({ size = 130 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 140 158"
      width={size}
      height={Math.round(size * 158 / 140)}
      style={{ display: "block" }}
    >
      {/* Thin stick from right arm up to cross */}
      <line x1="95" y1="88" x2="72" y2="38"
        stroke="#8a6030" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Bold green medical cross — two overlapping rects */}
      <rect x="58" y="5"  width="18" height="42" rx="4" fill="#258a42" stroke="#1a6030" strokeWidth="1.5"/>
      <rect x="46" y="17" width="42" height="18" rx="4" fill="#258a42" stroke="#1a6030" strokeWidth="1.5"/>
      {/* Cross highlight */}
      <path d="M60 8 Q67 6 74 9" stroke="rgba(255,255,255,0.28)" strokeWidth="3" fill="none" strokeLinecap="round"/>

      {/* Body — rounded white blob */}
      <ellipse cx="65" cy="96" rx="34" ry="38"
        fill="white" stroke="rgba(200,178,155,0.45)" strokeWidth="1.5"/>
      {/* Subtle right-side shading for roundness */}
      <ellipse cx="82" cy="96" rx="18" ry="32" fill="rgba(170,148,128,0.08)"/>

      {/* Left arm nub */}
      <ellipse cx="33" cy="91" rx="9" ry="7"
        fill="white" stroke="rgba(200,178,155,0.45)" strokeWidth="1.2"
        transform="rotate(14 33 91)"/>
      {/* Right arm nub — holds stick */}
      <ellipse cx="97" cy="88" rx="9.5" ry="7"
        fill="white" stroke="rgba(200,178,155,0.45)" strokeWidth="1.2"
        transform="rotate(-14 97 88)"/>

      {/* Cap — bright red dome, wider than body */}
      <path d="M21 64 Q19 38 36 25 Q50 15 65 13 Q80 15 94 25 Q111 38 109 64 Q88 72 65 73 Q42 72 21 64Z"
        fill="#cc2828" stroke="#8a1010" strokeWidth="1.5"/>
      {/* Cap specular */}
      <path d="M32 28 Q46 19 66 17 Q78 19 88 28"
        stroke="rgba(255,255,255,0.30)" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Polka dots */}
      <circle cx="65" cy="35" r="9.5" fill="white" opacity="0.92"/>
      <circle cx="40" cy="53" r="6.5" fill="white" opacity="0.88"/>
      <circle cx="90" cy="51" r="6.5" fill="white" opacity="0.88"/>
      {/* Gill line where cap meets body */}
      <path d="M21 64 Q65 77 109 64"
        fill="none" stroke="#a87848" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Eyes */}
      <circle cx="54" cy="84" r="4.2" fill="#2a1a0a"/>
      <circle cx="76" cy="84" r="4.2" fill="#2a1a0a"/>
      <circle cx="55.5" cy="82.5" r="1.5" fill="white"/>
      <circle cx="77.5" cy="82.5" r="1.5" fill="white"/>

      {/* Blush cheeks */}
      <ellipse cx="42" cy="92" rx="9"  ry="5.5" fill="#ffb3ba" opacity="0.46"/>
      <ellipse cx="88" cy="92" rx="9"  ry="5.5" fill="#ffb3ba" opacity="0.46"/>

      {/* Smile */}
      <path d="M54 99 Q65 109 76 99"
        stroke="#2a1a0a" strokeWidth="2.2" fill="none" strokeLinecap="round"/>

      {/* Feet */}
      <ellipse cx="50" cy="133" rx="12" ry="6.5"
        fill="white" stroke="rgba(200,178,155,0.45)" strokeWidth="1.2"/>
      <ellipse cx="80" cy="133" rx="12" ry="6.5"
        fill="white" stroke="rgba(200,178,155,0.45)" strokeWidth="1.2"/>
    </svg>
  );
}

const inputBase: CSSProperties = {
  width: "100%", padding: "13px 18px", borderRadius: 14,
  border: "2px solid rgba(192,57,43,0.22)", outline: "none",
  fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "1.05rem", fontWeight: 400,
  background: "rgba(255,255,255,0.72)", color: "#3a1810",
  boxSizing: "border-box",
};

function LabeledInput({
  label, placeholder, type = "text", value, onChange,
}: {
  label: string; placeholder: string; type?: string;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontFamily: "Outfit, Helvetica, sans-serif", fontSize: "0.82rem", color: "#9a5040", marginBottom: 5, paddingLeft: 4 }}>
        {label}
      </div>
      <input
        style={inputBase} type={type} placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)}
        inputMode={type === "number" ? "numeric" : "text"}
      />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingGuideScreen({ onComplete }: Props) {
  const [step,   setStep  ] = useState(0);
  const [name,   setName  ] = useState("");
  const [age,    setAge   ] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const step0Valid = name.trim().length > 0;
  const step1Valid = age.trim() && weight.trim() && height.trim();
  const isValid    = step === 0 ? step0Valid : step1Valid;

  const handleContinue = () => {
    if (!isValid) return;
    if (step === 0) {
      setStep(1);
    } else {
      localStorage.setItem("cc_user_name", name.trim());
      if (age.trim())    localStorage.setItem("cc_age",    age.trim());
      if (weight.trim()) localStorage.setItem("cc_weight", weight.trim());
      if (height.trim()) localStorage.setItem("cc_height", height.trim());
      onComplete();
    }
  };

  const questions = [
    "First off, what should I call you?",
    "Please enter your personal details",
  ];

  return (
    <div
      className="size-full flex flex-col items-center overflow-y-auto"
      style={{
        background: "linear-gradient(160deg,#fff8f5 0%,#fde8e0 55%,#f8d8cc 100%)",
        fontFamily: "Outfit, Helvetica, sans-serif",
        padding: "52px 32px 40px",
      }}
    >
      {/* ── Mascot — stays at the same position across both steps ── */}
      <MascotSVG size={128}/>

      {/* ── Speech bubble ── */}
      <div style={{
        marginTop: 10,
        background: "white",
        borderRadius: 20,
        padding: "15px 22px",
        maxWidth: 280,
        textAlign: "center",
        position: "relative",
        boxShadow: "0 4px 20px rgba(192,57,43,0.14)",
        fontFamily: "Lora, Georgia, serif",
        fontSize: "1.08rem",
        color: "#3a1810",
        lineHeight: 1.50,
        transition: "opacity 0.3s ease",
      }}>
        {/* Pointer arrow pointing UP toward the mascot */}
        <div style={{
          position: "absolute", top: -10, left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderBottom: "10px solid white",
        }}/>
        {questions[step]}
      </div>

      {/* ── Step content — key forces re-mount + slideUp animation ── */}
      <div
        key={step}
        style={{
          width: "100%", maxWidth: 340, marginTop: 26,
          display: "flex", flexDirection: "column", gap: 14,
          animation: "slideUp 0.42s ease both",
        }}
      >
        {step === 0 && (
          <input
            style={inputBase}
            placeholder="Your name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleContinue(); }}
          />
        )}

        {step === 1 && (
          <>
            <LabeledInput
              label="Age" placeholder="e.g. 25"
              type="number" value={age} onChange={setAge}
            />
            <LabeledInput
              label="Weight" placeholder="e.g. 68 kg"
              value={weight} onChange={setWeight}
            />
            <LabeledInput
              label="Height" placeholder="e.g. 170 cm"
              value={height} onChange={setHeight}
            />
          </>
        )}

        {/* Continue / Let's go button */}
        <button
          onClick={handleContinue}
          style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: isValid ? "#c0392b" : "rgba(192,57,43,0.30)",
            color: "white",
            fontFamily: "'Fredoka One', cursive", fontSize: "1.12rem",
            cursor: isValid ? "pointer" : "default", marginTop: 4,
            boxShadow: isValid ? "0 4px 16px rgba(192,57,43,0.28)" : "none",
            transition: "background 0.25s ease, box-shadow 0.25s ease",
          }}
        >
          {step === 0 ? "Continue →" : "Let's go! →"}
        </button>

        {/* Step progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 2 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              height: 6, borderRadius: 3,
              width: step === i ? 22 : 8,
              background: step >= i ? "#c0392b" : "rgba(192,57,43,0.20)",
              transition: "width 0.3s ease, background 0.3s ease",
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}
