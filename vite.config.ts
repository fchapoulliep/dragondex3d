import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import characters from './src/data/dragoncharacters.json'

const SITE_URL = 'https://fchapoulliep.github.io/dragondex3d/'
const SITE_NAME = 'DragonDex 3D'

type Character = (typeof characters)[number]

/** What a character page says about itself in search results and link previews. */
const pageMeta = (c: Character) => ({
  title: `${c.name} | ${SITE_NAME}`,
  description: `${c.name} (${c.saga}) in 3D: ${c.description}`,
  url: `${SITE_URL}${c.id}`,
  image: `${SITE_URL}sprites/${encodeURIComponent(c.name)}.png`,
})

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Rewrites one tag of index.html, and fails the build if the tag is missing. */
const rewrite = (html: string, tag: RegExp, replacement: (...groups: string[]) => string) => {
  if (!tag.test(html)) throw new Error(`github-pages-routes: ${tag} not found in index.html`)
  return html.replace(tag, (_, ...groups) => replacement(...groups))
}

const setMeta = (html: string, key: string, value: string) =>
  rewrite(
    html,
    new RegExp(`<meta (name|property)="${key}" content="[^"]*" />`),
    (attr) => `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`,
  )

/**
 * GitHub Pages has no fallback for a single-page app: it serves a file, or
 * else its 404 page. Each character gets its own copy of index.html (12.html
 * answers /dragondex3d/12), with its own title, description, share image and
 * canonical URL, so search engines see one page per character. 404.html
 * loads the app on any other path, and the sitemap is written from the same
 * data, so it never goes stale.
 */
const githubPagesRoutes = (): Plugin => ({
  name: 'github-pages-routes',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const indexHtml = bundle['index.html']
    if (indexHtml?.type !== 'asset') throw new Error('github-pages-routes: index.html not built')
    const index = String(indexHtml.source)

    const unique = [...new Map(characters.map((c) => [c.id, c])).values()]
    for (const c of unique) {
      const meta = pageMeta(c)
      let html = rewrite(index, /<title>[^<]*<\/title>/, () => `<title>${escapeHtml(meta.title)}</title>`)
      html = rewrite(html, /<link rel="canonical" href="[^"]*" \/>/, () => `<link rel="canonical" href="${meta.url}" />`)
      html = setMeta(html, 'description', meta.description)
      html = setMeta(html, 'og:title', meta.title)
      html = setMeta(html, 'og:description', meta.description)
      html = setMeta(html, 'og:url', meta.url)
      html = setMeta(html, 'og:image', meta.image)
      // The size tags describe the home page image, not the character sprites.
      html = html.replace(/\s*<meta property="og:image:(width|height)" content="\d+" \/>/g, '')
      this.emitFile({ type: 'asset', fileName: `${c.id}.html`, source: html })
    }

    this.emitFile({
      type: 'asset',
      fileName: '404.html',
      source: index.replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>'),
    })

    const urls = [SITE_URL, ...unique.map((c) => `${SITE_URL}${c.id}`)]
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
        '</urlset>',
        '',
      ].join('\n'),
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), githubPagesRoutes()],
  base: '/dragondex3d/',
  assetsInclude: ['**/*.hdr', '**/*.glb']
})
