// Minimal types for the MIT-licensed qrcode-generator module vendored alongside.
export type QRCodeInstance = {
  addData(data: string, mode?: "Numeric" | "Alphanumeric" | "Byte" | "Kanji"): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
};
export function qrcode(typeNumber: number, level: "L" | "M" | "Q" | "H"): QRCodeInstance;
export default qrcode;
