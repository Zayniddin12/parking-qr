import type { SVGProps } from 'react';

/** Clean 1.6px line icons for the business-panel shell (24×24, currentColor). */
const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const IconDashboard = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const IconWhitelist = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const IconBlacklist = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6l12.8 12.8" />
  </svg>
);

export const IconTariff = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1-.6-1.4V4a1 1 0 0 1 1-1h8.6a2 2 0 0 1 1.4.6l5.8 5.8a2 2 0 0 1 0 2.9z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);

export const IconReports = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <rect x="7" y="11" width="3" height="6" rx="0.6" />
    <rect x="12" y="7" width="3" height="10" rx="0.6" />
    <rect x="17" y="13" width="3" height="4" rx="0.6" />
  </svg>
);

export const IconPartners = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M17.5 20a5.5 5.5 0 0 0-3-4.9" />
  </svg>
);

export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12l4.5 4.5L19 7" />
  </svg>
);

export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M5 12h11" />
  </svg>
);

export const IconBuilding = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="12" height="18" rx="1.5" />
    <path d="M16 8h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-3" />
    <path d="M8 7h4M8 11h4M8 15h4" />
  </svg>
);
