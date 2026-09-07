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
import SettingsScreen        from "./SettingsScreen";
import TutorialOverlay       from "./TutorialOverlay";

type Screen =
  | "splash" | "onboarding" | "login" | "signup"
  | "success" | "guide" | "hub" | "settings"
  | "allergy" | "feed" | "symptom";

export type TutorialContext = "hub" | "allergy" | "feed" | "symptom";

export default function App() {
  // Persistent login: if cc_user_name already set, open straight to hub
  const [screen, setScreen] = useState<Screen>(() =>
    localStorage.getItem("cc_user_name") ? "hub" : "splash"
  );
  const [fading,       setFading      ] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutCtx,       setTutCtx      ] = useState<TutorialContext>("hub");
  const [firstTime,    setFirstTime   ] = useState(false);

  const navigate = useCallback((to: Screen) => {
    setFading(true);
    setTimeout(() => {
      setScreen(to);
      requestAnimationFrame(() => requestAnimationFrame(() => setFading(false)));
    }, 680);
  }, []);

  const triggerTutorial = (ctx: TutorialContext = "hub") => {
    setTutCtx(ctx);
    setTimeout(() => setShowTutorial(true), 800);
  };

  // Guide completed after signup → show hub tutorial
  const handleGuideComplete = () => {
    navigate("hub");
    triggerTutorial("hub");
  };

  // Signup → guide → hub (full onboarding flow)
  const handleSignupSuccess = () => {
    setFirstTime(true);
    navigate("success");
  };

  // Login → hub directly, never re-runs onboarding
  const handleLoginSuccess = () => {
    setFirstTime(false);
    navigate("hub");
  };

  // Logout → remove user name (clears persistent login) → splash
  const handleLogout = () => {
    localStorage.removeItem("cc_user_name");
    navigate("splash");
  };

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
        {screen === "login"      && <LoginScreen  onBack={() => navigate("onboarding")} onSuccess={handleLoginSuccess}/>}
        {screen === "signup"     && <SignupScreen  onBack={() => navigate("onboarding")} onSuccess={handleSignupSuccess}/>}
        {screen === "success"    && <SuccessScreen onComplete={() => navigate("guide")}/>}
        {screen === "guide"      && <OnboardingGuideScreen onComplete={handleGuideComplete}/>}
        {screen === "hub"        && (
          <HubScreen
            onNavigate={dest => {
              navigate(dest as Screen);
              // Per-screen tutorial on first visit — skip feed (item F9)
              if (dest !== "feed" && !localStorage.getItem(`cc_tut_${dest}`)) {
                localStorage.setItem(`cc_tut_${dest}`, "1");
                const ctx = dest as TutorialContext;
                setTimeout(() => { setTutCtx(ctx); setShowTutorial(true); }, 1200);
              }
            }}
            onSettings={() => navigate("settings")}
          />
        )}
        {screen === "settings"   && (
          <SettingsScreen
            onBack={() => navigate("hub")}
            onLogout={handleLogout}
            onShowTutorial={() => { navigate("hub"); triggerTutorial("hub"); }}
          />
        )}
        {screen === "allergy"    && <AllergyScreen  onBack={() => navigate("hub")}/>}
        {screen === "feed"       && (
          <FeedScreen
            onBack={() => navigate("hub")}
            firstTime={firstTime}
            onProfile={() => navigate("settings")}
          />
        )}
        {screen === "symptom"    && <SymptomScreen   onBack={() => navigate("hub")}/>}
      </div>

      {showTutorial && (
        <TutorialOverlay
          context={tutCtx}
          onDone={() => { setShowTutorial(false); localStorage.setItem("cc_tutorial_done", "1"); }}
        />
      )}
    </div>
  );
}
