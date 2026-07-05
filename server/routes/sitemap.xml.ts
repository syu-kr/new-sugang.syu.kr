import {setResponseHeader} from 'h3'

import {listAvailableTerms} from '~/server/utils/data'
import {listIndexableLegacyPages, siteUrl} from '~/shared/legacy-pages'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  const availableTerms = await listAvailableTerms()
  const urls = listIndexableLegacyPages()
    .flatMap(([name, page]) => {
      const pageUrl = `${siteUrl}${page.path}`
      const entries = [
        [
          '  <url>',
          `    <loc>${escapeXml(pageUrl)}</loc>`,
          `    <changefreq>${page.changefreq}</changefreq>`,
          `    <priority>${page.priority.toFixed(1)}</priority>`,
          '  </url>',
        ].join('\n'),
      ]

      if (name === 'basket') {
        availableTerms.slice(1).forEach((term) => {
          const [year, semester] = term.split('-')
          const termUrl = `${pageUrl}?year=${year}&semester=${semester}`
          entries.push(
            [
              '  <url>',
              `    <loc>${escapeXml(termUrl)}</loc>`,
              `    <changefreq>${page.changefreq}</changefreq>`,
              `    <priority>${page.priority.toFixed(1)}</priority>`,
              '  </url>',
            ].join('\n'),
          )
        })
      }

      return entries
    })
    .join('\n')

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', urls, '</urlset>', ''].join('\n')
})
