import { ImageResponse } from "next/og";

export const alt = "VirtualAssistant.com.ph — Filipino talent. A team behind every hire.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",width:"100%",height:"100%",padding:"64px 76px",background:"#102d35",color:"#fff",fontFamily:"sans-serif"}}>
    <div style={{display:"flex",fontSize:27,letterSpacing:-1}}>VirtualAssistant<span style={{color:"#9ddccb"}}>.com.ph</span></div>
    <div style={{display:"flex",flexDirection:"column",fontSize:70,fontWeight:700,letterSpacing:-3,lineHeight:1.08}}><span>Great Filipino talent.</span><span style={{color:"#9ddccb"}}>A team behind every hire.</span></div>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:23,color:"#d1e4e0"}}><span>Recruiting · Screening · Placement support</span><span>Build your team →</span></div>
  </div>,size);
}
