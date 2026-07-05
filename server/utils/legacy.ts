import {readFile} from 'node:fs/promises'
import {join} from 'node:path'

import type {LegacyAssetAttributes, LegacyPageDocument, LegacyScriptAsset} from '~/shared/legacy-page-document'
import {
  defaultOgImage,
  getLegacyPageDefinition,
  legacyPageFiles,
  resolveLegacyPageName,
  siteUrl,
  type LegacyPageName,
} from '~/shared/legacy-pages'

const HTML_ATTRIBUTES_PATTERN = /<html\b([^>]*)>/i
const HEAD_CONTENT_PATTERN = /<head\b[^>]*>([\s\S]*?)<\/head>/i
const BODY_CONTENT_PATTERN = /<body\b([^>]*)>([\s\S]*?)<\/body>/i
const LINK_PATTERN = /<link\b([^>]*?)\/?>/gi
const SCRIPT_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
const STYLE_PATTERN = /<style\b[^>]*>([\s\S]*?)<\/style>/gi
const ATTRIBUTE_PATTERN = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
const TITLE_DIV_PATTERN = /<div([^>]*class=(["'])[^"']*\btitle\b[^"']*\2[^>]*)>([\s\S]*?)<\/div>/i

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function parseAttributes(source: string) {
  const attributes: LegacyAssetAttributes = {}

  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    const [, rawName, doubleQuotedValue, singleQuotedValue, unquotedValue] = match
    const name = rawName.toLowerCase()
    const value = decodeHtmlEntities(doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? '')

    attributes[name] = value
  }

  return attributes
}

function readTagAttributes(pattern: RegExp, source: string, predicate?: (attributes: LegacyAssetAttributes) => boolean) {
  const assets: LegacyAssetAttributes[] = []

  for (const match of source.matchAll(pattern)) {
    const attributes = parseAttributes(match[1] ?? '')
    if (!predicate || predicate(attributes)) {
      assets.push(attributes)
    }
  }

  return assets
}

function readInlineTags(pattern: RegExp, source: string) {
  return [...source.matchAll(pattern)].map((match) => match[1]?.trim()).filter((value): value is string => Boolean(value))
}

function readScripts(source: string) {
  const scripts: LegacyScriptAsset[] = []

  for (const match of source.matchAll(SCRIPT_PATTERN)) {
    scripts.push({
      attributes: parseAttributes(match[1] ?? ''),
      content: match[2]?.trim() ?? '',
    })
  }

  return scripts
}

function promoteTitleToHeading(page: LegacyPageName, bodyHtml: string) {
  const definition = getLegacyPageDefinition(page)
  if (!definition.promoteTitleToHeading || /<h1\b/i.test(bodyHtml)) {
    return bodyHtml
  }

  return bodyHtml.replace(TITLE_DIV_PATTERN, '<h1$1>$3</h1>')
}

function buildSeoFromDefinition(page: LegacyPageName) {
  const definition = getLegacyPageDefinition(page)

  return {
    title: definition.title,
    description: definition.description,
    keywords: definition.keywords,
    robots: definition.robots ?? (definition.indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow, noarchive'),
    ogType: 'website',
    ogTitle: definition.ogTitle ?? definition.title,
    ogDescription: definition.ogDescription ?? definition.description,
    ogImage: definition.ogImage ?? defaultOgImage,
    canonicalUrl: `${siteUrl}${definition.path}`,
  }
}

export function getLegacyPageFileName(name: string) {
  const legacyPage = resolveLegacyPageName(name)

  if (!legacyPage) {
    return null
  }

  return legacyPageFiles[legacyPage]
}

export async function readLegacyPage(name: string) {
  const fileName = getLegacyPageFileName(name)

  if (!fileName) {
    return null
  }

  return readFile(join(process.cwd(), 'page', fileName), 'utf8')
}

export async function readLegacyPageDocument(name: string): Promise<LegacyPageDocument | null> {
  const legacyPage = resolveLegacyPageName(name)

  if (!legacyPage) {
    return null
  }

  const html = await readLegacyPage(legacyPage)
  if (!html) {
    return null
  }

  const definition = getLegacyPageDefinition(legacyPage)
  const headContent = html.match(HEAD_CONTENT_PATTERN)?.[1] ?? ''
  const bodyMatch = html.match(BODY_CONTENT_PATTERN)
  const bodyAttributes = parseAttributes(bodyMatch?.[1] ?? '')
  const rawBodyHtml = bodyMatch?.[2] ?? ''
  const bodyHtmlWithoutScripts = rawBodyHtml.replace(SCRIPT_PATTERN, '').trim()
  const bodyHtml = promoteTitleToHeading(legacyPage, bodyHtmlWithoutScripts)

  return {
    page: legacyPage,
    htmlAttrs: {
      lang: 'ko',
      ...parseAttributes(html.match(HTML_ATTRIBUTES_PATTERN)?.[1] ?? ''),
    },
    bodyAttrs: bodyAttributes,
    bodyHtml,
    stylesheetLinks: readTagAttributes(LINK_PATTERN, headContent, (attributes) => {
      return attributes.rel?.toLowerCase() === 'stylesheet' && Boolean(attributes.href)
    }),
    inlineStyles: readInlineTags(STYLE_PATTERN, headContent),
    scripts: [...readScripts(headContent), ...readScripts(rawBodyHtml)],
    seo: buildSeoFromDefinition(legacyPage),
  }
}
