export default function PracticeLoading() {
  return (
    <div style={{ display: "flex", height: "100%", background: "#0a0e1a" }}>
      {/* Sidebar skeleton */}
      <div style={{ width: "260px", borderRight: "1px solid #1e2535", padding: "1.5rem 1rem", flexShrink: 0 }}>
        <div className="skeleton-bar" style={{ width: "120px", height: "18px", marginBottom: "1.5rem" }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ marginBottom: "0.75rem" }}>
            <div className="skeleton-bar" style={{ width: `${70 + (i % 3) * 15}%`, height: "14px" }} />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div style={{ flex: 1, padding: "2rem" }}>
        <div className="skeleton-bar" style={{ width: "200px", height: "22px", marginBottom: "1.5rem" }} />
        <div className="skeleton-card" style={{ height: "320px", borderRadius: "8px", marginBottom: "1rem" }} />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card" style={{ flex: 1, height: "52px", borderRadius: "6px" }} />
          ))}
        </div>
      </div>

      <style>{`
        .skeleton-bar {
          background: linear-gradient(90deg, #1e2535 25%, #252d42 50%, #1e2535 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 4px;
        }
        .skeleton-card {
          background: linear-gradient(90deg, #131929 25%, #1a2236 50%, #131929 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border: 1px solid #1e2535;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
