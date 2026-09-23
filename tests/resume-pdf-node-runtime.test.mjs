import assert from "node:assert/strict";
import test from "node:test";

function makeTextPdf(text) {
  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const stream = `BT
/F1 12 Tf
72 720 Td
(${escaped}) Tj
ET
`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream)} >>
stream
${stream}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj
${objects[i]}
endobj
`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n 
`;
  }
  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF
`;
  return Buffer.from(pdf);
}

test("pdf-parse extracts resume text in Node without relying on global DOMMatrix", async () => {
  const previousDomMatrix = globalThis.DOMMatrix;
  try {
    delete globalThis.DOMMatrix;

    const { CanvasFactory } = await import("pdf-parse/worker");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({
      data: makeTextPdf("Virtual Assistant with 5 years experience using HubSpot and English"),
      CanvasFactory,
    });

    try {
      const result = await parser.getText();
      assert.match(result.text, /Virtual Assistant/);
      assert.match(result.text, /HubSpot/);
    } finally {
      await parser.destroy();
    }
  } finally {
    if (previousDomMatrix) globalThis.DOMMatrix = previousDomMatrix;
  }
});
