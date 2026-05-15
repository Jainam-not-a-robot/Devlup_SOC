import { useEffect, useState } from "react";
import {
  Armchair,
  Keyboard,
  Lightbulb,
  Monitor,
  MousePointerClick,
  Zap,
} from "lucide-react";

import { LiquidGlassCard } from "./ui/liquid-glass-card";
import "./EntryInstructionHUD.css";

export type EntryHintTone = "movement" | "interaction" | "action";
export type EntryHintIcon = "chair" | "click" | "lamp" | "monitor" | "spark" | "zap";

export type EntryInstructionHint = {
  id: string;
  label: string;
  message: string;
  keys?: string[];
  tone: EntryHintTone;
  icon: EntryHintIcon;
  details?: Array<{
    label: string;
    message: string;
    icon?: EntryHintIcon;
  }>;
};

export type EntryHintZone = EntryInstructionHint & {
  position: [number, number, number];
  range: number;
  priority?: number;
};

type EntryInstructionHUDProps = {
  controlsVisible: boolean;
  quickStartVisible: boolean;
  activeHint: EntryInstructionHint | null;
  statusToast: EntryInstructionHint | null;
  isMobile?: boolean;
  mobileRotationHintVisible?: boolean;
  mobileGuideVisible?: boolean;
};

type PlayerXZ = {
  x: number;
  z: number;
};

const iconMap = {
  chair: Armchair,
  click: MousePointerClick,
  lamp: Lightbulb,
  monitor: Monitor,
  spark: Zap,
  zap: Zap,
};

const instructionSections = [
  {
    id: "movement",
    title: "Movement",
    icon: Keyboard,
    tone: "movement",
    items: [
      { keys: ["W", "A", "S", "D"], label: "Move" },
      { keys: ["SHIFT"], label: "Sprint" },
      { keys: ["MOUSE"], label: "Look" },
    ],
  },
  {
    id: "interaction",
    title: "Interaction",
    icon: MousePointerClick,
    tone: "interaction",
    items: [
      { keys: ["CLICK"], label: "Lamp on/off" },
      { keys: ["CLICK"], label: "Monitor opens site" },
    ],
  },
  {
    id: "actions",
    title: "Actions",
    icon: Zap,
    tone: "action",
    items: [
      { keys: ["ENTER"], label: "Sit near chair" },
      { keys: ["CLICK"], label: "Activate center dot" },
      { keys: ["ESC"], label: "Unlock cursor" },
      { keys: ["H"], label: "Toggle guide" },
    ],
  },
] as const;

const mobileInstructionSections = [
  {
    id: "movement",
    title: "Movement",
    icon: Keyboard,
    tone: "movement" as const,
    items: [
      { keys: ["LEFT"], label: "Drag left side to move" },
      { keys: ["RIGHT"], label: "Drag right side to look" },
    ],
  },
  {
    id: "interaction",
    title: "Interaction",
    icon: MousePointerClick,
    tone: "interaction" as const,
    items: [
      { keys: ["TAP"], label: "Tap objects to interact" },
      { keys: ["TAP"], label: "Tap lamp / monitor" },
    ],
  },
  {
    id: "actions",
    title: "Actions",
    icon: Zap,
    tone: "action" as const,
    items: [
      { keys: ["TAP"], label: "Tap chair to sit" },
      { keys: ["2×TAP"], label: "Double-tap to stand" },
    ],
  },
] as const;

const mobileInstructionSectionsNormalized = [
  {
    id: "movement",
    title: "Movement",
    icon: Keyboard,
    tone: "movement" as const,
    items: [
      { keys: ["LEFT"], label: "Use joystick to move" },
      { keys: ["RIGHT"], label: "Drag right side to look" },
    ],
  },
  {
    id: "interaction",
    title: "Interaction",
    icon: MousePointerClick,
    tone: "interaction" as const,
    items: [
      { keys: ["TAP"], label: "Tap objects to interact" },
      { keys: ["TAP"], label: "Tap lamp / monitor" },
    ],
  },
  {
    id: "actions",
    title: "Actions",
    icon: Zap,
    tone: "action" as const,
    items: [
      { keys: ["TAP"], label: "Tap chair to sit" },
      { keys: ["2x", "TAP"], label: "Double-tap to stand" },
    ],
  },
] as const;

