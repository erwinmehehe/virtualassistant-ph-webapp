import type { KiroState } from "./kiro-guide";

type KiroClientMascotProps = {
  state?: KiroState;
  className?: string;
  withLaptop?: boolean;
};

export function KiroClientMascot({
  state = "welcome",
  className,
  withLaptop = false,
}: KiroClientMascotProps) {
  const isThinking = state === "thinking";
  const isSuccess = state === "success";
  const isWelcome = state === "welcome";
  const isReminder = state === "reminder";
  const isAttention = state === "attention";
  const isTraining = state === "training";

  return (
    <svg
      className={className}
      viewBox="0 0 190 165"
      role="img"
      aria-label={`Kiro, the VAPH kingfisher guide, ${state} state`}
    >
      <defs>
        <linearGradient id="client-kiro-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#23C7FF" />
          <stop offset=".48" stopColor="#1677FF" />
          <stop offset="1" stopColor="#183B9B" />
        </linearGradient>
        <linearGradient id="client-kiro-wing-left" x1=".1" y1=".1" x2=".9" y2=".9">
          <stop offset="0" stopColor="#58D7FF" />
          <stop offset=".48" stopColor="#1B91FF" />
          <stop offset="1" stopColor="#2450C9" />
        </linearGradient>
        <linearGradient id="client-kiro-wing-right" x1=".15" y1="0" x2=".8" y2="1">
          <stop offset="0" stopColor="#2BB9FF" />
          <stop offset=".55" stopColor="#236FE8" />
          <stop offset="1" stopColor="#243EAA" />
        </linearGradient>
        <linearGradient id="client-kiro-body" x1=".15" y1=".05" x2=".8" y2="1">
          <stop offset="0" stopColor="#2CC8FF" />
          <stop offset=".52" stopColor="#277EFF" />
          <stop offset="1" stopColor="#2945B7" />
        </linearGradient>
        <linearGradient id="client-kiro-beak" x1="0" y1=".25" x2="1" y2=".75">
          <stop offset="0" stopColor="#FFD85A" />
          <stop offset=".5" stopColor="#FFB420" />
          <stop offset="1" stopColor="#F28A16" />
        </linearGradient>
        <linearGradient id="client-kiro-belly" x1=".2" y1="0" x2=".7" y2="1">
          <stop offset="0" stopColor="#FFFDF5" />
          <stop offset="1" stopColor="#F7EFD9" />
        </linearGradient>
        <filter id="client-kiro-soft-shadow" x="-35%" y="-35%" width="170%" height="190%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#10256D" floodOpacity=".2" />
        </filter>
      </defs>

      {(isWelcome || isSuccess) ? (
        <g aria-hidden="true">
          <path d="M28 19v12M22 25h12" stroke="#35B7FF" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M150 18v10M145 23h10" stroke="#7B5CF4" strokeWidth="2.2" strokeLinecap="round" />
          <path d="m164 38 2.5 5.5L172 46l-5.5 2.5L164 54l-2.5-5.5L156 46l5.5-2.5Z" fill="#FFB11B" />
        </g>
      ) : null}

      {isThinking ? (
        <g aria-hidden="true">
          <circle cx="157" cy="30" r="13" fill="#EEF0FF" />
          <text x="157" y="36" textAnchor="middle" fill="#5B55DA" fontFamily="system-ui, sans-serif" fontSize="19" fontWeight="800">?</text>
        </g>
      ) : null}

      {isAttention ? (
        <g aria-hidden="true">
          <circle cx="159" cy="30" r="13" fill="#FF5F59" />
          <rect x="157.4" y="21" width="3.2" height="10" rx="1.6" fill="#fff" />
          <circle cx="159" cy="35.5" r="1.9" fill="#fff" />
        </g>
      ) : null}

      <g filter="url(#client-kiro-soft-shadow)">
        {/* tail */}
        <path d="M66 126c-14 7-25 16-31 27 13-3 23-6 31-10 8 7 18 11 30 12-5-12-12-21-22-29Z" fill="#183A9C" />
        <path d="M76 128c-6 10-8 18-6 25 7-6 13-12 18-20Z" fill="#2A75F7" />

        {/* spread wings */}
        <path
          d={isSuccess
            ? "M58 91C40 82 26 67 22 47c-9 18-7 37 5 53 9 12 20 19 33 22Z"
            : isWelcome
              ? "M59 93C42 84 28 70 24 53c-8 16-6 34 5 49 8 11 19 18 32 20Z"
              : "M59 96C44 95 31 101 22 114c14 0 27 4 39 12Z"}
          fill="url(#client-kiro-wing-left)"
        />
        <path
          d={isSuccess
            ? "M111 88c18-10 31-25 35-45 10 17 9 35-2 51-8 12-19 20-32 23Z"
            : "M111 95c16-5 29-2 40 11-14 1-26 6-38 16Z"}
          fill="url(#client-kiro-wing-right)"
        />

        {/* layered wing feathers */}
        <path d="M34 76c10 3 19 8 27 15-11-2-20-2-28 0 4-6 4-10 1-15Z" fill="#78E0FF" opacity=".9" />
        <path d="M38 92c9 1 17 5 24 10-10 0-18 2-25 6 3-6 4-11 1-16Z" fill="#2BA9FF" />
        <path d="M128 83c-8 5-15 11-20 19 8-3 16-4 24-3-3-5-4-10-4-16Z" fill="#55CCFF" opacity=".9" />
        <path d="M136 97c-8 3-15 8-21 15 9-2 17-1 24 2-1-6-2-11-3-17Z" fill="#2668DE" />

        {/* body */}
        <ellipse cx="84" cy="104" rx="42" ry="43" fill="url(#client-kiro-body)" />
        <ellipse cx="85" cy="108" rx="29" ry="34" fill="url(#client-kiro-belly)" />

        {/* warm side plumage */}
        <path d="M54 89c-8 13-7 30 1 44 6 10 14 17 25 20-13-11-18-24-18-40 0-10-2-18-8-24Z" fill="#F39A37" />
        <path d="M59 94c-4 11-3 23 3 34 3 5 7 9 12 12-6-10-8-21-6-34 1-6-2-10-9-12Z" fill="#FFC154" opacity=".9" />

        {/* head */}
        <circle cx="83" cy="61" r="43" fill="url(#client-kiro-head)" />

        {/* crown / feather crest */}
        <path d="M43 48C54 27 69 17 89 16 82 22 78 27 76 33c10-9 22-13 35-12-9 6-15 12-18 18 10-5 20-5 29-1-12 8-21 17-27 28Z" fill="#154FBF" />
        <path d="M48 45c11-15 24-23 40-25-7 6-11 12-12 18 8-8 17-12 27-13-7 6-12 12-14 18Z" fill="#1F8CFF" opacity=".95" />
        <path d="M55 37c8-8 17-13 27-15-5 5-8 10-9 15 7-5 13-7 20-7-5 4-9 9-11 14Z" fill="#69DDFF" opacity=".85" />

        {/* cheek and face patches */}
        <path d="M49 58c10-12 22-18 35-17 7 1 13 4 18 10-7 3-12 8-15 15-14 8-27 7-38-8Z" fill="#FFF8E8" />
        <path d="M80 76c14-12 29-17 46-14-8 14-19 23-31 26-8 2-13-2-15-12Z" fill="#FFF7E3" />
        <path d="M51 69c9 10 20 14 33 13-7 10-16 15-27 14-8-5-10-14-6-27Z" fill="#F29A35" />

        {/* eye + brow */}
        <path d="M62 56c6-6 14-6 20 0" fill="none" stroke="#1D2450" strokeWidth="4.2" strokeLinecap="round" />
        <path d="M61 51c6-3 13-3 19 .3" fill="none" stroke="#173B91" strokeWidth="2.2" strokeLinecap="round" opacity=".65" />

        {/* beak */}
        <path d="M87 61 174 66 91 78Z" fill="url(#client-kiro-beak)" />
        <path d="M90 64 169 66 94 70Z" fill="#FFE273" opacity=".9" />
        <path d="M91 73 166 67 96 80Z" fill="#E77A12" />
        <path d="M88 67c9 2 16 2 23 0" fill="none" stroke="#A84F0E" strokeWidth="1.8" strokeLinecap="round" opacity=".65" />

        {/* neck scarf */}
        <path d="M54 88c18 7 38 7 59 0l-7 30-22 13-23-13Z" fill="#182A80" />
        <path d="M67 92c12 4 24 4 35 0l-18 22Z" fill="#2F4ED0" />
        <path d="M72 101h8l4 7 4-7h8l-12 16Z" fill="#FFFFFF" />

        {/* feet */}
        <path d="M69 143c-5 4-9 7-12 11 6 0 12-1 17-4" fill="none" stroke="#EFA135" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M94 143c4 4 9 7 14 10-6 1-12 0-18-3" fill="none" stroke="#EFA135" strokeWidth="3.2" strokeLinecap="round" />

        {isReminder ? (
          <g transform="translate(122 104)">
            <rect width="34" height="36" rx="9" fill="#FFFFFF" stroke="#A7B3FF" strokeWidth="2" />
            <path d="M17 9c-5 0-7 4-7 8v4l-3 4h20l-3-4v-4c0-4-2-8-7-8Z" fill="#5B55DF" />
            <circle cx="17" cy="28" r="2.3" fill="#5B55DF" />
          </g>
        ) : null}

        {isTraining ? (
          <g>
            <path d="m48 26 37-15 38 15-38 16Z" fill="#172873" />
            <path d="M62 34v14c14 8 29 8 44 0V34" fill="#2544AE" />
            <path d="M120 29v24" stroke="#172873" strokeWidth="3" strokeLinecap="round" />
            <circle cx="120" cy="56" r="3.5" fill="#FFB223" />
          </g>
        ) : null}

        {withLaptop ? (
          <g>
            <path d="M90 111h56l-7 34H87Z" fill="#24398F" />
            <path d="M96 116h43l-4 24H92Z" fill="#4260D4" />
            <path d="m111 125 7-5 7 5-7 6Z" fill="#FFFFFF" opacity=".92" />
            <path d="M80 145h70l10 5H72Z" fill="#14225F" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
