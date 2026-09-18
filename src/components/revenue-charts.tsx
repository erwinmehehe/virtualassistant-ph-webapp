type TrendPoint = { label: string; primary: number; secondary?: number };
type BarPoint = { label: string; value: number; secondary?: number };

function niceMax(value: number) {
  if (value <= 5) return 5;
  const power = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / power) * power;
}

export function RevenueTrendChart({
  data,
  primaryLabel,
  secondaryLabel,
  ariaLabel
}: {
  data: TrendPoint[];
  primaryLabel: string;
  secondaryLabel?: string;
  ariaLabel: string;
}) {
  const width = 760;
  const height = 250;
  const left = 42;
  const right = 18;
  const top = 22;
  const bottom = 44;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const maxValue = niceMax(Math.max(1, ...data.flatMap((d) => [d.primary, d.secondary || 0])));
  const x = (i: number) => left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (value: number) => top + plotH - (value / maxValue) * plotH;
  const line = (key: "primary" | "secondary") =>
    data.map((d, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(Number(d[key] || 0)).toFixed(1)}`).join(" ");

  const ticks = [0, .25, .5, .75, 1].map((pct) => Math.round(maxValue * pct));

  return <figure className="revenue-chart">
    <div className="revenue-chart-legend" aria-hidden="true">
      <span><i className="primary"/>{primaryLabel}</span>
      {secondaryLabel ? <span><i className="secondary"/>{secondaryLabel}</span> : null}
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      {ticks.map((tick) => {
        const yy = y(tick);
        return <g key={tick}>
          <line className="revenue-grid-line" x1={left} x2={width-right} y1={yy} y2={yy}/>
          <text className="revenue-axis-text" x={left-9} y={yy+4} textAnchor="end">{tick}</text>
        </g>;
      })}
      <path className="revenue-line primary" d={line("primary")}/>
      {secondaryLabel ? <path className="revenue-line secondary" d={line("secondary")}/> : null}
      {data.map((d, i) => <g key={`${d.label}-${i}`}>
        <circle className="revenue-dot primary" cx={x(i)} cy={y(d.primary)} r="4"><title>{d.label}: {primaryLabel} {d.primary}</title></circle>
        {secondaryLabel ? <circle className="revenue-dot secondary" cx={x(i)} cy={y(d.secondary || 0)} r="4"><title>{d.label}: {secondaryLabel} {d.secondary || 0}</title></circle> : null}
        {(i === 0 || i === data.length-1 || i % Math.max(1, Math.ceil(data.length / 6)) === 0) ?
          <text className="revenue-axis-text" x={x(i)} y={height-15} textAnchor="middle">{d.label}</text> : null}
      </g>)}
    </svg>
  </figure>;
}

export function RevenueBarChart({ data, ariaLabel, valueLabel = "Leads" }: { data: BarPoint[]; ariaLabel: string; valueLabel?: string }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondary || 0)));
  return <figure className="revenue-hbars" role="img" aria-label={ariaLabel}>
    {data.map((row) => <div className="revenue-hbar-row" key={row.label}>
      <div className="revenue-hbar-copy"><strong>{row.label}</strong><span>{row.value} {valueLabel.toLowerCase()}{row.secondary != null ? ` · ${row.secondary} wins` : ""}</span></div>
      <div className="revenue-hbar-track" aria-hidden="true">
        <span className="primary" style={{width:`${Math.max(row.value ? 4 : 0,(row.value/max)*100)}%`}}/>
        {row.secondary != null ? <span className="secondary" style={{width:`${Math.max(row.secondary ? 4 : 0,(row.secondary/max)*100)}%`}}/> : null}
      </div>
    </div>)}
  </figure>;
}

export function RevenueFunnelChart({ stages, ariaLabel }: { stages: { label: string; value: number }[]; ariaLabel: string }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return <figure className="revenue-funnel" role="img" aria-label={ariaLabel}>
    {stages.map((stage, index) => {
      const pct = Math.round((stage.value / max) * 100);
      return <div className="revenue-funnel-row" key={stage.label}>
        <div className="revenue-funnel-label"><span>{stage.label}</span><strong>{stage.value}</strong></div>
        <div className="revenue-funnel-track" aria-hidden="true"><span style={{width:`${Math.max(stage.value ? 5 : 0,pct)}%`}}/></div>
        {index ? <small>{pct}% of starting cohort</small> : <small>Starting cohort</small>}
      </div>;
    })}
  </figure>;
}
