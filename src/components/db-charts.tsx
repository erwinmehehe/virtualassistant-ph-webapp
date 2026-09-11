export function ProgressRing({ pct, size = 56, stroke = 6, color = "#4f46e5" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`${clamped}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#e6e9f2" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * clamped) / 100}
        style={{ transition: "stroke-dashoffset .6s ease" }}
      />
    </svg>
  );
}

export function BarChart({ data, height = 120 }: { data: { label: string; value: number; highlight?: boolean }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height }}>
        {data.map((d) => (
          <div key={d.label} title={`${d.label}: ${d.value}`} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
            <div
              style={{
                width: "100%",
                height: `${Math.max((d.value / max) * 100, 4)}%`,
                borderRadius: "6px 6px 0 0",
                background: d.highlight
                  ? "linear-gradient(180deg, #4f46e5, #7c3aed)"
                  : "linear-gradient(180deg, #d9defc, #eceeff)",
                transition: "height .5s ease",
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {data.map((d) => (
          <span key={d.label} style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9aa2b5" }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
