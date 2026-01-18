# Skill: UI & Design System Standards

## Context
The application uses a premium, industrial-modern aesthetic built with Next.js, Radix UI (via Shadcn), and Tailwind CSS.

## Theming & Branding
1. **Dynamic Theming**: Use the `ThemeContext.tsx` to access tenant-specific branding (colors, logo).
2. **CSS Variables**: Global styles are derived from CSS variables injected by the `ThemeProvider`.
3. **Branding Consumption**:
   ```tsx
   const { config } = useTheme();
   const primaryColor = config?.branding?.primaryColor;
   ```

## Component Architecture
1. **Atomic Components**: Use `components/ui` for base elements (Button, Input, Card).
2. **Layout Components**: 
   - `Sidebar` and `Header` handle navigation and context switching.
   - Use `DashboardLayout` for most internal pages.
3. **Complex Widgets**: Data-heavy components (like `WorkOrderBoard` or `AssetTree`) should be modularized in their respective feature folders.

## Styling Guidelines
- **Tailwind Only**: Avoid inline styles or custom CSS modules unless absolutely necessary.
- **Responsiveness**: All layouts MUST be mobile-first and use grid/flexbox for reflowing content.
- **Density**: Maintain "Comfortable" density for industrial applications. Don't hide important info behind too many clicks.

## Data Fetching (TanStack Query)
- Use `useQuery` for fetching and `useMutation` for updates.
- **Invalidation**: Always invalidate related queries in `onSuccess` to keep the UI in sync.
- **Loading States**: Use `Skeleton` loaders or localized spinners for a "premium" feel. NEVER leave the screen blank during fetches.

## Common Pitfalls
- **Hardcoded Colors**: NEVER use hex codes like `#2563eb` for primary actions. Use Tailwind classes that respond to the theme or the `config.branding` object.
- **Inconsistent Spacing**: Stick strictly to the Tailwind spacing scale (`p-4`, `m-6`, etc.).
