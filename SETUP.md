# Docs site — wire-up

This bundle is a VitePress docs site for `smart-enums`, built the same way as the ioc-manifest site. Drop it into the repo root and add three small things to wire it up.

## 1. Copy files into the repo

```
docs/                              → repo root
.github/workflows/deploy-docs.yml  → repo root
```

So you end up with `smart-enums/docs/...` and `smart-enums/.github/workflows/deploy-docs.yml`.

## 2. Add the docs scripts + VitePress dependency

In the **root** `package.json`, add the scripts:

```jsonc
{
  "scripts": {
    // ... existing scripts ...
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

Then install VitePress as a root dev dependency:

```bash
npm install -D vitepress
```

(The repo is an npm-workspaces monorepo; installing at the root is correct. The deploy workflow runs `npm ci` at the root, which picks it up.)

## 3. Ignore the build output

Add to the root `.gitignore`:

```
docs/.vitepress/dist
docs/.vitepress/cache
```

## Run locally

```bash
npm run docs:dev      # dev server with hot reload
npm run docs:build    # production build → docs/.vitepress/dist
npm run docs:preview  # preview the built site
```

## Deploy

The workflow deploys to GitHub Pages on every push to `main` that touches `docs/**`. One-time setup in the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions.** After that it's automatic. The site serves from:

```
https://reharik.github.io/smart-enums/
```

The `base: "/smart-enums/"` in `docs/.vitepress/config.ts` matches that path. If you ever move to a custom domain or a user/org page, drop the `base` line.

## Notes

- **Accent color:** the site uses a violet brand (`docs/.vitepress/theme/`) to read as a sibling of ioc-manifest's green without being identical. Delete `theme/custom.css` and the import in `theme/index.ts` to fall back to the default green.
- **Content source:** every page is reorganized from the package READMEs as of this build. The READMEs and the docs are now two surfaces over the same material — when you change one, glance at the other.
- **Package versions** are pinned in `docs/packages/overview.md` at the versions current at build time; update when you publish.
