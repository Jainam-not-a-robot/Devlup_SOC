import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, LogOut } from "lucide-react";

const AUTO_LOGOUT_SECONDS = 5;

const SessionExpiredPopup = () => {
  const { logout, isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_LOGOUT_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredRef = useRef(false);

  const doLogout = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
    setCountdown(AUTO_LOGOUT_SECONDS);
    hasTriggeredRef.current = false;
    logout();
  }, [logout]);

  useEffect(() => {
    const handleSessionExpired = () => {
      // Only show the popup if user is currently authenticated and popup isn't already shown
      if (!isAuthenticated || hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      setVisible(true);
      setCountdown(AUTO_LOGOUT_SECONDS);

      // Start countdown
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Time's up — auto logout
            doLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    window.addEventListener("session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, doLogout]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300"
        style={{
          background: "rgba(15, 15, 15, 0.85)",
          border: "1px solid var(--terminal-window-border)",
          boxShadow:
            "0 0 40px rgba(0, 0, 0, 0.5), 0 0 15px var(--accent-glow)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Pulsing warning icon */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "2px solid rgba(239, 68, 68, 0.4)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </div>

        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--terminal-text)" }}
        >
          Session Expired
        </h2>

        <p
          className="text-sm leading-relaxed max-w-xs mx-auto"
          style={{ color: "var(--terminal-dim)" }}
        >
          Your Google sign-in token has expired. Please sign in again to
          continue.
        </p>

        {/* Countdown badge */}
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "rgba(239, 68, 68, 0.9)",
            }}
          >
            Auto sign-out in {countdown}s
          </span>
        </div>

        {/* Sign out button */}
        <button
          onClick={doLogout}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
          style={{
            background: "var(--accent-color)",
            color: "black",
            boxShadow: "0 0 12px var(--accent-glow)",
          }}
        >
          <LogOut size={16} />
          Sign Out Now
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredPopup;
