export function WorkspaceLoading({ label }: { label: string }) {
  const bar = (width: string, height = 12) => ({ width, height, borderRadius: 999, background: "#e2e8f0" });
  return <div className="stack" aria-busy="true" aria-live="polite">
    <div className="page-head"><div><div className="kicker">{label}</div><h1>Loading your workspace</h1><p>Getting the latest activity and priorities ready.</p></div></div>
    <div className="stats">
      {[0,1,2,3].map((item)=><div className="stat-card" key={item}><div style={bar("45%",10)}/><div style={{...bar("28%",28),marginTop:14}}/><div style={{...bar("68%",10),marginTop:14}}/></div>)}
    </div>
    <div className="grid-2">
      <section className="card"><div style={bar("34%",14)}/><div style={{...bar("92%"),marginTop:18}}/><div style={{...bar("78%"),marginTop:12}}/><div style={{...bar("86%"),marginTop:12}}/></section>
      <section className="card"><div style={bar("38%",14)}/><div style={{...bar("82%"),marginTop:18}}/><div style={{...bar("66%"),marginTop:12}}/><div style={{...bar("74%"),marginTop:12}}/></section>
    </div>
  </div>;
}
