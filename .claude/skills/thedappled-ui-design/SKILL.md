---
name: thedappled-ui-design
description: Design and build UI for Thedappled and its Compiler so both look like one product. Use for any new page, screen, component, restyle or "improve the UI" request. Enforces the design-first rule (Penpot first, then code) and the shared design tokens.
---

# Thedappled UI design

Thedappled (this repo) and the Compiler (`c-architech-compiler`) share one visual identity. Follow this skill whenever you add or change UI.

## 1. Workflow: design first, then code

1. **Design in Penpot first.** Team "theDappled", project **thedappled**.
   - One file per page, named `NN - Page Name` (site) or `C1`, `C2`, ... (compiler).
   - New page: create a new file. Changed page: update its file. Keep the current UI screenshot next to the new design so they can be compared.
2. **Wait for the user's OK on the design** before changing code, unless they say to skip it.
3. **Then update the UI code** to match the design. Say which Penpot file you used.
4. Verify: typecheck, lint the files you touched, and look at the page in a browser (light and dark, desktop and phone width).

Never put invented data (fake stats, testimonials, prices, ratings) on a live page. If a design needs placeholder content, mark it as a placeholder and leave it out of the code unless it comes from real data.

## 2. Design tokens

**Fonts:** Inter for UI text. JetBrains Mono only for code, addresses and the console.

**Neutrals (Tailwind slate):** text `slate-900` (dark mode `slate-50`), muted `slate-500` / `slate-400`, borders `slate-200` / `slate-800`, page background `slate-50` / `slate-950`, cards white / `slate-900`.

**Accents, one per product area:**

| Area | Colour | Soft background |
|---|---|---|
| Courses, primary actions, links | blue-600 `#2563eb` | blue-100 |
| Books, learning | purple-600 `#9333ea` | purple-100 |
| Blogs, AI, success | emerald-500 `#10b981` | emerald-100 |
| Warnings, waiting | amber-500 `#f59e0b` | amber-100 |

The logo accent blue is `#3987e5`.

**Shape:** cards `rounded-2xl` with a 1px border and little or no shadow; buttons and inputs `rounded-lg` to `rounded-xl` (8 to 12px); pills `rounded-full`. Sharp-cornered, all-caps, `SNAKE_CASE` styling is not part of this identity.

**Text:** sentence case, plain words ("Stack is empty", not `STACK_BUFFER_EMPTY`). Headings bold and tight (`font-bold tracking-tight`). No decorative noise textures or glows.

**Themes:** light by default, dark supported through the theme toggle. Every colour needs a dark counterpart. Code surfaces are always dark.

**Header (both products):** logo on the left, centred navigation, right side with theme toggle and the primary action. The Compiler header adds a "Compiler" badge, a Compiler / Learning Path / Revision Lab switcher and a "Back to Thedappled" button.

**Logo:** always the real logo (`app/_components/logo.tsx` here, `app/components/Logo.tsx` in the compiler), never a placeholder tile. The mark is five rounded squares (stem, top bar, bottom bar in the foreground colour, two `#3987e5` blocks), followed by the "Thedappled" wordmark and a small trademark sign. The favicon is `app/icon.svg` in both repos.

## 3. Penpot tips

- Build the design as an SVG (1440 wide for desktop pages) and import it into the Penpot file through the image-upload input; position boards by editing X and Y.
- Keep boards 1440x900 for a screen, or 1440 x full height for a long page. Place the current screenshot and the new design side by side.

## 4. Code conventions

- Tailwind classes must be static strings. Do not build class names like `text-${color}-400`; use a lookup map.
- Reuse existing components (`Button`, `Card`, `AppLogoLink`) before writing new ones.
- Signed-out visitors must never be sent to a login page by a public link. Public logo and nav links go to `/`.
- Keep links to the other product in one place (compiler: `NEXT_PUBLIC_DAPPLED_URL`; site: the Compiler link points at `https://c-architech-compiler.vercel.app/?tab=compiler`).
