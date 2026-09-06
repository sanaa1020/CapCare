import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "running" | "winking" | "capcare" | "plus" | "smile" | "done";

const WORD        = ["C", "a", "p", "C", "a", "r", "e"] as const;
const LEFT_C      = 0;
const RIGHT_C     = 3;
const INNER_ORDER = [1, 2, 4, 5, 6];

interface Props { onComplete: () => void; }

export default function SplashScreen({ onComplete }: Props) {
  const [phase,          setPhase         ] = useState<Phase>("idle");
  const [bgCream,        setBgCream       ] = useState(false);
  const [winkRight,      setWinkRight     ] = useState(false);
  const [cFlying,        setCFlying       ] = useState(false);
  const [cArrived,       setCArrived      ] = useState(false);
  const [innerShown,     setInnerShown    ] = useState<Set<number>>(new Set());
  const [plusVisible,    setPlusVisible   ] = useState(false);
  const [hopActive,      setHopActive     ] = useState(false);
  const [happyEyes,      setHappyEyes     ] = useState(false);
  const [wideSmile,      setWideSmile     ] = useState(false);
  const staggerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep a ref so the one-time effect always calls the latest onComplete
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setPhase("running"),  200));
    ts.push(setTimeout(() => setBgCream(true),     1000));
    ts.push(setTimeout(() => setPhase("winking"),  2200));
    ts.push(setTimeout(() => {
      setWinkRight(true);
      setTimeout(() => setWinkRight(false), 260);
    }, 2380));
    ts.push(setTimeout(() => { setPhase("capcare"); setCFlying(true); }, 2950));
    ts.push(setTimeout(() => {
      setCArrived(true);
      INNER_ORDER.forEach((idx, i) => {
        const t = setTimeout(() => setInnerShown(prev => new Set([...prev, idx])), i * 80);
        staggerRefs.current.push(t);
      });
    }, 3330));
    ts.push(setTimeout(() => { setPhase("plus"); setPlusVisible(true); }, 4050));
    ts.push(setTimeout(() => {
      setPhase("smile");
      setHopActive(true); setHappyEyes(true); setWideSmile(true);
      setTimeout(() => setHopActive(false), 800);
    }, 4800));
    ts.push(setTimeout(() => { setPhase("done"); onCompleteRef.current(); }, 5600));
    return () => {
      ts.forEach(clearTimeout);
      staggerRefs.current.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capAnimating = phase !== "idle";

  return (
    <div
      className="size-full flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: bgCream ? "rgba(255,252,248,0.95)" : "#c0392b",
        transition: bgCream ? "background-color 0.65s ease" : "none",
        fontFamily: "'Fredoka One', cursive",
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: 0 }}>
        <svg
          viewBox="0 0 160 170"
          width="220" height="220"
          style={{
            overflow: "visible",
            animation: hopActive ? "joyHop 0.8s ease-out forwards" : "none",
          }}
        >
          <g>
            <path d="M58 112 C56 132 53 150 53 160 Q53 167 80 167 Q107 167 107 160 C107 150 104 132 102 112 Z"
              fill="#f2e8d6" stroke="#c9aa7c" strokeWidth="2.5"/>
            <path d="M48 112 Q80 122 112 112" fill="none" stroke="#c9aa7c" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="63" cy="146" rx="8" ry="5.5" fill="#f4a0a0" opacity="0.45"/>
            <ellipse cx="97" cy="146" rx="8" ry="5.5" fill="#f4a0a0" opacity="0.45"/>
            {happyEyes ? (
              <path d="M61 139 Q67 133 73 139" stroke="#2a1a0a" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
            ) : (
              <><ellipse cx="67" cy="140" rx="5.5" ry="6" fill="#2a1a0a"/>
                <ellipse cx="69" cy="138" rx="1.8" ry="1.8" fill="white"/></>
            )}
            {happyEyes ? (
              <path d="M87 139 Q93 133 99 139" stroke="#2a1a0a" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
            ) : winkRight ? (
              <path d="M87 140 Q93 135 99 140" stroke="#2a1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            ) : (
              <><ellipse cx="93" cy="140" rx="5.5" ry="6" fill="#2a1a0a"/>
                <ellipse cx="95" cy="138" rx="1.8" ry="1.8" fill="white"/></>
            )}
            {wideSmile ? (
              <path d="M65 151 Q80 164 95 151" stroke="#2a1a0a" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
            ) : (
              <path d="M71 152 Q80 159 89 152" stroke="#2a1a0a" strokeWidth="2" fill="none" strokeLinecap="round"/>
            )}
          </g>
          <g style={{ transformBox: "fill-box", transformOrigin: "center",
              animation: capAnimating ? "capFullSequence 1.8s forwards" : "none" }}>
            <ellipse cx="80" cy="110" rx="46" ry="8" fill="rgba(0,0,0,0.07)"/>
            <path d="M26 106 Q24 72 50 52 Q63 42 80 40 Q97 42 110 52 Q136 72 134 106 Q107 116 80 117 Q53 116 26 106Z"
              fill="#c0392b" stroke="#8b1a1a" strokeWidth="2.5"/>
            <path d="M52 56 Q67 46 90 48 Q108 52 118 66"
              stroke="rgba(255,255,255,0.28)" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <ellipse cx="80"  cy="64" rx="12.5" ry="11.5" fill="white" opacity="0.93"/>
            <ellipse cx="53"  cy="79" rx="8.5"  ry="8"    fill="white" opacity="0.88"/>
            <ellipse cx="108" cy="77" rx="8.5"  ry="8"    fill="white" opacity="0.88"/>
            <ellipse cx="66"  cy="97" rx="6.5"  ry="6"    fill="white" opacity="0.82"/>
            <ellipse cx="96"  cy="95" rx="6"    ry="5.5"  fill="white" opacity="0.82"/>
            <ellipse cx="124" cy="95" rx="4.5"  ry="4"    fill="white" opacity="0.7" />
            <ellipse cx="38"  cy="95" rx="4.5"  ry="4"    fill="white" opacity="0.7" />
          </g>
          {(phase === "plus" || phase === "smile" || phase === "done") && (
            <><text x="133" y="64" fontSize="15" fill="#c0392b" opacity="0.65">✦</text>
              <text x="14"  y="82" fontSize="11" fill="#c0392b" opacity="0.5" >✦</text></>
          )}
        </svg>

        {/* CapCare wordmark */}
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end",
            gap: 1, marginTop: -8, height: 60, opacity: cFlying ? 1 : 0 }}>
          {WORD.map((char, i) => {
            const isLeft  = i === LEFT_C;
            const isRight = i === RIGHT_C;
            const isInner = !isLeft && !isRight;
            const ready   = isInner && innerShown.has(i);
            return (
              <span key={i} style={{
                fontFamily: "'Fredoka One', cursive", fontSize: "2.9rem",
                color: "#c0392b", lineHeight: 1, display: "inline-block",
                textShadow: "2px 2px 0 rgba(100,10,10,0.16)",
                ...(isLeft || isRight ? {
                  transform: cArrived ? "translateX(0)" : isLeft ? "translateX(-190px)" : "translateX(190px)",
                  transition: "transform 0.38s cubic-bezier(0.34,1.56,0.64,1)",
                } : {}),
                ...(isInner ? {
                  opacity: ready ? 1 : 0,
                  transform: ready ? "scale(1) translateY(0)" : "scale(0.4) translateY(10px)",
                  transition: ready ? "opacity 0.22s ease-out, transform 0.34s cubic-bezier(0.34,1.56,0.64,1)" : "none",
                } : {}),
              }}>{char}</span>
            );
          })}
          <span style={{
            position: "absolute", right: -16, top: -4,
            fontFamily: "'Fredoka One', cursive", fontSize: "1.4rem",
            color: "#c0392b", lineHeight: 1, display: "inline-block",
            opacity: plusVisible ? 1 : 0,
            animation: plusVisible ? "plusDrop 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
            textShadow: "1px 1px 0 rgba(100,10,10,0.18)",
          }}>+</span>
        </div>
      </div>
    </div>
  );
}
