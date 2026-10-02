import type { KiroState } from "./kiro-guide";

type KiroMascotProps = {
  state?: KiroState;
  className?: string;
  withLaptop?: boolean;
};

export function KiroMascot({ state = "welcome", className, withLaptop = false }: KiroMascotProps) {
  const isThinking = state === "thinking";
  const isSuccess = state === "success";
  const isWelcome = state === "welcome";
  const isReminder = state === "reminder";
  const isAttention = state === "attention";
  const isTraining = state === "training";

  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Kiro, the VAPH kingfisher guide, ${state} state`}
    >
      <defs>
        <linearGradient id="kiro-wing" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#18b9ff" />
          <stop offset=".55" stopColor="#2f6cff" />
          <stop offset="1" stopColor="#1737a0" />
        </linearGradient>
        <linearGradient id="kiro-head" x1=".15" x2=".85" y1=".1" y2=".9">
          <stop offset="0" stopColor="#27c8ff" />
          <stop offset=".48" stopColor="#2f78ff" />
          <stop offset="1" stopColor="#143290" />
        </linearGradient>
      </defs>

      {(isWelcome || isSuccess) ? (
        <g fill="none" stroke="#21bde9" strokeLinecap="round" strokeWidth="3">
          <path d="M17 28l-5-5" />
          <path d="M15 37H8" />
          <path d="M22 20v-7" />
        </g>
      ) : null}

      {isSuccess ? (
        <g fill="none" stroke="#f4a11a" strokeLinecap="round" strokeWidth="3">
          <path d="M92 22l5-6" />
          <path d="M100 31h7" />
          <path d="M88 14v-6" />
        </g>
      ) : null}

      {isThinking ? (
        <text x="91" y="26" fill="#7757eb" fontFamily="system-ui, sans-serif" fontSize="25" fontWeight="800">?</text>
      ) : null}

      {isAttention ? (
        <g>
          <circle cx="96" cy="22" r="12" fill="#ff645f" />
          <rect x="94.4" y="14" width="3.2" height="10" rx="1.6" fill="#fff" />
          <circle cx="96" cy="28" r="1.8" fill="#fff" />
        </g>
      ) : null}

      {/* tail */}
      <path d="M49 91c-12 8-18 16-20 23 10-4 18-7 25-10 5 5 12 8 19 10-2-8-7-15-14-22Z" fill="#173798" />
      <path d="M55 93c-6 8-8 14-7 21 7-6 12-10 17-15Z" fill="#2e75ff" />

      {/* body */}
      <ellipse cx="60" cy="73" rx="34" ry="35" fill="url(#kiro-wing)" />
      <ellipse cx="61" cy="78" rx="24" ry="28" fill="#fbfbff" />

      {/* orange flank */}
      <path d="M35 63c4 6 7 14 8 25 4 8 9 14 15 18-13-1-24-8-29-18-5-10-4-19 6-25Z" fill="#f49a33" />

      {/* head */}
      <circle cx="60" cy="47" r="31" fill="url(#kiro-head)" />
      <path d="M35 42c8-16 19-24 33-26-6 5-9 9-11 14 10-8 19-10 27-8-7 4-12 8-15 12 8-4 15-4 21-2-8 6-14 13-17 21Z" fill="#1b54d8" opacity=".92" />

      {/* face patches */}
      <path d="M34 48c8-9 16-14 25-13 4 1 7 3 10 6-3 2-5 5-6 9-10 5-20 6-29-2Z" fill="#fff8ea" />
      <path d="M56 58c10-8 21-11 32-8-7 11-15 17-24 19-5 1-8-4-8-11Z" fill="#fff8ea" />
      <path d="M39 55c7 7 16 10 27 9-5 8-12 12-20 12-7-2-10-9-7-21Z" fill="#f39a31" />

      {/* eye */}
      <ellipse cx="54" cy="44" rx="10.5" ry="12" fill="#fff" />
      <ellipse cx="56" cy="45" rx="7.3" ry="9.3" fill="#1a1e39" />
      <ellipse cx="58" cy="43" rx="4.6" ry="6.4" fill="#633eb3" />
      <circle cx="60" cy="40" r="2.2" fill="#fff" />
      <circle cx="53" cy="49" r="1.2" fill="#fff" opacity=".8" />

      {/* beak */}
      <path d="M66 48 112 51 69 58Z" fill="#14256f" />
      <path d="M68 49 110 51 70 52Z" fill="#314fc2" />
      <path d="M67 55 106 52 70 58Z" fill="#101b50" />

      {/* wing */}
      <path d={isSuccess ? "M36 68c-11-5-18-12-22-22-2 13 2 25 13 34 6 5 12 7 18 7Z" : isWelcome ? "M35 69c-11-8-17-17-17-28-6 12-5 25 3 36 5 7 11 10 18 11Z" : "M34 69c-9 4-14 12-14 24 8-6 15-9 22-9Z"} fill="#229cf4" />
      <path d={isSuccess ? "M84 68c11-5 18-12 22-22 2 13-2 25-13 34-6 5-12 7-18 7Z" : "M86 70c9 3 15 10 17 21-9-5-16-7-23-5Z"} fill="#247be9" />

      {isThinking ? (
        <path d="M84 77c8 1 12 5 13 12-7 1-12 0-16-4Z" fill="#183ea8" />
      ) : null}

      {/* bandana */}
      <path d="M38 70c14 5 29 5 44 0l-5 23-17 10-17-10Z" fill="#172879" />
      <path d="M48 74c8 3 16 3 24 0l-12 17Z" fill="#2f4ed0" />
      <path d="m54 79 6 9 6-9h-3.7L60 83l-2.3-4Z" fill="#fff" />

      {/* feet */}
      <path d="M45 106c-4 3-7 5-9 8 5 0 10-1 14-3" fill="none" stroke="#f0a031" strokeLinecap="round" strokeWidth="3" />
      <path d="M70 106c3 3 7 5 11 7-5 1-10 0-15-2" fill="none" stroke="#f0a031" strokeLinecap="round" strokeWidth="3" />

      {isReminder ? (
        <g transform="translate(78 70)">
          <rect width="29" height="31" rx="7" fill="#fff" stroke="#9caeff" strokeWidth="2" />
          <path d="M14.5 8c-4 0-6 3-6 7v4l-2 3h16l-2-3v-4c0-4-2-7-6-7Z" fill="#5a52e8" />
          <circle cx="14.5" cy="24" r="2.2" fill="#5a52e8" />
        </g>
      ) : null}

      {isTraining ? (
        <g>
          <path d="m35 21 27-12 28 12-28 12Z" fill="#172879" />
          <path d="M45 28v12c10 7 22 7 33 0V28" fill="#233caa" />
          <path d="M88 23v19" stroke="#172879" strokeWidth="3" strokeLinecap="round" />
          <circle cx="88" cy="44" r="3" fill="#f3a32f" />
        </g>
      ) : null}

      {withLaptop ? (
        <g>
          <path d="M63 83h43l-5 27H61Z" fill="#263a91" />
          <path d="M67 87h34l-3.6 19H64Z" fill="#405fd2" />
          <path d="M76 93h10l5 5-5 5H76l-5-5Z" fill="#ffffff" opacity=".92" />
          <path d="M55 110h52l7 4H50Z" fill="#14225f" />
          <path d="M54 110h54" stroke="#7088eb" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  );
}
