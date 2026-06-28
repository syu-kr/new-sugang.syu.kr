<script setup lang="ts">
import LegacyPageRenderer from '~/components/LegacyPageRenderer.vue'
import type {LegacyPageDocument} from '~/shared/legacy-page-document'
import {resolveLegacyPageName} from '~/shared/legacy-pages'

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

const {data: legacyDocument, error} = await useAsyncData<LegacyPageDocument>(
  `legacy-page:${legacyPage.value}`,
  () => $fetch(`/api/legacy-data/${legacyPage.value}`),
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

useHead(() => {
  const document = legacyDocument.value

  if (!document) {
    return {}
  }

  const meta = [
    {key: 'description', name: 'description', content: document.seo.description},
    {key: 'robots', name: 'robots', content: document.seo.robots},
    {key: 'og:type', property: 'og:type', content: document.seo.ogType},
    {key: 'og:title', property: 'og:title', content: document.seo.ogTitle},
    {key: 'og:description', property: 'og:description', content: document.seo.ogDescription},
    {key: 'og:image', property: 'og:image', content: document.seo.ogImage},
    {key: 'og:url', property: 'og:url', content: document.seo.canonicalUrl},
    {key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image'},
    {key: 'twitter:title', name: 'twitter:title', content: document.seo.ogTitle},
    {key: 'twitter:description', name: 'twitter:description', content: document.seo.ogDescription},
    {key: 'twitter:image', name: 'twitter:image', content: document.seo.ogImage},
  ]

  if (document.seo.keywords) {
    meta.push({key: 'keywords', name: 'keywords', content: document.seo.keywords})
  }

  return {
    htmlAttrs: document.htmlAttrs,
    bodyAttrs: document.bodyAttrs,
    title: document.seo.title,
    link: [
      {key: 'canonical', rel: 'canonical', href: document.seo.canonicalUrl},
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
