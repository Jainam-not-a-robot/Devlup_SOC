import React from "react";
import TerminalHeader from "../components/TerminalHeader";
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Rocket,
  Award,
  Flag,
  LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { getTheme } from "../config/themes";
import { useState, useEffect } from "react";
import { fetchTimelines } from "../services/apiClient";

// --- Types ---
interface TimelineMilestone {
  id: string;
  title: string;
  date: string;
  description: string;
  icon: LucideIcon;
  status?: "completed" | "ongoing" | "upcoming" | "tentative" | "na";
  endDate?: string;
}

interface ProgramTimeline {
  name: string;
  milestones: TimelineMilestone[];
}

const Timeline = () => {
  // --- Status Logic ---
  const calculateStatus = (
    date: string,
    endDate?: string
  ): "completed" | "ongoing" | "upcoming" | "tentative" | "na" => {
    if (date === "NA" || date === "Tentative") {
      return date === "Tentative" ? "tentative" : "na";
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (date.startsWith("Till ")) {
      const dateStr = date.replace("Till ", "").trim();
      const endDateParsed = parseDate(dateStr);
      if (endDateParsed) {
        if (now > endDateParsed) return "completed";
        const daysUntil = Math.ceil(
          (endDateParsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil >= 0 && daysUntil <= 30) return "ongoing";
        return "upcoming";
      }
    }
    // Simple fallback for other date formats in this demo
    return "upcoming";
  };

  const parseDate = (dateStr: string): Date | null => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      if(dateStr.includes("December")) return new Date(currentYear, 11, 20);
      if(dateStr.includes("January")) return new Date(currentYear + 1, 0, 5);
      if(dateStr.includes("March")) return new Date(currentYear + 1, 2, 15);
    } catch (e) {
      // Return null on parse error
    }
    return null;
  };

  // --- Data ---
  const [programs, setPrograms] = useState<ProgramTimeline[]>([
    { name: "Winter of Code", milestones: [] },
    { name: "Summer of Code", milestones: [] }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimelines = async () => {
      try {
        const data = await fetchTimelines();
        const formattedMilestones: TimelineMilestone[] = data.map((t: any) => ({
          id: t.time_id,
          title: t.timeline_topic,
          date: t.start_date,
          endDate: t.end_date,
          description: t.timeline_description,
          icon: FileText, 
        }));
        
        formattedMilestones.forEach(m => {
          m.status = calculateStatus(m.date, m.endDate);
        });

        const groupedPrograms: Record<string, TimelineMilestone[]> = {};
        data.forEach((t: any, index: number) => {
           const progName = t.program_name || 'Winter of Code';
           if (!groupedPrograms[progName]) {
              groupedPrograms[progName] = [];
           }
           groupedPrograms[progName].push(formattedMilestones[index]);
        });
        
        let newPrograms = Object.entries(groupedPrograms).map(([name, milestones]) => ({
           name, milestones
        }));
        
        if (newPrograms.length === 0) {
           newPrograms = [
             { name: "Winter of Code", milestones: [] },
             { name: "Summer of Code", milestones: [] }
           ];
        }

        setPrograms(newPrograms);
      } catch (error) {
        console.error("Failed to fetch timelines:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTimelines();
  }, []);

  const currentTheme = getTheme();
  const isWinter = currentTheme === 1;

  // --- Styles Helpers ---
  const getStatusColor = (status: string) => {
    // All nodes have the same base color
    const baseColor = isWinter 
      ? "text-cyan-300 border-cyan-400/50 bg-cyan-950/30"
      : "text-green-400 border-green-500/30 bg-green-900/30";
    
    // Only ongoing nodes get a subtle highlight
    if (status === 'ongoing') {
      return isWinter
        ? `${baseColor} shadow-[0_0_20px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/50`
        : `${baseColor} shadow-[0_0_20px_rgba(74,222,128,0.4)] ring-2 ring-green-400/50`;
    }
    
    return baseColor;
  };

  const getTraceColor = (status: string) => {
       if (isWinter) {
           if(status === 'completed') return "#60a5fa"; 
           if(status === 'ongoing') return "#22d3ee"; 
           return "#4b5563"; 
       }
       return "#4ade80"; 
  }

  return (
    <div className="min-h-screen bg-terminal/95 flex flex-col items-center p-2 sm:p-4 overflow-x-hidden">
      <div className="terminal-window max-w-[100rem] w-full mx-auto my-4 sm:my-8">
        <TerminalHeader title="Program Timeline" />
        <div className="terminal-body min-h-[600px] p-4 sm:p-6 scrollbar-hide relative">
          
            {loading && <p className="text-terminal-dim text-center py-4">Loading timeline...</p>}
            {!loading && (
              <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-12">
              <div className="p-2 bg-terminal-accent/10 rounded-lg">
                <Calendar className="text-terminal-accent w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-terminal-text">
                  Program Timeline
                </h1>
              </div>
            </div>

            {programs.map((program, programIndex) => (
              <div key={programIndex} className="mb-20">
                <h2 className="text-2xl sm:text-3xl font-bold text-terminal-text mb-8 ml-4">
                    {program.name}
                </h2>
                
                {/* CHECK: If milestones are empty, show Coming Soon */}
                {program.milestones.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-20   rounded-xl bg-terminal-dim/5"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="mb-6"
                      >
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 
                           ${isWinter ? "bg-cyan-950/30 border-cyan-500/30 text-cyan-400" : "bg-green-950/30 border-green-500/30 text-green-400"}`}
                        >
                          <Calendar size={40} />
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold text-terminal-text mb-2">
                        Coming Soon
                      </h3>
                      <p className="text-terminal-dim text-lg">
                        Timeline will be announced soon
                      </p>
                    </motion.div>
                ) : (
                    /* --- RENDER CIRCUIT TIMELINE (If milestones exist) --- */
                    <>
                        {/* Desktop View */}
                        <div className="hidden lg:block relative h-[600px] w-full px-16 lg:px-24 my-12">
                        
                            {/* Central Bus */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700/30 -translate-y-1/2 z-0">
                                {isWinter && <div className="absolute top-0 left-0 h-full w-full bg-cyan-500/20 blur-[4px]" />}
                                <div className={`absolute top-0 left-0 h-full w-full ${isWinter ? 'bg-cyan-900/50' : 'bg-green-900/50'}`} />
                            </div>

                            {/* Milestones */}
                            <div className="relative z-10 h-full w-full">
                                {program.milestones.map((milestone, index) => {
                                const totalItems = program.milestones.length;
                                // Cluster nodes more tightly: use 15% to 85% range instead of 0% to 100%
                                const leftPercentage = 15 + (index / (totalItems - 1)) * 70;
                                const isTop = index % 2 === 0;
                                const status = milestone.status || "upcoming";
                                const isActive = status === 'completed' || status === 'ongoing';
                                const traceColor = getTraceColor(status);
                                
                                const verticalReach = 100; 
                                const horizontalJog = 60;
                                
                                return (
                                    <div 
                                        key={milestone.id}
                                        className="absolute top-1/2" 
                                        style={{ left: `${leftPercentage}%` }}
                                    >
                                        <svg 
                                            className="absolute overflow-visible"
                                            style={{
                                                [isTop ? 'bottom' : 'top']: '0',
                                                left: isTop ? `-${horizontalJog}px` : '0px', 
                                                width: `${horizontalJog}px`,
                                                height: `${verticalReach}px`,
                                                filter: isActive && isWinter ? `drop-shadow(0 0 4px ${traceColor})` : 'none'
                                            }}
                                            viewBox={`0 0 ${horizontalJog} ${verticalReach}`}
                                        >
                                            <motion.path
                                                d={isTop 
                                                    ? `M ${horizontalJog},${verticalReach} L ${horizontalJog},${verticalReach/2} L 0,0` 
                                                    : `M 0,0 L 0,${verticalReach/2} L ${horizontalJog},${verticalReach}` 
                                                }
                                                fill="none"
                                                stroke={traceColor}
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0, opacity: 0.2 }}
                                                whileInView={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                            />
                                            <circle cx={isTop ? horizontalJog : 0} cy={isTop ? verticalReach : 0} r="4" fill={traceColor} />
                                        </svg>

                                        <div 
                                            className="absolute flex flex-col items-center"
                                            style={{
                                                [isTop ? 'bottom' : 'top']: `${verticalReach}px`,
                                                left: isTop ? `-${horizontalJog}px` : `${horizontalJog}px`,
                                                transform: 'translateX(-50%)', 
                                                width: '200px' 
                                            }}
                                        >
                                            <motion.div 
                                                initial={{ scale: 0, opacity: 0 }}
                                                whileInView={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: index * 0.2 + 0.3, type: "spring" }}
                                                className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold backdrop-blur-md z-20 mb-4
                                                    ${getStatusColor(status)}`}
                                            >
                                                {index + 1}
                                                <div className={`absolute ${isTop ? '-bottom-[6px]' : '-top-[6px]'} left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-current`} style={{ color: traceColor}}/>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: isTop ? -20 : 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.2 + 0.5 }}
                                                className={`relative p-4 rounded-xl border backdrop-blur-md text-center w-full
                                                    ${isWinter 
                                                        ? status === 'ongoing' 
                                                            ? "border-cyan-500/50 bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                                                            : "border-cyan-500/30 bg-cyan-950/30"
                                                        : status === 'ongoing'
                                                            ? "border-green-500/50 bg-green-950/40 shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                                                            : "border-green-500/30 bg-green-950/30"
                                                    }`}
                                            >
                                                <h4 className={`font-bold text-base mb-1 ${isWinter ? "text-cyan-100" : "text-green-100"}`}>
                                                    {milestone.title}
                                                </h4>
                                                <div className={`flex items-center justify-center gap-2 text-xs font-mono mb-2 ${isWinter ? "text-cyan-400" : "text-green-400"}`}>
                                                    <Clock size={12} />
                                                    {milestone.date}
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    {milestone.description}
                                                </p>
                                            </motion.div>
                                        </div>
                                    </div>
                                );
                                })}
                            </div>
                            <CircuitEnd position="left" isWinter={isWinter} />
                            <CircuitEnd position="right" isWinter={isWinter}/>
                        </div>
                        
                        {/* Mobile Fallback */}
                        <div className="lg:hidden space-y-6 pl-4">
                             {program.milestones.map((milestone, idx) => (
                                 <div key={milestone.id} className="text-terminal-dim">
                                    {/* Simple mobile view fallback code here */}
                                    <div className="flex gap-4 mb-6">
                                        <div className="mt-1"><div className="w-2 h-2 bg-terminal-accent rounded-full"/></div>
                                        <div>
                                            <h3 className="font-bold text-terminal-text">{milestone.title}</h3>
                                            <p className="text-sm text-terminal-dim">{milestone.date}</p>
                                        </div>
                                    </div>
                                 </div>
                             ))}
                        </div>
                    </>
                )}
              </div>
            ))}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

const CircuitEnd = ({ position, isWinter }: { position: 'left' | 'right', isWinter: boolean }) => {
    const isLeft = position === 'left';
    const color = isWinter ? '#22d3ee' : '#4ade80';
    return (
        <svg 
            className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'left-2' : 'right-2'} w-16 h-24 opacity-60 pointer-events-none z-0`}
            viewBox="0 0 64 96"
            style={{ filter: isWinter ? `drop-shadow(0 0 2px ${color})` : 'none' }}
        >
            <path 
                d={isLeft 
                    ? "M 64,48 L 48,48 L 32,32 L 0,32 M 48,48 L 32,64 L 0,64" 
                    : "M 0,48 L 16,48 L 32,32 L 64,32 M 16,48 L 32,64 L 64,64"
                }
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx={isLeft ? "0" : "64"} cy="32" r="3" fill={color} />
            <circle cx={isLeft ? "0" : "64"} cy="64" r="3" fill={color} />
        </svg>
    );
}

export default Timeline;