export function getNearestEntryHint(
  player: PlayerXZ,
  zones: EntryHintZone[],
): EntryInstructionHint | null {
  const nearest = zones.reduce<{
    zone: EntryHintZone;
    distanceSquared: number;
  } | null>((closest, zone) => {
    const deltaX = player.x - zone.position[0];
    const deltaZ = player.z - zone.position[2];
    const distanceSquared = deltaX * deltaX + deltaZ * deltaZ;
    const rangeSquared = zone.range * zone.range;

    if (distanceSquared > rangeSquared) return closest;

    if (!closest) {
      return { zone, distanceSquared };
    }

    const priorityDelta = (zone.priority ?? 0) - (closest.zone.priority ?? 0);
    if (priorityDelta > 0) {
      return { zone, distanceSquared };
    }

    if (priorityDelta === 0 && distanceSquared < closest.distanceSquared) {
      return { zone, distanceSquared };
    }

    return closest;
  }, null);

  if (!nearest) return null;

  const { position: _position, range: _range, priority: _priority, ...hint } = nearest.zone;
  return hint;
}

function KeyCap({ value }: { value: string }) {
  return <span className="entry-keycap">[{value}]</span>;
}

function HintIcon({ icon }: { icon: EntryHintIcon }) {
  const Icon = iconMap[icon];
  return <Icon aria-hidden="true" size={18} strokeWidth={2.4} />;
}

