---
name: Kinetic Admin
colors:
  surface: "#10141a"
  surface-dim: "#10141a"
  surface-bright: "#353940"
  surface-container-lowest: "#0a0e14"
  surface-container-low: "#181c22"
  surface-container: "#1c2026"
  surface-container-high: "#262a31"
  surface-container-highest: "#31353c"
  on-surface: "#dfe2eb"
  on-surface-variant: "#c4c9ac"
  inverse-surface: "#dfe2eb"
  inverse-on-surface: "#2d3137"
  outline: "#8e9379"
  outline-variant: "#444933"
  surface-tint: "#abd600"
  primary: "#ffffff"
  on-primary: "#283500"
  primary-container: "#c3f400"
  on-primary-container: "#556d00"
  inverse-primary: "#506600"
  secondary: "#4edea3"
  on-secondary: "#003824"
  secondary-container: "#00a572"
  on-secondary-container: "#00311f"
  tertiary: "#ffffff"
  on-tertiary: "#472a00"
  tertiary-container: "#ffddb8"
  on-tertiary-container: "#8d5900"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#c3f400"
  primary-fixed-dim: "#abd600"
  on-primary-fixed: "#161e00"
  on-primary-fixed-variant: "#3c4d00"
  secondary-fixed: "#6ffbbe"
  secondary-fixed-dim: "#4edea3"
  on-secondary-fixed: "#002113"
  on-secondary-fixed-variant: "#005236"
  tertiary-fixed: "#ffddb8"
  tertiary-fixed-dim: "#ffb95f"
  on-tertiary-fixed: "#2a1700"
  on-tertiary-fixed-variant: "#653e00"
  background: "#10141a"
  on-background: "#dfe2eb"
  surface-variant: "#31353c"
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: "700"
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 34px
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: "700"
    lineHeight: 28px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 26px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 18px
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: "700"
    lineHeight: 12px
  data-display:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system drives a modern high-performance fitness club management platform engineered for gym owners, floor managers, and athletic directors. The aesthetic blends **High-Contrast Dark Mode** with **Precision Performance Engineering**—reminiscent of professional telemetry interfaces, luxury fitness hardware, and high-cadence training trackers.

### Personality & Emotional Response

- **High-Velocity & Decisive:** Operational workflows must feel instantaneous. High-contrast typography and razor-sharp status signaling eliminate cognitive lag on busy gym floors.
- **Relentless & Athletic:** Dark charcoal backdrops paired with radioactive electric lime accents evoke nocturnal training facilities, high-output conditioning, and focused intensity.
- **Technical Precision:** Data-heavy surfaces balance dense metrics with ergonomic, tap-friendly touch targets built for one-handed thumb navigation while on the move.

## Colors

The color palette is architected for maximum legibility against deep dark substrates, using energetic light frequencies to draw instantaneous focus to real-time gym telemetry, check-ins, and membership alerts.

### Palette Hierarchy & Intent

- **Primary (`#CCFF00` - Electric Volt):** The core brand accelerator. Reserved strictly for primary action drivers (quick check-in buttons, primary FABs, active state indicators, and peak performance metrics). Never used for dense body copy.
- **Secondary (`#10B981` - Emerald Glow):** Operational affirmation. Designates active memberships, successful billing reconciliations, access granted triggers, and positive capacity thresholds.
- **Tertiary (`#F59E0B` - Amber Flare):** Friction warnings and pending states. Flags upcoming renewals, maintenance holds, payment grace periods, and waitlists.
- **Critical / Overdue (`#EF4444` - Crimson Alert):** High-priority operational failure. Flags delinquent accounts, revoked turnstile access, and system alerts.
- **Neutral Substrates:**
  - Base canvas: `#0D1117` (Deep Obsidian Charcoal)
  - Surface Tier 1 (Cards, panels): `#161B22` (Graphite Slate)
  - Surface Tier 2 (Elevated controls, active sheets): `#21262D` (Muted Steel)
  - Subtle borders: `#30363D`
  - High-emphasis text: `#F0F6FC`
  - Secondary data copy: `#8B949E`

## Typography

Typography balances technical athleticism with ergonomic scan-ability.

- **Headlines & Metric Readouts (`Space Grotesk`):** Delivers a technical, sharp, and commanding posture. Key membership figures, real-time check-in counts, and capacity percentages use tight geometric letterforms that mirror performance timer readouts.
- **Body & Long-Form Lists (`Plus Jakarta Sans`):** Offers high legibility under motion. Its soft geometric shapes prevent eye strain in low-light gym environments and ensure compact membership rosters remain scannable.
- **Labels & Micro-Tags (`Space Grotesk`):** Set with a tight tracking profile in uppercase or semibold weights for high-speed verification of badge states (e.g., `VIP`, `ACTIVE`, `DUE`, `HOLD`).

## Layout & Spacing

This mobile-first system prioritizes single-handed navigation within physical fitness environments.

### Ergonomics & Grid Mechanics

