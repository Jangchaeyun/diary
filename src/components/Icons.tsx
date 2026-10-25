type IconProps = { size?: number };

function base(size = 22) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    preserveAspectRatio: "xMidYMid meet",
    style: { width: size, height: size, flex: "none", display: "block" } as const,
    "aria-hidden": true,
  };
}

export function HomeIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6.5 11 12 4l5.5 7V21h-11z" />
      <path d="M10.6 21v-5h2.8V21" />
    </svg>
  );
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M4 10h16" />
    </svg>
  );
}

export function PenIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 20l4.2-1.1L19 8.1a1.8 1.8 0 0 0 0-2.5L18.4 5a1.8 1.8 0 0 0-2.5 0L4 16.8V20z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function BookIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 8H20" />
    </svg>
  );
}

export function HeartIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 19s-7-4.2-7-8.2A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 7 2.8C19 14.8 12 19 12 19z" />
    </svg>
  );
}

export function PlusIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function CloseIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  );
}

export function ChevronIcon({ size, direction = "left" }: IconProps & { direction?: "left" | "right" }) {
  const icon = base(size);
  return (
    <svg {...icon} style={{ ...icon.style, transform: direction === "right" ? "scaleX(-1)" : undefined }}>
      <path d="M14.5 6.5 8.5 12l6 5.5" />
    </svg>
  );
}
