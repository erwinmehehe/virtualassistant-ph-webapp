import { ImageResponse } from "next/og";
import { createElement } from "react";

export function createSiteIconResponse(size: number) {
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Math.round(size * 0.22),
          background: "linear-gradient(145deg, #444CE7 0%, #7A5AF8 100%)",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: Math.round(size * 0.34),
          fontWeight: 800,
          letterSpacing: "-0.05em",
        },
      },
      "VA",
    ),
    { width: size, height: size },
  );
}