- **Layout Model:** Fluid 4-column layout on mobile devices (`<600px`), shifting to an 8-column layout for companion tablet dashboards (`600px - 1024px`).
- **Touch Ergonomics:** All interactive admin triggers enforce a minimum bounding box of 48×48px. Primary controls are anchored in the bottom 40% of the viewport (the thumb zone) to allow operational tasks while holding equipment or clipboards.
- **Safe Dynamic Spacing:** Canvas margins scale from `1rem` on compact mobile devices to `1.5rem` on larger tablet devices, insulating content from edge bezel mistouches. Element gaps within card clusters use strict 8pt base rhythms (`space-sm` and `space-md`).

## Elevation & Depth

This system avoids heavy muddy drop shadows in favor of **Tonal Layering** and **Luminescent Low-Contrast Outlines**.

### Structural Stacking

- **Canvas Base (`#0D1117`):** The structural viewport foundation. Always flat and non-interactive.
- **Surface Level 1 (`#161B22`):** Primary card enclosures and list tiles. Outlined with a fine `1px` solid border in `#30363D` to define spatial limits without muddying dark mode clarity.
- **Surface Level 2 (`#21262D`):** Modal sheets, action drawers, and sticky header bars. Lifted via an ambient neon-tinted underglow: `0 8px 24px rgba(0, 0, 0, 0.6)`.
- **Active / Focused Interactive Elements:** Elevated through selective accent emission: a `1px` ring of `rgba(204, 255, 0, 0.35)` paired with a soft `0 0 16px rgba(204, 255, 0, 0.15)` bloom effect, signaling active hardware connection or live scanner recognition.

## Shapes

The design system adopts a balanced rounded visual architecture (Rounded level 2):

- **Cards & Data Modules:** Enclosed with `0.5rem` (8px) on inner sub-modules and `1rem` (16px) on overarching dashboard cards, providing an athletic, modern silhouette that avoids visual harshness.
- **Capsule Pills:** Status badges, operational filters, and micro tags use pure pill shapes (`9999px` radius) to visually distinguish state descriptors from square and semi-rounded action cards.
- **Interactive Buttons:** Primary CTAs use rounded corners (`0.75rem` / 12px) to optimize the thumb contact area and feel ergonomically weighted.

## Components

### Buttons

- **Primary Admin CTA:** Solid Electric Volt (`#CCFF00`) fill with obsidian text (`#0D1117`), set in `Space Grotesk` Bold. Height: 52px. Active press scales down slightly (`scale(0.98)`) for tactile response.
- **Secondary / Action Surface:** Background `#21262D`, text `#F0F6FC`, border `1px solid #30363D`. Used for auxiliary admin tools (e.g., "Filter Roster", "Export Log").
- **Destructive Action:** Low-opacity crimson wash (`rgba(239, 68, 68, 0.15)`) with vivid red label (`#EF4444`) and subtle crimson outline.

### Status Chips & Pills

- **Geometry:** Height 24px to 28px, pill-shaped (`radius: 9999px`), internal padding `0.25rem 0.75rem`.
- **Variants:**
  - _Active / Paid:_ Emerald background tint (`rgba(16, 185, 129, 0.12)`), text `#10B981`, with an active green pulse dot.
  - _Pending / Waitlist:_ Amber background tint (`rgba(245, 158, 11, 0.12)`), text `#F59E0B`.
  - _Overdue / Revoked:_ Crimson background tint (`rgba(239, 68, 68, 0.15)`), text `#EF4444`.

### Roster Lists & Member Rows

- **Structure:** Stacked list items wrapped in `#161B22` with a `1px solid #30363D` border.
- **Anatomy:** Left-aligned member avatar with high-visibility check-in badge, center block featuring primary member name in bold alongside membership type, and right-aligned quick-action thumb trigger (e.g., Quick Check-In toggle or overdue warning).
- **Separation:** `0.5rem` vertical spacing between floating row cards to eliminate mis-taps during active floor pacing.

### Data Metric Cards

- **Structure:** Elevated containers (`#161B22`) containing micro-label indicators, large data readouts (`Space Grotesk` 32px), and mini capacity sparklines.
- **Dynamic Lighting:** If a metric breaches threshold capacity (e.g., Gym Floor at 95%), the card header text and sparkline shift from Volt (`#CCFF00`) to Amber (`#F59E0B`) or Alert Red (`#EF4444`).

### Input Fields & Rapid Search

- **Structure:** Dark slate fields (`#161B22`) with inset borders (`#30363D`). Height: 48px minimum. Placeholder text in `#8B949E`.
- **Focus State:** Border transitions cleanly to Volt (`#CCFF00`) with no layout shift, accompanied by a quick barcode / QR scanning icon embedded inside the trailing edge.

### Checkboxes & Toggle Switches

- **Toggles:** High-contrast performance switches. Track shifts from muted slate (`#30363D`) to Electric Volt (`#CCFF00`) with a dark charcoal knob when engaged, delivering unambiguous validation from arm’s length.
