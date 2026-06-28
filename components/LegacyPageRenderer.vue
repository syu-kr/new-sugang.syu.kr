<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'

import type {LegacyAssetAttributes, LegacyPageDocument, LegacyScriptAsset} from '~/shared/legacy-page-document'

const props = defineProps<{
  document: LegacyPageDocument
}>()

const root = ref<HTMLDivElement | null>(null)

let activeRun = 0
let injectedNodes: HTMLElement[] = []

const renderedHtml = computed(() => {
  const inlineStyles = props.document.inlineStyles.map((cssText, index) => {
    const sanitizedCss = cssText.replace(/<\/style/gi, '<\\/style')
    return `<style data-legacy-inline-style="${index}">${sanitizedCss}</style>`
  })

  return [...inlineStyles, props.document.bodyHtml].join('')
})

function cleanupInjectedNodes() {
  for (const node of injectedNodes) {
    node.remove()
  }

  injectedNodes = []
}

function applyAttributes(attributes: LegacyAssetAttributes, element: HTMLElement) {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }
}

function shouldSkipScript(script: LegacyScriptAsset) {
  const src = script.attributes.src || ''
  const text = script.content

  return src.includes('googletagmanager.com/gtag/js') || text.includes("gtag('config'")
}

function injectScript(scriptAsset: LegacyScriptAsset) {
  if (shouldSkipScript(scriptAsset)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const src = scriptAsset.attributes.src

    applyAttributes(scriptAsset.attributes, script)
    script.dataset.legacyPageAsset = props.document.page

    if (src) {
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      script.src = src
    } else {
      script.textContent = scriptAsset.content
      resolve()
    }

    document.body.appendChild(script)
    injectedNodes.push(script)
  })
}

async function runScripts() {
  const currentRun = ++activeRun

  cleanupInjectedNodes()
  await nextTick()

  if (!root.value || currentRun !== activeRun) {
    return
  }

  for (const script of props.document.scripts) {
    if (currentRun !== activeRun) {
      return
    }

    try {
      await injectScript(script)
    } catch (error) {
      console.error('[legacy-page] Script injection failed.', error)
    }
  }

  if (currentRun !== activeRun) {
    return
  }

  document.dispatchEvent(new Event('DOMContentLoaded', {bubbles: true}))
  window.dispatchEvent(new Event('load'))
  window.scrollTo({top: 0, left: 0})
}

if (import.meta.client) {
  onMounted(() => {
    void runScripts()
  })

  watch(
    () => props.document.page,
    (page, previousPage) => {
      if (page !== previousPage) {
        void runScripts()
      }
    },
  )

  onBeforeUnmount(() => {
    activeRun += 1
    cleanupInjectedNodes()
  })
}
</script>

<template>
  <div ref="root" v-html="renderedHtml" />
</template>
