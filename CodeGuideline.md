# Code Guideline

## Project Structure Overview

```
project-root/
  ├── i18n.config.json       # i18n manifest for supported locales and language metadata
  ├── public/
  │   └── locales/           # public/locales/{code}.json translation files
  ├── supabase/
  │   ├── config.toml        # backend function settings
  │   └── functions/         # server-side backend functions
  │       ├── project-scoping/       # AI: project-specific intake questions
  │       └── simulation-insights/   # AI: risks, feasibility, improvements
  ├── src/
  │   ├── components/        # All reusable UI components
  │   │   ├── ui/            # Prebuilt and custom UI components, grouped by function
  │   │   ├── common/        # Cross-page primitives (cards, badges, headers, empty states)
  │   │   ├── form/          # Input controls: intake fields, chips, line-item editors
  │   │   ├── layout/        # App shell: sidebar, topbar, layout, protected route
  │   │   └── simulation/    # Charts, KPI grid, scenario tables, AI panels
  │   ├── hooks/             # Custom React hooks (data access + mutations)
  │   ├── i18n/              # i18n runtime: config.ts (entry) + util.ts (helpers)
  │   ├── integrations/      # Generated backend client (do not edit)
  │   ├── lib/               # Utility functions and libraries
  │   │   ├── ai/            # AI payload builders, typed invokers, response types
  │   │   ├── api/           # Row/domain types and status normalisers
  │   │   ├── domain/        # Selectable option values + literal-key label lookups
  │   │   └── simulation/    # Deterministic engine: types, engine, metrics, sensitivity
  │   ├── pages/             # Application pages (each page in its own subdirectory)
  │   ├── providers/         # React context providers (auth session)
  │   ├── App.tsx            # Main app component, sets up route providers
  │   ├── router.tsx         # Router config, sets up routing
  │   ├── main.tsx           # Entry point for the React app
  │   └── index.css          # Global styles
  ├── package.json           # Project metadata and scripts
  ├── tailwind.config.ts     # Tailwind CSS configuration
  └── ...                    # Other config and lock files
```

> Backend-handoff temporary files (`scripts/`, `i18n.scan.json`, `reports/i18n/`, `docs/i18n-*.md`) are kept in the repo only until backend integration of i18n statistics/scan/auto-translate is complete. They are owned by the backend long-term and will be removed once integration lands. Treat them as read-only handoff copies — do not extend them.

## Directory Responsibilities

