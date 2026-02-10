import React, { useMemo } from 'react';

// Helper function to generate random integer between min and max
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to generate random float between min and max
const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Generate a random snowflake configuration based on Cloud Four's approach
// Real snowflakes (stellar dendrites) always have 6-fold symmetry
const generateSnowflakeConfig = (seed: number) => {
  // Simple seeded random for consistency
  let seedValue = seed;
  const rng = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
  
  // Trunk length: reasonable size for snowflake (20-40)
  const trunkLength = Math.floor(rng() * 21) + 20;
  
  // Generate branches along the trunk
  const branches: Array<{ distance: number; length: number }> = [];
  for (let distance = Math.floor(rng() * 5) + 6; distance < trunkLength; distance += Math.floor(rng() * 9) + 2) {
    branches.push({
      distance,
      // Constrain branch length so they don't extend too far
      length: Math.floor(rng() * (Math.min(trunkLength - distance, 10) - 5 + 1)) + 5
    });
  }
  
  return { trunkLength, branches };
};

// Build complete snowflake SVG with 6-fold symmetry (following Cloud Four approach)
const buildSnowflakeSVG = (id: string, trunkLength: number, branches: Array<{ distance: number; length: number }>) => {
  const center = 50;
  
  // Build trunk line
  const trunk = { x1: center, y1: center, x2: center, y2: center - trunkLength };
  
  // Build branches (half tree - going left)
  const branchLines = branches.map((branch) => {
    const startY = center - branch.distance;
    return {
      x1: center,
      y1: startY,
      x2: center - branch.length,
      y2: startY - branch.length
    };
  });
  
  // Create 6 trees rotated around center (60 degrees each for 6-fold symmetry)
  const trees = [];
  for (let treeIndex = 0; treeIndex < 6; treeIndex++) {
    const rotation = treeIndex * 60;
    
    // Original half tree (left side)
    trees.push(
      <g key={`tree-${treeIndex}-left`} transform={`rotate(${rotation} ${center} ${center})`}>
        <line x1={trunk.x1} y1={trunk.y1} x2={trunk.x2} y2={trunk.y2} />
        {branchLines.map((branch, i) => (
          <line
            key={`branch-${i}`}
            x1={branch.x1}
            y1={branch.y1}
            x2={branch.x2}
            y2={branch.y2}
          />
        ))}
      </g>
    );
    
    // Flipped half tree (right side) - using scale transform
    trees.push(
      <g 
        key={`tree-${treeIndex}-right`} 
        transform={`rotate(${rotation} ${center} ${center}) scale(-1, 1) translate(-${center * 2}, 0)`}
      >
        <line x1={trunk.x1} y1={trunk.y1} x2={trunk.x2} y2={trunk.y2} />
        {branchLines.map((branch, i) => (
          <line
            key={`branch-flipped-${i}`}
            x1={branch.x1}
            y1={branch.y1}
            x2={branch.x2}
            y2={branch.y2}
          />
        ))}
      </g>
    );
  }
  
  return <g className="snowflake">{trees}</g>;
};

const SnowEffect: React.FC = () => {
  // Generate unique snowflakes for each instance
  const snowflakes = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => {
      const seed = Date.now() + i * 1000;
      const { trunkLength, branches } = generateSnowflakeConfig(seed);
      const size = randomInt(18, 32); // Bigger snowflakes: 18-32px
      const delay = 0; // Start immediately
      const duration = random(15, 25);
      const startX = random(0, 100);
      // Distribute snowflakes throughout viewport height so they appear immediately
      const startY = random(-100, 100);
      const opacity = random(0.2, 0.4);
      const rotation = random(0, 360);
      
      return {
        id: `snowflake-${i}`,
        trunkLength,
        branches,
        size,
        delay,
        duration,
        startX,
        startY,
        opacity,
        rotation
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {snowflakes.map((snowflake) => (
        <div
          key={snowflake.id}
          className="absolute"
          style={{
            left: `${snowflake.startX}%`,
            top: `${snowflake.startY}%`,
            width: `${snowflake.size}px`,
            height: `${snowflake.size}px`,
            opacity: snowflake.opacity,
            animation: `snow-fall ${snowflake.duration}s linear infinite`,
            animationDelay: `${snowflake.delay}s`,
            transform: `rotate(${snowflake.rotation}deg)`,
            filter: 'drop-shadow(0 0 2px var(--accent-glow))',
            color: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <svg 
            viewBox="0 0 100 100" 
            width="100%" 
            height="100%" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              stroke: 'currentColor',
              strokeWidth: '1.5',
              strokeLinecap: 'round',
              fill: 'none'
            }}
          >
            {buildSnowflakeSVG(snowflake.id, snowflake.trunkLength, snowflake.branches)}
          </svg>
        </div>
      ))}
    </div>
  );
};

export default SnowEffect;

