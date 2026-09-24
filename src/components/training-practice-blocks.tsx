"use client";

import { Check, Clipboard, RotateCcw } from "lucide-react";
import { useState } from "react";

export function TrainingTemplateBlock({
  title,
  text,
}: {
  title?: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyTemplate() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="training-template-block">
      <div className="training-practice-block-head">
        <div>
          <span className="dash-kicker">Use this template</span>
          {title ? <h3>{title}</h3> : null}
        </div>
        <button className="btn btn-sm" type="button" onClick={copyTemplate}>
          {copied ? <Check size={14}/> : <Clipboard size={14}/>}
          {copied ? "Copied" : "Copy template"}
        </button>
      </div>
      <pre>{text}</pre>
    </section>
  );
}

export function TrainingChecklistBlock({
  title,
  items,
}: {
  title?: string;
  items: string[];
}) {
  const [checked, setChecked] = useState<number[]>([]);

  function toggle(index: number) {
    setChecked((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  }

  function reset() {
    setChecked([]);
  }

  return (
    <section className="training-checklist-block">
      <div className="training-practice-block-head">
        <div>
          <span className="dash-kicker">Check your work</span>
          {title ? <h3>{title}</h3> : null}
        </div>
        {checked.length ? (
          <button className="btn btn-sm" type="button" onClick={reset}>
            <RotateCcw size={13}/> Reset
          </button>
        ) : null}
      </div>
      <div className="training-checklist-items">
        {items.map((item, index) => (
          <label key={index} className={checked.includes(index) ? "is-checked" : ""}>
            <input
              type="checkbox"
              checked={checked.includes(index)}
              onChange={() => toggle(index)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
