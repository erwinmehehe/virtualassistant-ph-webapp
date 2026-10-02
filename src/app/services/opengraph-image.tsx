import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Virtual Assistant Services Philippines | VA Roles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const roles = [
  ["Admin & Executive", "Inbox · Calendar · Operations"],
  ["Sales & Customer", "CRM · Follow-up · Support"],
  ["Marketing & Creative", "SEO · Social · Content"],
  ["Finance & Ecommerce", "Books · Orders · Reporting"],
];

export default function ServicesOpengraphImage() {
  return new ImageResponse(
    <div style={{ width:"100%", height:"100%", display:"flex", position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#fff 0%,#fafaff 50%,#eef2ff 100%)", fontFamily:"Arial,Helvetica,sans-serif", color:"#101828" }}>
      <div style={{ position:"absolute", width:520, height:520, borderRadius:260, right:-100, top:-190, background:"rgba(122,90,248,.12)" }}/>
      <div style={{ width:"57%", display:"flex", flexDirection:"column", padding:"54px 38px 46px 60px", zIndex:2 }}>
        <div style={{ display:"flex", alignItems:"center" }}>
          <div style={{ width:46, height:46, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg,#444ce7,#7a5af8)", color:"#fff", fontSize:18, fontWeight:800, marginRight:13 }}>VA</div>
          <div style={{ display:"flex", fontSize:24, fontWeight:800, color:"#17205a" }}>VirtualAssistant<span style={{ color:"#5b45df" }}>.com.ph</span></div>
        </div>
        <div style={{ display:"flex", marginTop:66, color:"#5b45df", fontSize:15, fontWeight:800, letterSpacing:".14em" }}>VIRTUAL ASSISTANT SERVICES</div>
        <div style={{ display:"flex", marginTop:14, maxWidth:620, fontSize:56, lineHeight:1.03, letterSpacing:"-.045em", fontWeight:800, color:"#101a4b" }}>Virtual Assistant Services Philippines</div>
        <div style={{ display:"flex", marginTop:18, maxWidth:590, fontSize:22, lineHeight:1.38, color:"#475467" }}>Compare vetted Filipino VA roles across admin, operations, customer support, marketing, finance, ecommerce, real estate, and specialist workflows.</div>
        <div style={{ display:"flex", marginTop:"auto", gap:12 }}>
          {["Vetted talent","Role-specific hiring","Recruiter support"].map((x)=><div key={x} style={{ display:"flex", padding:"10px 13px", borderRadius:999, border:"1px solid #e4e7ec", background:"#fff", color:"#344054", fontSize:14, fontWeight:700 }}>✓ {x}</div>)}
        </div>
      </div>
      <div style={{ width:"43%", display:"flex", flexWrap:"wrap", alignContent:"center", gap:14, padding:"78px 44px 70px 8px", zIndex:2 }}>
        {roles.map(([title,note],i)=><div key={title} style={{ width:i%2===0?226:208, height:176, display:"flex", flexDirection:"column", padding:"20px", borderRadius:24, background:"rgba(255,255,255,.96)", border:"1px solid #eaecf0", boxShadow:"0 18px 44px rgba(68,76,231,.13)" }}>
          <div style={{ width:42, height:42, borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", background:i===0?"#eef2ff":i===1?"#ecfdf3":i===2?"#f4f3ff":"#fff7ed", color:i===1?"#067647":"#444ce7", fontWeight:900, fontSize:18 }}>{["⌘","✓","↗","◆"][i]}</div>
          <div style={{ display:"flex", marginTop:18, fontSize:20, color:"#17205a", fontWeight:800 }}>{title}</div>
          <div style={{ display:"flex", marginTop:7, fontSize:14, color:"#667085" }}>{note}</div>
        </div>)}
      </div>
    </div>,
    size,
  );
}
