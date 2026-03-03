export default function RoadmapLoading() {
  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div className="skeleton-bar" style={{ width: "180px", height: "26px", marginBottom: "0.5rem" }} />
      <div className="skeleton-bar" style={{ width: "280px", height: "14px", marginBottom: "2rem" }} />

      {/* Phase tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-card" style={{ width: "80px", height: "34px", borderRadius: "20px" }} />
        ))}
      </div>

      {/* Phase card */}
      <div className="skeleton-card" style={{ height: "280px", borderRadius: "8px", marginBottom: "1.5rem" }} />

      {/* Priority subjects */}
      <div className="skeleton-bar" style={{ width: "160px", height: "18px", marginBottom: "1rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-card" style={{ height: "100px", borderRadius: "8px" }} />
        ))}
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
