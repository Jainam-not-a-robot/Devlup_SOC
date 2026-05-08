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
}: EntryInstructionHUDProps) {
  const [displayHint, setDisplayHint] = useState<EntryInstructionHint | null>(activeHint);
  const activeSections = isMobile ? mobileInstructionSections : instructionSections;

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
                Drag left side to walk
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
        className={`entry-hud-panel ${controlsVisible ? "is-visible" : ""}`}
        aria-hidden={!controlsVisible}
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
    </div>
  );
}
