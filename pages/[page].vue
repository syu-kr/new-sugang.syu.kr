<script setup lang="ts">
import LegacyPageRenderer from '~/components/LegacyPageRenderer.vue'
import type {LegacyPageDocument} from '~/shared/legacy-page-document'
import {resolveLegacyPageName} from '~/shared/legacy-pages'

type TermDetail = {
  id: string
  year: number
  semester: number
}

definePageMeta({
  key: (route) => route.fullPath,
})

const route = useRoute()
const legacyPage = computed(() => {
  const pageParam = Array.isArray(route.params.page) ? route.params.page[0] : route.params.page
  const resolved = resolveLegacyPageName(pageParam ?? '')

  if (!resolved) {
    throw createError({statusCode: 404, statusMessage: 'Page not found'})
  }

  return resolved
})
const isBasketPage = computed(() => legacyPage.value === 'basket')

const {data: legacyDocument, error} = await useAsyncData<LegacyPageDocument>(
  `legacy-page:${legacyPage.value}`,
  () => $fetch(`/api/legacy-data/${legacyPage.value}`),
)

const {data: basketTerms} = await useAsyncData<TermDetail[]>(
  () => `basket-terms:${isBasketPage.value ? 'enabled' : 'disabled'}`,
  () => (isBasketPage.value ? $fetch('/api/terms') : Promise.resolve([])),
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: error.value.statusMessage || 'Failed to load legacy page',
  })
}

if (!legacyDocument.value) {
  throw createError({statusCode: 404, statusMessage: 'Page not found'})
}

function resolveRouteQueryString(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

function formatBasketTermLabel(term: string) {
  const match = /^(\d{4})-([12])$/.exec(term)

  if (!match) {
    return term
  }

  return `${match[1]}년 ${match[2]}학기`
}

function resolveBasketTermIdFromQuery(query: typeof route.query) {
  const year = resolveRouteQueryString(query.year)
  const semester = resolveRouteQueryString(query.semester)

  return year && semester ? `${year}-${semester}` : ''
}

function buildBasketCanonicalUrl(term: string, latestTerm: string) {
  if (term === latestTerm) {
    return 'https://sugang.syu.kr/basket'
  }

  const [year, semester] = term.split('-')
  return `https://sugang.syu.kr/basket?year=${encodeURIComponent(year || '')}&semester=${encodeURIComponent(semester || '')}`
}

function buildBasketSeo(term: string, latestTerm: string) {
  const formattedTerm = formatBasketTermLabel(term)
  const canonicalUrl = buildBasketCanonicalUrl(term, latestTerm)

  return {
    title: `삼육대학교 장바구니 경쟁률 - ${formattedTerm}`,
    description: `삼육대학교 ${formattedTerm} 수강신청 장바구니 경쟁률을 과목별로 확인할 수 있습니다.`,
    keywords: `삼육대학교, 장바구니 경쟁률, 수강신청, 경쟁률, ${formattedTerm}`,
    ogTitle: `삼육대학교 장바구니 경쟁률 - ${formattedTerm}`,
    ogDescription: `삼육대학교 ${formattedTerm} 수강신청 장바구니 경쟁률을 과목별로 확인할 수 있습니다.`,
    canonicalUrl,
  }
}

useHead(() => {
  const document = legacyDocument.value

  if (!document) {
    return {}
  }

  const basketTermIds = (basketTerms.value ?? []).map((term) => term.id)
  const latestBasketTerm = basketTermIds[0] || ''
  const requestedBasketTerm = resolveBasketTermIdFromQuery(route.query)
  const selectedBasketTerm =
    isBasketPage.value && basketTermIds.includes(requestedBasketTerm) ? requestedBasketTerm : latestBasketTerm
  const seo =
    isBasketPage.value && selectedBasketTerm
      ? {
          ...document.seo,
          ...buildBasketSeo(selectedBasketTerm, latestBasketTerm),
        }
      : document.seo

  const meta = [
    {key: 'description', name: 'description', content: seo.description},
    {key: 'robots', name: 'robots', content: seo.robots},
    {key: 'og:type', property: 'og:type', content: seo.ogType},
    {key: 'og:title', property: 'og:title', content: seo.ogTitle},
    {key: 'og:description', property: 'og:description', content: seo.ogDescription},
    {key: 'og:image', property: 'og:image', content: seo.ogImage},
    {key: 'og:url', property: 'og:url', content: seo.canonicalUrl},
    {key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image'},
    {key: 'twitter:title', name: 'twitter:title', content: seo.ogTitle},
    {key: 'twitter:description', name: 'twitter:description', content: seo.ogDescription},
    {key: 'twitter:image', name: 'twitter:image', content: seo.ogImage},
  ]

  if (seo.keywords) {
    meta.push({key: 'keywords', name: 'keywords', content: seo.keywords})
  }

  return {
    htmlAttrs: document.htmlAttrs,
    bodyAttrs: document.bodyAttrs,
    title: seo.title,
    link: [
      {key: 'canonical', rel: 'canonical', href: seo.canonicalUrl},
      ...document.stylesheetLinks.map((link, index) => ({
        key: `legacy-stylesheet-${index}`,
        ...link,
      })),
    ],
    meta,
  }
})
</script>

<template>
  <LegacyPageRenderer v-if="legacyDocument" :document="legacyDocument" />
</template>