export default function EntryInstructionHUD({
  controlsVisible,
  quickStartVisible,
  activeHint,
  statusToast,
  isMobile = false,
  mobileRotationHintVisible = false,
  mobileGuideVisible = false,
}: EntryInstructionHUDProps) {
  const [displayHint, setDisplayHint] = useState<EntryInstructionHint | null>(activeHint);
  const activeSections = isMobile ? mobileInstructionSectionsNormalized : instructionSections;
  const panelVisible = controlsVisible;

  useEffect(() => {
    if (activeHint) {
      setDisplayHint(activeHint);
    }
  }, [activeHint]);

  return (
    <div className="entry-hud-layer">
      <LiquidGlassCard
        draggable={false}
        blurIntensity="lg"
        glowIntensity="xs"
        shadowIntensity="sm"
        borderRadius="16px"
        className={`entry-quick-card ${quickStartVisible ? "is-visible" : ""}`}
        aria-hidden={!quickStartVisible}
      >
        <div className="entry-quick-heading">
          <span className="entry-hud-eyebrow">Quick Start</span>
          <h2>Enter Room</h2>
        </div>
        <ol className="entry-quick-start">
          {isMobile ? (
            <>
              <li>
                <span>1</span>
                Use joystick to move
              </li>
              <li>
                <span>2</span>
                Drag right side to look
              </li>
              <li>
                <span>3</span>
                Tap objects to interact
              </li>
            </>
          ) : (
            <>
              <li>
                <span>1</span>
                Click to enter
              </li>
              <li>
                <span>2</span>
                Move with WASD
              </li>
              <li>
                <span>3</span>
                Interact with objects
              </li>
            </>
          )}
        </ol>
      </LiquidGlassCard>

      <LiquidGlassCard
        draggable={false}
        blurIntensity="lg"
        glowIntensity="xs"
        shadowIntensity="sm"
        borderRadius="16px"
        className={`entry-hud-panel ${panelVisible ? "is-visible" : ""}`}
        aria-hidden={!panelVisible}
      >
        <header className="entry-hud-header">
          <div>
            <span className="entry-hud-eyebrow">Guide</span>
            <h2>Entry Controls</h2>
          </div>
          <div className="entry-hud-toggle">
            <KeyCap value="H" />
            <span>{controlsVisible ? "Hide" : "Show"}</span>
          </div>
        </header>

        <div className="entry-hud-sections">
          {activeSections.map((section) => {
            const SectionIcon = section.icon;

            return (
              <div
                className={`entry-hud-section entry-hud-section--${section.tone}`}
                key={section.id}
              >
                <div className="entry-hud-section-title">
                  <SectionIcon aria-hidden="true" size={16} strokeWidth={2.4} />
                  <span>{section.title}</span>
                </div>
                <div className="entry-hud-command-list">
                  {section.items.map((item) => (
                    <div className="entry-hud-command" key={`${section.id}-${item.label}`}>
                      <div className="entry-hud-keys">
                        {item.keys.map((key) => (
                          <KeyCap key={key} value={key} />
                        ))}
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </LiquidGlassCard>

      {/* H‑key pill — desktop only */}
      {!isMobile && (
        <LiquidGlassCard
          draggable={false}
          blurIntensity="md"
          glowIntensity="xs"
          shadowIntensity="sm"
          borderRadius="999px"
          className={`entry-hud-mini ${controlsVisible ? "" : "is-visible"}`}
          aria-hidden={controlsVisible}
        >
          <KeyCap value="H" />
          <span>Help</span>
        </LiquidGlassCard>
      )}

      {statusToast && (
        <LiquidGlassCard
          draggable={false}
          blurIntensity="md"
          glowIntensity="xs"
          shadowIntensity="sm"
          borderRadius="14px"
          className={`entry-status-toast entry-status-toast--${statusToast.tone} is-active`}
          aria-live="polite"
        >
          <div className="entry-context-icon">
            <HintIcon icon={statusToast.icon} />
          </div>
          <div>
            <div className="entry-context-label">{statusToast.label}</div>
            <div className="entry-context-message">
              {statusToast.keys?.map((key) => (
                <KeyCap key={key} value={key} />
              ))}
              <span>{statusToast.message}</span>
            </div>
            {statusToast.details && (
              <div className="entry-status-details">
                {statusToast.details.map((detail) => (
                  <div className="entry-status-detail" key={detail.label}>
                    {detail.icon && <HintIcon icon={detail.icon} />}
                    <span>{detail.label}</span>
                    <strong>{detail.message}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </LiquidGlassCard>
      )}

      {displayHint && (
        <LiquidGlassCard
          draggable={false}
          blurIntensity="md"
          glowIntensity="xs"
          shadowIntensity="sm"
          borderRadius="14px"
          className={`entry-context-hint entry-context-hint--${displayHint.tone} ${
            activeHint ? "is-active" : ""
          }`}
          aria-hidden={!activeHint}
          aria-live="polite"
        >
          <div className="entry-context-icon">
            <HintIcon icon={displayHint.icon} />
          </div>
          <div>
            <div className="entry-context-label">{displayHint.label}</div>
            <div className="entry-context-message">
              {displayHint.keys?.map((key) => (
                <KeyCap key={key} value={key} />
              ))}
              <span>{displayHint.message}</span>
            </div>
          </div>
        </LiquidGlassCard>
      )}

      {/* Mobile Rotation Hint — 3 seconds */}
      {mobileRotationHintVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 1000,
            pointerEvents: "none",
            animation: "fade-in 0.3s ease-out",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#34d399",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📱</div>
            <h2 style={{ fontSize: "28px", marginBottom: "12px", fontWeight: 600 }}>
              Rotate Your Phone
            </h2>
            <p style={{ fontSize: "16px", opacity: 0.8 }}>
              Landscape mode for best experience
            </p>
          </div>
        </div>
      )}

      {/* Mobile Guide — 8 seconds full tutorial */}
      {mobileGuideVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            zIndex: 999,
            padding: "24px",
            overflowY: "auto",
            animation: "fade-in 0.3s ease-out",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1
              style={{
                color: "#34d399",
                fontSize: "32px",
                fontWeight: 700,
                marginBottom: "32px",
                textAlign: "center",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Welcome to the Entry Room
            </h1>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                color: "#e5e7eb",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {/* Movement */}
              <div
                style={{
                  padding: "16px",
                  borderLeft: "4px solid #34d399",
                  backgroundColor: "rgba(52, 211, 153, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ color: "#34d399", marginBottom: "8px", fontSize: "18px", fontWeight: 600 }}>
                  👆 Use Joystick to Move
                </h3>
                <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                  Use the on-screen joystick with your left thumb to move around and explore the room.
                </p>
              </div>

              {/* Look */}
              <div
                style={{
                  padding: "16px",
                  borderLeft: "4px solid #fbbf24",
                  backgroundColor: "rgba(251, 191, 36, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ color: "#fbbf24", marginBottom: "8px", fontSize: "18px", fontWeight: 600 }}>
                  👁️ Drag Right Side to Look
                </h3>
                <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                  Use your right thumb to look around and explore. Swipe to rotate the camera view.
                </p>
              </div>

              {/* Interact */}
              <div
                style={{
                  padding: "16px",
                  borderLeft: "4px solid #60a5fa",
                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ color: "#60a5fa", marginBottom: "8px", fontSize: "18px", fontWeight: 600 }}>
                  ✋ Tap to Interact
                </h3>
                <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                  Tap on objects like the lamp or monitor to interact with them. Tap the chair to sit down.
                </p>
              </div>

              {/* Double Tap */}
              <div
                style={{
                  padding: "16px",
                  borderLeft: "4px solid #f87171",
                  backgroundColor: "rgba(248, 113, 113, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ color: "#f87171", marginBottom: "8px", fontSize: "18px", fontWeight: 600 }}>
                  🚶 Double-Tap to Stand Up
                </h3>
                <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                  When seated, double-tap anywhere to stand back up and continue exploring.
                </p>
              </div>
            </div>

            <p
              style={{
                marginTop: "32px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "12px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              This guide will close automatically
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
