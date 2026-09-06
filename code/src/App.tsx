import { useCallback, useState } from "react";
import SplashScreen          from "./SplashScreen";
import OnboardingScreen      from "./OnboardingScreen";
import LoginScreen           from "./LoginScreen";
import SignupScreen          from "./SignupScreen";
import SuccessScreen         from "./SuccessScreen";
import OnboardingGuideScreen from "./OnboardingGuideScreen";
import HubScreen             from "./HubScreen";
import AllergyScreen         from "./AllergyScreen";
import FeedScreen            from "./FeedScreen";
import SymptomScreen         from "./SymptomScreen";

// ── Flow ─────────────────────────────────────────────────────────────────────
// splash → onboarding (forest intro / swipe-to-auth)
// → login | signup → success → guide (mascot intro) → hub (nav carousel)
// hub → allergy | feed | symptom → hub
type Screen =
  | "splash" | "onboarding" | "login" | "signup"
  | "success" | "guide" | "hub"
  | "allergy" | "feed" | "symptom";

// Single-screen-at-a-time router: fade out → unmount old → mount new → fade in.
// Never mounts two screens simultaneously, so SplashScreen cannot double-play.
export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [fading, setFading] = useState(false);

  const navigate = useCallback((to: Screen) => {
    setFading(true);
    setTimeout(() => {
      setScreen(to);
      requestAnimationFrame(() => requestAnimationFrame(() => setFading(false)));
    }, 680);
  }, []);

  return (
    <div className="size-full relative overflow-hidden bg-black">
      <div style={{
        position: "absolute", inset: 0,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.68s ease",
        willChange: "opacity",
      }}>
        {screen === "splash"     && <SplashScreen onComplete={() => navigate("onboarding")}/>}
        {screen === "onboarding" && <OnboardingScreen onNavigate={navigate}/>}
        {screen === "login"      && <LoginScreen  onBack={() => navigate("onboarding")} onSuccess={() => navigate("success")}/>}
        {screen === "signup"     && <SignupScreen  onBack={() => navigate("onboarding")} onSuccess={() => navigate("success")}/>}
        {screen === "success"    && <SuccessScreen onComplete={() => navigate("guide")}/>}
        {screen === "guide"      && <OnboardingGuideScreen onComplete={() => navigate("hub")}/>}

        {/* ── Navigation hub (repurposed forest scene — ongoing home) ── */}
        {screen === "hub"        && <HubScreen onNavigate={navigate}/>}

        {/* ── Section screens ── */}
        {screen === "allergy"    && <AllergyScreen  onBack={() => navigate("hub")}/>}
        {screen === "feed"       && <FeedScreen      onBack={() => navigate("hub")}/>}
        {screen === "symptom"    && <SymptomScreen   onBack={() => navigate("hub")}/>}
      </div>
    </div>
  );
}
