# AutoParking — Frontend

All web surfaces for **AutoParking**, as a single pnpm/Turborepo monorepo:

| App | Persona | Served from |
|---|---|---|
| `apps/backoffice` | **Validation Backoffice** — platform owner + staff, all-tenant god-view | Cloud |
| `apps/business-panel` | **Business Panel** — each operator manages their own branches | Cloud |
| `apps/attendant` | **Attendant Panel** — on-site lane monitor (cameras + live ledger + manual actions) | Edge-served (LAN-fast) |
| `apps/kiosk` | **Kiosk / POC** — self-service payment, subscription, discount QR | Edge-served |

Shared: `packages/ui` (design system), `packages/api-client`, `packages/realtime`
(SSE + WebRTC/WHEP), `packages/i18n` (uz / ru / en).

> **Design:** see [`../Backend/docs/ARCHITECTURE.md`](../Backend/docs/ARCHITECTURE.md)
> §11 (attendant UX & realtime) and §13.3 (structure).

## Stack (`docs/ARCHITECTURE.md` §12)

- **React 18 + TypeScript + Vite** — `build.sourcemap: 'hidden'` (**never ship
  sourcemaps** — the legacy app was rebuilt verbatim from them).
- **TanStack Query** for data; **SSE** for the live event ledger; **WebRTC (WHEP)**
  via go2rtc for live camera tiles (sub-second, LAN-direct at the booth).
- i18n uz/ru/en (preserved from the legacy app).

## Protection (§10.6)

- **Zero business logic in the browser** — no pricing math, no discount rules, no
  barrier authorization, no secrets. All of it lives server-side / in the Rust edge.
- Thin client, scoped HttpOnly tokens, CSP/SRI; optional obfuscation/WASM as
  speed-bumps only.

## Existing designs — alignment pass (§13.4)

The owner has existing **Figma** designs and GitLab frontends
(`validation/gateway-frontend` = Backoffice, `validation/frontend/business-panel`).
These will be reconciled into `apps/backoffice` and `apps/business-panel`: import
Figma tokens into `packages/ui`, map components via Figma Code Connect, reuse
recovered **domain** knowledge (not the sourcemap-exposed structure) from the legacy
analysis. **[Pending: repo access + Figma links.]**

## Status

Phase 0. Scaffold only — see roadmap in `../Backend/docs/ARCHITECTURE.md` §14.

---
© Solo IT Company — proprietary. All rights reserved. See [LICENSE](LICENSE).
