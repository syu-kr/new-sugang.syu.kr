import {setResponseHeader} from 'h3'

import {listIndexableLegacyPages, siteUrl} from '~/shared/legacy-pages'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  const urls = listIndexableLegacyPages()
    .map(([, page]) => {
      return [
        '  <url>',
        `    <loc>${siteUrl}${page.path}</loc>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', urls, '</urlset>', ''].join('\n')
})
