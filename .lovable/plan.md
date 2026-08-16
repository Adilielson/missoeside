# Plan to Rename "Blog" to "News"

Rename all occurrences of "Blog" to "News" across the application, including UI text, headlines, navigation, SEO metadata, and routes.

## User Review Required

> [!IMPORTANT]
> This change will rename the URL from `/blog` to `/news`. Existing links to `/blog` will no longer work unless a redirect is implemented.

## Proposed Changes

### Routes and Navigation
- Rename route files:
  - `src/routes/blog.tsx` -> `src/routes/news.tsx`
  - `src/routes/blog.index.tsx` -> `src/routes/news.index.tsx`
  - `src/routes/blog.$slug.tsx` -> `src/routes/news.$slug.tsx`
- Update all navigation links:
  - `Navbar.tsx`: Change label "Blog" to "News" and href to `/news`.
  - `Footer.tsx`: Change label "Blog" to "News" and href to `/news`.
  - `Blog.tsx` (section): Change ID to `#news` and links to `/news`.

### UI Text and Headlines
- Update "Nosso Blog" to "News" or "IDE News" in `Blog.tsx` and `news.index.tsx`.
- Update back links (e.g., "Voltar para Blog" -> "Voltar para News").
- Update placeholders (e.g., "Carregando blog..." -> "Carregando news...").
- Update admin dashboard labels and headlines.

### SEO and Metadata
- Update `<title>` tags from "Blog IDE" to "News IDE".
- Update `<meta name="description">` content that mentions "blog".
- Update OpenGraph tags.

### Code Consistency
- Rename `Blog` component to `News` in `src/components/sections/Blog.tsx`.
- Update imports and usage in `src/routes/index.tsx`.

## Technical Details
- Using `mv` to rename route files.
- Using `line_replace` to update text and identifiers.
- The `routeTree.gen.ts` will auto-update after file changes.
