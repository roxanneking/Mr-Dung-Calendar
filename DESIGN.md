# DESIGN.md

## Metadata

- Product: Calendar Mr Dũng
- Surface type: Operational scheduling interface with admin and executive read-only views
- Source of truth: Current implementation in `src/app`, `src/components`, `tailwind.config.ts`, and `src/app/globals.css`

## Design Intent

The visual system should communicate reliability and composure while supporting fast schedule operations and clear executive scanning. UI expression should remain restrained, with hierarchy and spacing doing most of the communication work.

## Theme

- Mode: Light-first
- Body background: vertical soft gradient from mint-tinted off-white to white (`linear-gradient(180deg, #f7fdfa 0%, #ffffff 48%)`)
- Overall contrast model: dark slate text on light surfaces
- Tone target: trustworthy calm

## Color System

### Brand Palette (Tailwind `brand`)

- `brand-50`: `#ecfdf3`
- `brand-100`: `#d1fae5`
- `brand-200`: `#a7f3d0`
- `brand-300`: `#6ee7b7`
- `brand-400`: `#34d399`
- `brand-500`: `#10b981`
- `brand-600`: `#059669`
- `brand-700`: `#047857`
- `brand-800`: `#065f46`
- `brand-900`: `#064e3b`
- `brand-950`: `#022c22`

### Role Guidance

- Primary actions and key accents: `brand-600` to `brand-700`
- Light surface highlights and section framing: `brand-50` to `brand-100`
- Strong headings and high-emphasis labels: `brand-900` to `brand-950`
- Neutral text and secondary labels: slate scale (`text-slate-*`)

### Status and Priority Usage

- Event priority badges use explicit per-priority colors from event constants.
- Keep status colors semantically stable across admin and boss views.
- Do not rely on color alone when a status can impact decisions; pair with text labels.

## Typography

- Font family: Nunito (`next/font/google`) with latin + vietnamese subsets
- Weights in use: `400`, `500`, `600`, `700`, `800`
- Current hierarchy example:
  - Page title: `text-2xl font-semibold`
  - Section labels/meta: `text-sm` to `text-base`
  - Dense operational detail: compact body sizes with strong spacing rhythm

Guidance:
- Keep heading hierarchy explicit and sparse.
- Prefer readable, medium-weight body text over thin styles.
- Preserve Vietnamese readability in mixed operational text.

## Elevation and Surfaces

- Primary elevated container pattern:
  - Rounded corners: `rounded-2xl`
  - Border: light brand tint (for example `border-brand-100`)
  - Background: white
  - Shadow: `shadow-soft` (`0 8px 30px rgba(2, 44, 34, 0.1)`)
- Use elevation to separate functional zones, not as decorative repetition.

## Layout and Composition

- Global page width pattern: centered container up to `max-w-7xl` with responsive side padding.
- Primary calendar UX composition:
  - Day detail panel for immediate context.
  - Month grid for navigation and overview.
- Admin mode supports denser information operations (filtering, selection, sorting, export).
- Boss mode favors scanning and read clarity with reduced interaction complexity.

## Component Patterns

- Core primitives: `Button`, `Input`, `Textarea`, `Select`, `Modal`, `Badge`
- Domain blocks:
  - `MonthCalendar`
  - `DayEventsPanel`
  - `EventFormModal`
  - `AdminDashboard`
  - `PublicCalendarView`

Behavioral guidance:
- Keep control styling consistent across admin and boss surfaces.
- Modals should be used for focused editing tasks, with clear keyboard/focus handling.
- Badge styles should remain semantically consistent with event metadata.

## Motion and Interaction

- Motion should remain subtle and purpose-driven.
- Favor feedback motion for state transitions and visibility changes over decorative animation.
- Respect reduced-motion preferences for non-essential transitions.

## Accessibility Baseline

Target: WCAG 2.1 AA

Implementation expectations:
- Keyboard navigation across navigation, filters, calendar cells, and dialogs.
- Persistent visible focus indicators.
- Text and control contrast that meets AA thresholds.
- Reduced-motion accommodation for animated transitions.
- Semantic labeling for form fields and actionable controls.

## Do / Avoid

Do:
- Prioritize scan clarity for dates, times, owners, and status.
- Keep visual language calm and structured.
- Reuse existing spacing and elevation patterns for consistency.

Avoid:
- Generic KPI-style card mosaics that obscure workflow.
- Overly decorative gradients, blur-heavy glass effects, and novelty styling.
- Inconsistent status colors between admin and boss views.