- **public/**: Static files served directly. Place images, icons, and robots.txt here.
- **public/locales/**: Translation files, one per language (`{code}.json`). Flat dotted keys (e.g. `home.hero.title`); the `fallbackLng` file is the structural source of truth.
- **i18n.config.json**: The lightweight i18n manifest for fallback language, language labels, browser detection aliases, and document direction. Single source of truth for the language list.
- **src/components/**: All UI components.  
  - **ui/**: Contains atomic and composite UI components.  
  - *Group related components into subdirectories if they share a domain or feature (e.g., `form/`, `charts/`).*
- **src/hooks/**: Custom React hooks. Each file should export a single hook focused on one responsibility.
- **src/i18n/**: Two files only.
  - `config.ts` is the runtime entry: imports the manifest via `util.ts`, initializes i18next (HTTP backend, language detector, react binding), syncs `<html lang/dir>`, and re-exports the helpers. Importing this file for its side effect boots i18next.
  - `util.ts` holds pure helpers parsed from the manifest: `fallbackLng`, `supportedLngs`, `languageOptions`, `normalizeLanguage`, `getLanguageDirection`, plus types.
  - Components use the official `useTranslation()` from `react-i18next` directly; there is no project-specific `useT` wrapper.
- **src/lib/**: Utility functions and libraries that are not React components or hooks.
  - **lib/simulation/**: The deterministic financial engine. Pure functions only — the same input always
    produces the same output, with no network or AI dependency. Every figure the user sees comes from here.
    AI output is stored separately (`simulation_runs.ai_insights`) and must never overwrite a computed value.
  - **lib/ai/**: Payload builders and typed invokers for the backend AI functions. A failing or disabled AI is
    reported as `unavailable` or `error` and rendered as such; never synthesise AI-shaped output.
  - **lib/domain/**: Selectable option values plus label lookups. Labels are resolved through literal `t()`
    switches so the i18n scanner can see every key.
- **src/providers/**: React context providers. `auth-provider.tsx` owns the session and exposes `useAuth()`.
- **src/pages/**: All route-level pages.  
  - *Each page should have its own subdirectory if it contains more than a single file or has related logic/components.*
  - **pages/auth/**: the shared sign-in surface — `AuthShell` (62/38 two-column layout),
    `CinematicHero`, `AuthPanel` (view state), `LoginForm`, `SignupForm`, `ResetPasswordForm`,
    `SetPasswordForm`. `pages/login`, `pages/signup` and `pages/reset-password` are thin wrappers.
  - **pages/projects/detail/**, **pages/simulations/new/**: page-local subcomponents live beside their page.
- **supabase/functions/**: Backend functions, one responsibility each. Read the AI/backend skills before editing.
- **src/App.tsx**: Sets up global providers.
- **src/router.tsx**: Sets up routing.
- **src/main.tsx**: Application entry point.

**Important:**
Whenever a new module (such as a component, hook, or utility) or a new page is added or removed, this document **must be updated immediately** to reflect the changes. Keeping this documentation up to date ensures that all collaborators have a clear understanding of the current project structure and its intended organization.

## How to Add New Code

### 1. Adding a New Page

- **Create a subdirectory under `src/pages/` for each new page.**
  - Example: For a "Dashboard" page, create `src/pages/dashboard/`.
- **Place the main page component as `index.tsx` inside the subdirectory.**
- **Add any page-specific components or logic in the same subdirectory.**
- **Register the new route in `src/router.tsx and generate a semantic name.**
  - Example:
    ```tsx
    import Dashboard from "./pages/dashboard";
    // ...
    {
      path: "/dashboard",
      name: 'dashboard',
      element: <Dashboard />
    }
    ```

### 2. Adding a New Component

- **If you are adding a group of related components, create a subdirectory (e.g., `form/`, `charts/`).**
- **If the component is only used by a specific page, place it in that page's subdirectory under `src/pages/`.**
- **Each component should be focused on a single responsibility.**
- **Small files (< 100 lines) are encouraged for a single component.**

### 3. Adding a New Hook

- **Create a new file in `src/hooks/` named after the hook (e.g., `use-feature.ts`).**
- **Each file should export only one hook.**
- **Hooks should be as small and focused as possible.**

### 4. Adding Utilities

- **Add utility functions to `src/lib/`.**
- **Group related utilities in the same file or subdirectory if needed.**

### 5. Adding or Updating Languages

- **Language metadata must go through `i18n.config.json`.**
- **Do not hardcode supported languages, labels, browser detection aliases, or RTL direction lists in `src/i18n/*.ts`.**
- **Locale content lives in `public/locales/{code}.json`** as flat dotted-key JSON; the `fallbackLng` file owns the canonical key set.
- **Runtime code reads the manifest only through `src/i18n/util.ts`.** Adding or removing a language means editing `i18n.config.json` plus the matching `public/locales/{code}.json`; nothing in `src/i18n/` needs to change.
- **Translations are read with the official `useTranslation()` from `react-i18next`.** No custom hook, no cast at call sites.

## Coding Best Practices

- **One module, one responsibility:**  
  Each file (component, hook, utility) should do one thing only.
- **High cohesion, low coupling:**  
  Keep related logic together and avoid unnecessary dependencies between modules.
- **Naming conventions:**  
  - Use `PascalCase` for components and page directories.
  - Use `camelCase` for hooks and utility functions.
  - Name page subdirectories and files after their route or feature.
- **Component structure:**  
  - Keep components small and focused.
  - Extract subcomponents if a component grows too large.
- **Page structure:**  
  - Place all logic, hooks, and components specific to a page in its subdirectory.
  - Only share code via `components/`, `hooks/`, or `lib/` if it is truly reusable.
- **Documentation:**  
  - Add comments for complex logic.
  - Document the purpose of each module at the top of the file if not obvious.

## Design system rule (warm Mediterranean editorial)

The five brand colours are declared once in `src/index.css` and are never used
directly in components — everything reads semantic tokens:

| Exact value | Token | Role |
|---|---|---|
| #5E3013 deep brown | `--brand-brown` | headings, body copy, emphasis |
| #DDAC80 warm beige | `--brand-beige` | decorative rules, secondary button surface |
| #A56733 terracotta | `--brand-terracotta` | selection borders, focus, icon accents |
| #F8F4EC ivory | `--brand-ivory` | page background |
| #7DDBF4 sky blue | `--sky` | chart fills, areas, reference lines |

**The one deviation rule:** fills and decoration use the exact brand value, while
text and control boundaries use a one-step deeper tone of the same hue
(`--primary` for terracotta buttons, `--border`/`--input` for hairlines,
`--sky-ink` where sky must carry a stroke or text). This is what keeps every text
and control pair at or above the contrast it needs — `#A56733` on ivory is
4.2:1, which fails AA for button labels, and `#DDAC80` borders at 1.9:1 are too
faint to read as a field boundary.

Additional fixed rules:

- Titles use `.font-display` (Fraunces → Noto Serif KR); body copy, labels,
  table cells and **every figure** stay in the sans stack with `.tabular`.
- Scenario series always use `--scenario-*`, so optimism reads as the same colour
  in every chart. `--chart-*` is for non-scenario series only.
- Sky blue stays scarce: bar/area fills, reference lines, and the AI badge.
- No gradients except `.hero-scrim`, which exists to keep the sign-in copy
  legible over the hero photograph.
- `.dark` values are warm-dark only; no theme toggle is offered.

## Sign-in media and copy

- Hero stills live in `public/media/` and are listed in `src/lib/media/hero-media.ts`.
  To use a clip, drop `public/media/lemon-tree.mp4` (muted, seamless loop) and point
  `HERO_VIDEO_SRC` at it; the hero autoplays it and falls back to the still on error
  or when `prefers-reduced-motion` is set. While the constant is empty no video
  request is made.
- The sign-in hero carries the product statement (`auth.tagline.primary` /
  `auth.tagline.secondary`) instead of a brand mark, and both lines are stored
  identically in every locale because they always appear together. No invented
  product name is used anywhere in the interface.

## Domain notes

- Every numeric result on screen is computed by `src/lib/simulation/engine.ts` and is badged as computed.
  Anything written by a model is badged as an AI estimate and lives in its own panel.
- `project_inputs.data` is the canonical engine input; `simulation_runs` keeps an immutable snapshot per run,
  which is what makes project-to-project and run-to-run comparison possible.
- `scenario_overrides` on a project (and the adjustment recorded inside each stored scenario) are what bend the
  base inputs into the optimistic and pessimistic cases.

## Example: Adding a New "Profile" Page

1. **Create a directory:**  
   `src/pages/profile/`
2. **Add the main page component:**  
   `src/pages/profile/index.tsx`
3. **Add page-specific components:**  
   `src/pages/profile/ProfileHeader.tsx`, `src/pages/profile/ProfileDetails.tsx`
4. **Register the route in `App.tsx`:**
   ```tsx
   import Profile from "./pages/profile";
   // ...
   <Route path="/profile" element={<Profile />} />
   ```
5. **If you need a reusable button, add it to `src/components/ui/button.tsx`.**
