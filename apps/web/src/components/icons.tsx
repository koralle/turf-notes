import type { ReactNode } from "react";

const Svg = ({ children, size }: { children: ReactNode; size: number }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.7}
    viewBox="0 0 24 24"
    width={size}
  >
    {children}
  </svg>
);

export const HomeIcon = ({ size = 20 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M3.5 10.6 12 3.6l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />
  </Svg>
);

export const TagIcon = ({ size = 20 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" />
    <circle cx="7.5" cy="7.5" r="0.8" />
  </Svg>
);

export const SettingsIcon = ({ size = 20 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M4 6h16M4 12h16M4 18h16" />
    <circle cx="9" cy="6" fill="currentColor" r="2" stroke="none" />
    <circle cx="15" cy="12" fill="currentColor" r="2" stroke="none" />
    <circle cx="8" cy="18" fill="currentColor" r="2" stroke="none" />
  </Svg>
);

export const SearchIcon = ({ size = 20 }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4.5 4.5" />
  </Svg>
);

export const PlusIcon = ({ size = 20 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const ChevronLeftIcon = ({ size = 20 }: { size?: number }) => (
  <Svg size={size}>
    <path d="m15 5-7 7 7 7" />
  </Svg>
);

export const CloseIcon = ({ size = 20 }: { size?: number }) => (
  <Svg size={size}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);
