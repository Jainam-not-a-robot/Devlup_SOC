// src/components/LeavesEffect.tsx

const leaves = Array.from({ length: 18 });

export default function LeavesEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {leaves.map((_, i) => {
        const left = Math.random() * 100;
        const duration = 12 + Math.random() * 8;
        const delay = Math.random() * 8;
        const size = 18 + Math.random() * 16;

        return (
          <svg
            key={i}
            className="single-leaf"
            viewBox="0 0 80 80"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          >
            <defs>
              <linearGradient
                id={`leafGradient-${i}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FFD166" />
                <stop offset="45%" stopColor="#F4A261" />
                <stop offset="100%" stopColor="#BC6C25" />
              </linearGradient>
            </defs>

            {/* MAIN LEAF SHAPE */}
            <path
              d="
                M40 1

                C28 8 18 18 15 32
                C12 46 18 60 32 68

                C36 70 42 70 48 66

                C60 58 67 44 64 30
                C61 18 52 8 40 4

                Z
              "
              fill={`url(#leafGradient-${i})`}
              stroke="#8A4B22"
              strokeWidth="2"
            />

            {/* STEM */}
            <path
              d="M39 56 C42 64 46 72 50 78"
              stroke="#6B4423"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* CENTER VEIN */}
            <path
              d="
                M40 1
                C39 24 38 40 40 58
              "
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.3"
              fill="none"
            />

            {/* LEFT VEINS */}
            <path
              d="M30 22 L40 28"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="1"
            />

            <path
              d="M26 36 L40 40"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />

            <path
              d="M31 50 L40 52"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />

            {/* RIGHT VEINS */}
            <path
              d="M50 22 L40 28"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="1"
            />

            <path
              d="M54 36 L40 40"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />

            <path
              d="M49 50 L40 52"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
          </svg>
        );
      })}
    </div>
  );
}