# SEO Review Plan - Agência Cristã Missionária IDE

The goal is to optimize the website for search engines (Google), ensuring all pages have proper metadata, semantic structure, and social sharing optimization.

## Proposed Changes

### 1. Global Metadata & Technical SEO
- Update `index.html` with improved descriptive meta tags and language settings.
- Ensure the PWA manifest is correctly linked for mobile discovery.

### 2. Semantic HTML & Headings
- Audit and adjust heading hierarchies (`H1`, `H2`, `H3`) across main components to ensure one `H1` per page and logical nesting.

### 3. Dynamic SEO for Routes
- Implement `react-helmet-async` or a similar solution to manage dynamic metadata for:
    - **Blog Posts**: Title and description based on post content.
    - **Project Pages**: Title and description based on specific mission projects.
    - **Static Routes**: Unique titles and descriptions for "Sobre", "Doar", "Projetos", etc.

### 4. Image Optimization
- Add `alt` text to images where missing.
- Ensure images use descriptive file names (handled via asset naming).

### 5. Content & Keywords
- Review main headings to include relevant keywords like "Agência Missionária", "Doação Cristã", "Missões Mundiais", "Evangelho".

## Technical Details

- **Head Management**: I will install `react-helmet-async` to allow each route component to define its own `<title>` and `<meta>` tags dynamically.
- **Index.html**:
    - Add `lang="pt-BR"`.
    - Update `<title>` to a more keyword-rich version: "Agência Cristã Missionária IDE | Transformando Vidas no Mundo".
- **Dynamic Routes**:
    - In `src/routes/blog.$slug.tsx`, metadata will reflect the article's title.
    - In `src/routes/projeto.$slug.tsx`, metadata will reflect the project's name.

```typescript
// Example for Dynamic SEO
<Helmet>
  <title>{post.title} | IDE Blog</title>
  <meta name="description" content={post.excerpt} />
  <meta property="og:title" content={post.title} />
  <meta property="og:image" content={post.cover_image} />
</Helmet>
```
