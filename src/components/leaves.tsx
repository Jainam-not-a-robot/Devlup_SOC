const leafColors = [
  "#FF9F1C",
  "#FFD166",
  "#F4A261",
  "#E9C46A",
];

const leaves = Array.from({ length: 24 });

export default function LeavesEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {leaves.map((_, i) => {
        const size = 10 + Math.random() * 14;
        const left = Math.random() * 100;
        const duration = 10 + Math.random() * 12;
        const delay = Math.random() * 10;

        const color =
          leafColors[Math.floor(Math.random() * leafColors.length)];

        return (
          <div
            key={i}
            className="absolute animate-fall"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              top: "-40px",
              opacity: 0.75,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              filter: "drop-shadow(0 0 4px rgba(255,159,28,0.25))",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill={color}
              xmlns="http://www.w3.org/2000/svg"
              style={{
                width: "100%",
                height: "100%",
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              <path d="M12 2C8 6 4 10 4 15a8 8 0 0016 0c0-5-4-9-8-13z" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}