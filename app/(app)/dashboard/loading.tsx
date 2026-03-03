export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8" style={{ color: "#f1f5f9" }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton-bar" style={{ width: "220px", height: "28px", marginBottom: "8px" }} />
        <div className="skeleton-bar" style={{ width: "160px", height: "16px" }} />
      </div>

      {/* Stat cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-card" style={{ height: "90px", borderRadius: "8px" }} />
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        <div className="skeleton-card" style={{ height: "260px", borderRadius: "8px" }} />
        <div className="skeleton-card" style={{ height: "260px", borderRadius: "8px" }} />
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="skeleton-card" style={{ height: "180px", borderRadius: "8px" }} />
        <div className="skeleton-card" style={{ height: "180px", borderRadius: "8px" }} />
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
