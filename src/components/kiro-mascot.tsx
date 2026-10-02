import { useId } from "react";
import type { KiroState } from "./kiro-guide";

type KiroMascotProps = {
  state?: KiroState;
  className?: string;
  withLaptop?: boolean;
};

export function KiroMascot({
  state = "welcome",
  className,
  withLaptop = false,
}: KiroMascotProps) {
  const uid = useId().replace(/:/g, "");
  const headGradient = `kiro-head-${uid}`;
  const bodyGradient = `kiro-body-${uid}`;
  const wingGradient = `kiro-wing-${uid}`;
  const scarfGradient = `kiro-scarf-${uid}`;
  const isThinking = state === "thinking";
  const isSuccess = state === "success";
  const isWelcome = state === "welcome";
  const isReminder = state === "reminder";
  const isAttention = state === "attention";
  const isTraining = state === "training";

  return (
    <svg
      className={className}
      viewBox="0 0 160 160"
      role="img"
      aria-label={`Kiro, the VAPH kingfisher guide, ${state} state`}
    >
      <defs>
        <linearGradient id={headGradient} x1="0.18" x2="0.82" y1="0.08" y2="0.92">
          <stop offset="0" stopColor="#22c3ff" />
          <stop offset=".42" stopColor="#2385ff" />
          <stop offset=".76" stopColor="#2453df" />
          <stop offset="1" stopColor="#153091" />
        </linearGradient>
        <linearGradient id={bodyGradient} x1=".12" x2=".9" y1=".12" y2=".9">
          <stop offset="0" stopColor="#21baff" />
          <stop offset=".5" stopColor="#2e7fff" />
          <stop offset="1" stopColor="#2447c5" />
        </linearGradient>
        <linearGradient id={wingGradient} x1=".1" x2=".9" y1=".1" y2=".9">
          <stop offset="0" stopColor="#23c4ff" />
          <stop offset=".46" stopColor="#168cf1" />
          <stop offset="1" stopColor="#1f4ab9" />
        </linearGradient>
        <linearGradient id={scarfGradient} x1=".1" x2=".9" y1="0" y2="1">
          <stop offset="0" stopColor="#314fd0" />
          <stop offset="1" stopColor="#111b68" />
        </linearGradient>
      </defs>

      {(isWelcome || isSuccess) ? (
        <g fill="none" stroke="#23bff2" strokeLinecap="round" strokeWidth="3.2">
          <path d="M18 39l-7-6" />
          <path d="M16 50H7" />
          <path d="M28 31v-9" />
        </g>
      ) : null}

      {isSuccess ? (
        <g fill="none" stroke="#f4a11a" strokeLinecap="round" strokeWidth="3.4">
          <path d="M126 31l7-7" />
          <path d="M132 43h10" />
          <path d="M118 25v-9" />
        </g>
      ) : null}

      {isThinking ? (
        <g>
          <circle cx="126" cy="28" r="14" fill="#f4f0ff" />
          <text x="126" y="35" textAnchor="middle" fill="#7757eb" fontFamily="system-ui, sans-serif" fontSize="24" fontWeight="900">?</text>
        </g>
      ) : null}

      {isAttention ? (
        <g>
          <circle cx="129" cy="28" r="13" fill="#ff625c" />
          <rect x="127.2" y="20" width="3.6" height="10.5" rx="1.8" fill="#fff" />
          <circle cx="129" cy="34.5" r="1.9" fill="#fff" />
        </g>
      ) : null}

      {/* soft tail silhouette */}
      <path d="M54 116c-15 9-26 21-31 35 14-5 25-10 34-17 6 7 15 13 28 17-3-15-11-27-23-35Z" fill="#18378f" />
      <path d="M63 120c-8 8-13 18-14 29 8-7 15-13 22-18Z" fill="#2d71f5" />

      {/* body */}
      <ellipse cx="73" cy="104" rx="40" ry="38" fill={`url(#${bodyGradient})`} />
      <ellipse cx="76" cy="111" rx="27" ry="31" fill="#fffaf3" />
      <path d="M44 91c3 17 10 30 23 39-17 1-31-9-36-23-4-12 0-22 13-30Z" fill="#f59c2e" />

      {/* back wing / feathers */}
      <path d="M39 92c-12 6-20 16-23 30 10-7 19-10 27-11-4 7-6 14-5 22 8-8 14-15 18-23Z" fill={`url(#${wingGradient})`} />
      <path d="M108 91c13 5 22 14 27 28-10-6-19-9-28-9 5 6 8 13 8 20-9-7-16-13-21-21Z" fill="#2375df" opacity=".96" />

      {/* feather crown + head */}
      <path d="M44 48c-7-8-10-17-9-27 6 8 13 13 22 16-1-9 1-18 6-26 4 9 10 16 18 21 2-10 6-18 12-25 1 11 4 19 10 26 5-7 11-13 19-17-2 10-6 18-12 24 9-2 18-1 27 3-8 6-17 10-27 12Z" fill={`url(#${headGradient})`} />
      <ellipse cx="77" cy="61" rx="39" ry="34" fill={`url(#${headGradient})`} />

      {/* layered feather details */}
      <path d="M46 48c8-14 18-23 31-29-3 7-4 14-3 20 8-8 17-13 28-14-6 7-9 13-10 19 7-5 15-7 23-6-7 5-13 11-17 17Z" fill="#1447c8" opacity=".7" />
      <path d="M46 42c7-7 15-13 24-16-2 5-2 10-1 14 6-6 13-10 21-11-4 5-7 10-8 15Z" fill="#58d4ff" opacity=".45" />

      {/* face cream + orange */}
      <path d="M44 58c7-14 19-21 34-22 11-1 20 3 27 11-8 3-15 8-20 14-15 8-29 7-41-3Z" fill="#fffaf2" />
      <path d="M72 74c15-12 31-15 49-8-8 12-19 19-33 22-9 2-15-3-16-14Z" fill="#fffaf2" />
      <path d="M48 70c7 8 17 12 30 12-6 10-15 15-25 15-8-4-11-13-5-27Z" fill="#f7a035" />

      {/* eye */}
      <ellipse cx="72" cy="56" rx="14.5" ry="16.5" fill="#fff" />
      <ellipse cx="75" cy="58" rx="10.4" ry="13" fill="#151a34" />
      <ellipse cx="78" cy="58" rx="6.5" ry="9" fill="#6242bd" />
      <ellipse cx="79" cy="54" rx="3.2" ry="4.2" fill="#bc8cff" opacity=".8" />
      <circle cx="81" cy="52" r="3.1" fill="#fff" />
      <circle cx="72" cy="63" r="1.6" fill="#fff" opacity=".85" />
      <path d="M60 43c8-7 18-9 27-4" fill="none" stroke="#12306f" strokeLinecap="round" strokeWidth="3" />

      {/* beak */}
      <path d="M87 61 154 66 90 76Z" fill="#0f1d55" />
      <path d="M91 62 151 66 91 69Z" fill="#334fa7" />
      <path d="M91 69 147 67 92 75Z" fill="#09163f" />
      <path d="M93 66c12-2 24-2 36 0" fill="none" stroke="#6f83d9" strokeLinecap="round" strokeWidth="1.5" opacity=".65" />

      {/* forward wing / pose */}
      {isSuccess ? (
        <>
          <path d="M43 93C27 88 17 77 12 61c-2 15 3 29 14 39 8 7 16 10 25 10Z" fill={`url(#${wingGradient})`} />
          <path d="M111 92c16-5 27-15 32-30 2 15-3 28-14 38-8 7-16 10-25 10Z" fill="#2477e3" />
        </>
      ) : isWelcome ? (
        <path d="M44 93C28 84 19 71 18 56c-7 15-5 30 5 43 7 9 15 13 25 14Z" fill={`url(#${wingGradient})`} />
      ) : isThinking ? (
        <path d="M105 96c9-2 16 2 21 10-8 4-16 4-24 0Z" fill="#1b4cb7" />
      ) : (
        <path d="M45 96c-9 3-16 11-19 23 9-5 18-7 26-6Z" fill={`url(#${wingGradient})`} />
      )}

      {/* scarf */}
      <path d="M48 89c17 7 35 7 54 0l-6 28-20 13-21-13Z" fill={`url(#${scarfGradient})`} />
      <path d="M59 92c11 4 22 4 33 0l-16 20Z" fill="#3957dd" />
      <path d="m68 99 8 12 8-12h-4.5L76 105l-3.5-6Z" fill="#fff" />

      {/* feet */}
      <path d="M58 132c-5 4-9 8-12 13 7 0 12-1 17-4" fill="none" stroke="#ef9d31" strokeLinecap="round" strokeWidth="4" />
      <path d="M86 132c5 4 10 8 16 11-7 1-13 0-19-3" fill="none" stroke="#ef9d31" strokeLinecap="round" strokeWidth="4" />

      {isReminder ? (
        <g transform="translate(111 83)">
          <rect width="34" height="38" rx="9" fill="#fff" stroke="#aebdff" strokeWidth="2.2" />
          <path d="M17 9c-5 0-7 4-7 9v5l-2.5 3.5h19L24 23v-5c0-5-2-9-7-9Z" fill="#5b55e8" />
          <circle cx="17" cy="29.5" r="2.4" fill="#5b55e8" />
        </g>
      ) : null}

      {isTraining ? (
        <g>
          <path d="m39 27 39-17 42 17-42 18Z" fill="#15226f" />
          <path d="M53 37v16c15 9 31 9 47 0V37" fill="#243dae" />
          <path d="M117 30v25" stroke="#15226f" strokeWidth="3.8" strokeLinecap="round" />
          <circle cx="117" cy="58" r="4" fill="#f3a32f" />
          <path d="M56 36c14 6 29 6 44 0" fill="none" stroke="#5069e0" strokeWidth="2" opacity=".7" />
        </g>
      ) : null}

      {withLaptop ? (
        <g>
          <path d="M82 111h60l-7 33H78Z" fill="#263a91" />
          <path d="M88 116h47l-4.8 23H83Z" fill="#4665d7" />
          <path d="M103 122h12l6 6-6 6h-12l-6-6Z" fill="#fff" opacity=".95" />
          <path d="M73 144h72l9 5H64Z" fill="#14225f" />
          <path d="M72 144h74" stroke="#7088eb" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  );
}
