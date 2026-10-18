import { qrcode } from "../../vendor/qrcode-generator.mjs";

type CertificateVerificationQrProps = {
  url: string;
};

/**
 * Renders a real QR matrix locally (no third-party QR endpoint, no tracking).
 * Four white modules form the ISO QR quiet zone on every side.
 */
export function CertificateVerificationQr({ url }: CertificateVerificationQrProps) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();

  const count = qr.getModuleCount();
  const quietZone = 4;
  const total = count + quietZone * 2;
  const runs: string[] = [];

  for (let row = 0; row < count; row += 1) {
    let start = -1;
    for (let col = 0; col <= count; col += 1) {
      const dark = col < count && qr.isDark(row, col);
      if (dark && start === -1) start = col;
      if (!dark && start !== -1) {
        const x = start + quietZone;
        const y = row + quietZone;
        runs.push("M" + x + " " + y + "h" + (col - start) + "v1H" + x + "z");
        start = -1;
      }
    }
  }

  return (
    <svg
      className="certificate-qr-svg"
      role="img"
      aria-label="QR code for the public certificate verification URL"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={"0 0 " + total + " " + total}
      shapeRendering="crispEdges"
      focusable="false"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={runs.join("")} fill="#14234e" />
    </svg>
  );
}
