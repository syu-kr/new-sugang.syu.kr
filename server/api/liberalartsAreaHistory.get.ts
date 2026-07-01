import {listAvailableTerms} from '~/server/utils/data'

const GUIDEBOOK_BASE_URL = 'https://raw.githubusercontent.com/syu-kr/lecture.syu.kr-suwings/refs/heads/main/data'
const GUIDEBOOK_DIRECTORY = '\uc218\uac15\ud3b8\ub78c'
const GUIDEBOOK_FILE_NAME = '\uacf5\ud1b5(\uad50\uc591).json'
const FIELD_COURSE_NAME = '\uacfc\ubaa9\uba85'
const FIELD_PROFESSOR = '\uad50\uc218\uba85'
const FIELD_AREA = '\uc601\uc5ed\uad6c\ubd84'
const CACHE_TTL_MS = 10 * 60 * 1000

type LiberalArtsAreaHistoryRow = {
  term: string
  courseName: string
  professor: string
  area: string
}

type LiberalArtsAreaHistoryTermResult = {
  count: number
  id: string
  status: 'ok' | 'error'
  url: string
  error?: string
}

type LiberalArtsAreaHistoryResponse = {
  data: LiberalArtsAreaHistoryRow[]
  fetchedAt: string
  terms: LiberalArtsAreaHistoryTermResult[]
}

let cachedHistory: LiberalArtsAreaHistoryResponse | null = null
let cachedHistoryExpiresAt = 0
let pendingHistoryPromise: Promise<LiberalArtsAreaHistoryResponse> | null = null

function normalizeString(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function buildGuidebookUrl(term: string) {
  const [year, semester] = term.split('-')

  return [
    GUIDEBOOK_BASE_URL,
    year,
    encodeURIComponent(`${semester}\ud559\uae30 \uc815\uaddc`),
    encodeURIComponent(GUIDEBOOK_DIRECTORY),
    encodeURIComponent(GUIDEBOOK_FILE_NAME),
  ].join('/')
}

async function fetchGuidebookForTerm(term: string) {
  const url = buildGuidebookUrl(term)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const json = JSON.parse(await response.text())
  const sourceRows = Array.isArray(json?.api) ? json.api : []
  const rows = sourceRows
    .map((entry) => ({
      term,
      courseName: normalizeString(entry?.[FIELD_COURSE_NAME]),
      professor: normalizeString(entry?.[FIELD_PROFESSOR]),
      area: normalizeString(entry?.[FIELD_AREA]),
    }))
    .filter((entry) => entry.courseName && entry.area)

  return {
    rows,
    term: {
      count: rows.length,
      id: term,
      status: 'ok' as const,
      url,
    },
  }
}

async function loadHistory() {
  const terms = await listAvailableTerms()
  const settled = await Promise.allSettled(terms.map((term) => fetchGuidebookForTerm(term)))
  const response: LiberalArtsAreaHistoryResponse = {
    data: [],
    fetchedAt: new Date().toISOString(),
    terms: [],
  }

  settled.forEach((result, index) => {
    const term = terms[index]
    const url = buildGuidebookUrl(term)

    if (result.status === 'fulfilled') {
      response.data.push(...result.value.rows)
      response.terms.push(result.value.term)
      return
    }

    response.terms.push({
      count: 0,
      id: term,
      status: 'error',
      url,
      error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
    })
  })

  return response
}

export default defineEventHandler(async () => {
  const now = Date.now()

  if (cachedHistory && now < cachedHistoryExpiresAt) {
    return cachedHistory
  }

  if (!pendingHistoryPromise) {
    pendingHistoryPromise = loadHistory()
      .then((history) => {
        cachedHistory = history
        cachedHistoryExpiresAt = Date.now() + CACHE_TTL_MS
        return history
      })
      .finally(() => {
        pendingHistoryPromise = null
      })
  }

  return pendingHistoryPromise
})
