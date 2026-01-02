---
trigger: always_on
---

Design System & UI Standards
Visual Identity ("The Premium Standard")

    Typography: Use Inter or Geist Sans. Hierarchy must be clear (H1 > H2 > H3).

    Spacing: STRICT usage of Tailwind spacing scale. No magic numbers (e.g., margin: 13px). Use p-4, m-6, gap-4.

    Layout:

        Avoid Fixed Heights: Never use h-screen on internal containers that might overflow. Use min-h-0 and flex-1 for scrollable areas.

        Z-Index: Manage layering strictly. Modals > Dropdowns > Sticky Headers > Content.

        Responsiveness: ALL layouts must collapse gracefully to mobile. No horizontal scrolling on the body.

Component Strategy

    Cards: Use distinct shadows (shadow-sm, shadow-md) and borders (border-gray-200) to define distinct zones.

    Data Density: For tables and trees, use "Comfortable" density. Do not cram text.

    Contrast: Ensure text color is accessible (WCAG AA). Use text-gray-900 for primary, text-gray-500 for secondary.