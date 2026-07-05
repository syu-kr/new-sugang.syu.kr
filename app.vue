<script setup lang="ts">
const googleAnalyticsMeasurementId = 'G-13FLHMGH10'

useHead({
  script: [
    {
      key: 'gtag-src',
      src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsMeasurementId}`,
      async: true,
    },
    {
      key: 'gtag-init',
      innerHTML: [
        'window.dataLayer = window.dataLayer || [];',
        'function gtag(){dataLayer.push(arguments);}',
        "gtag('js', new Date());",
        `gtag('config', '${googleAnalyticsMeasurementId}');`,
      ].join('\n'),
    },
  ],
})
</script>

<template>
  <NuxtPage />
</template>
