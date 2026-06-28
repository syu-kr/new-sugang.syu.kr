import type {LegacyPageName} from '~/shared/legacy-pages'

export type LegacyAssetAttributes = Record<string, string>

export type LegacyScriptAsset = {
  attributes: LegacyAssetAttributes
  content: string
}

export type LegacyPageDocument = {
  page: LegacyPageName
  htmlAttrs: LegacyAssetAttributes
  bodyAttrs: LegacyAssetAttributes
  bodyHtml: string
  stylesheetLinks: LegacyAssetAttributes[]
  inlineStyles: string[]
  scripts: LegacyScriptAsset[]
  seo: {
    title: string
    description: string
    keywords?: string
    robots: string
    ogType: string
    ogTitle: string
    ogDescription: string
    ogImage: string
    canonicalUrl: string
  }
}
