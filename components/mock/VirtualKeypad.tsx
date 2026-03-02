"use client";

interface VirtualKeypadProps {
  value: string;
  onChange: (value: string) => void;
}

const KEYPAD_LAYOUT = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  [".", "0", "⌫"],
  ["-", "C", "±"],
];

export function VirtualKeypad({ value, onChange }: VirtualKeypadProps) {
  function handleKey(key: string) {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (key === "C") {
      onChange("");
    } else if (key === "±") {
      onChange(value.startsWith("-") ? value.slice(1) : `-${value}`);
    } else if (key === "." && value.includes(".")) {
      return;
    } else if (key === "-" && value.length > 0) {
      return;
    } else {
      onChange(value + key);
    }
  }

  return (
    <div className="mt-3">
      {/* Display */}
      <div
        className="w-full px-3 py-2 rounded mb-2 text-right text-sm font-mono"
        style={{
          background: "#0a0e1a",
          border: "1px solid #f59e0b",
          color: "#f59e0b",
          minHeight: "36px",
          fontFamily: "var(--font-ibm-plex-mono)",
        }}
      >
        {value || "0"}
      </div>

      {/* Keys */}
      <div className="space-y-1">
        {KEYPAD_LAYOUT.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="flex-1 py-2 rounded text-sm font-mono"
                style={{
                  background: key === "C" ? "rgba(239,68,68,0.1)" : "#111827",
                  border: `1px solid ${key === "C" ? "#ef4444" : "#1e293b"}`,
                  color: key === "C" ? "#ef4444" : "#f1f5f9",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  cursor: "pointer",
                }}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
