"use client";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-zkeleton-border bg-zkeleton-panel/80 backdrop-blur-sm z-50">
      <div className="flex items-center gap-4">
        {/* Zkeleton logo mark */}
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect
              x="2"
              y="2"
              width="24"
              height="24"
              rx="4"
              stroke="#2dd4aa"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M8 10h12M8 14h12M8 18h12"
              stroke="#2dd4aa"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M10 8v12"
              stroke="#2dd4aa"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-zkeleton-teal font-semibold text-lg tracking-wider">
            ZKELETON
          </span>
        </div>

        <div className="h-4 w-px bg-zkeleton-border" />

        <h1 className="text-sm text-gray-400 tracking-wide uppercase">
          The Blind Spot Map
        </h1>

        <span className="text-[8px] tracking-[0.15em] uppercase text-gray-600 border border-gray-700/50 rounded px-1.5 py-0.5 bg-gray-800/30">
          Internal &middot; Confidential
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-zkeleton-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zkeleton-teal animate-pulse" />
          LIVE DATA
        </span>
        <span className="opacity-50">|</span>
        <span>FY 2024</span>
        <span className="opacity-50">|</span>
        <span>CMS / KFF / HHS OIG</span>
      </div>
    </header>
  );
}
