"use client";

interface MasteryGaugeProps {
  score: number; // 0-100
  size?: number;
  label?: string;
}

export function MasteryGauge({ score, size = 80, label }: MasteryGaugeProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={6}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 + 5}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill={color}
          fontFamily="var(--font-ibm-plex-mono)"
        >
          {Math.round(score)}
        </text>
      </svg>
      {label && (
        <span
          className="text-xs text-center"
          style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)", maxWidth: size }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
