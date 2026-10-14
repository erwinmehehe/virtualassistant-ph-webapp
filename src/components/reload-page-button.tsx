"use client";

/** A full document reload is deliberate when recovering from a failed server read. */
export function ReloadPageButton({ label }: { label: string }) {
  return <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>{label}</button>;
}
