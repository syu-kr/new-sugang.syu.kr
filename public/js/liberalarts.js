const FIELD_DEPARTMENT = '\ud559\ubd80(\uacfc)'
const FIELD_COURSE_NUMBER = '\uac15\uc88c\ubc88\ud638'
const FIELD_SOURCE_COURSE_NAME = '\uac15\uc88c\uba85'
const FIELD_SOURCE_PROFESSOR = '\uad50\uc218\uba85'
const FIELD_COMPETITION = '\uacbd\uc7c1\ub960'
const FIELD_TIMETABLE_COURSE_NAME = '\uacfc\ubaa9\uba85'
const FIELD_TIMETABLE_PROFESSOR = '\uad50\uc218\uba85'
const FIELD_AREA = '\uc601\uc5ed\uad6c\ubd84'
const AREA_ALL = '\ubaa8\ub450'
const DEPARTMENT_LIBERAL_ARTS = '\uacf5\ud1b5(\uad50\uc591)'
const LEGACY_ALIAS_PATTERN = /\s*\((?:\uad6c|\u820a)\s*,[^)]*\)\s*/g
const EXCLUDE_NAME_PATTERNS = ['\uc9c0\uad6c\uc0ac\ub791\uacfc\ubd09\uc0ac', '\uae00\ub85c\ubc8c \uc601\uc5b4']
const MANUAL_AREAS = [
  '\uae30\ucd08\uad50\uc591',
  '\uc778\uc131\uad50\uc591',
  '\uc778\ubb38\uc608\uc220\uc601\uc5ed',
  '\uc0ac\ud68c\uacfc\ud559\uc601\uc5ed',
  '\uc790\uc5f0\uacfc\ud559\uc601\uc5ed',
  '\uc77c\ubc18\uc120\ud0dd\uc601\uc5ed',
  '\uc9c0\uc5ed\uc0ac\ud68c\ub9ac\ub354\uc2ed\uc601\uc5ed',
]

function competitionColor(value) {
  if (value >= 4) return '#ff1f1f'
  if (value >= 3) return '#ff5270'
  if (value >= 2) return '#ff9500'
  if (value >= 1) return '#c4cc00'
  return '#00c96b'
}

function formatRate(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return `${Number.parseFloat(value).toFixed(2)}:1`
}

function formatTermLabel(term) {
  const [year, semester] = String(term).split('-')
  return `'${String(year).slice(-2)} ${semester}\ud559\uae30`
}

function normalizeString(value) {
  return (value || '').toString().trim().replace(/\s+/g, ' ')
}

function normalizeCourseName(value) {
  return normalizeString(value).replace(LEGACY_ALIAS_PATTERN, '').trim()
}

function buildUniqueAreaMap(areaSets) {
  const uniqueAreaMap = new Map()

  areaSets.forEach((areas, key) => {
    if (areas.size === 1) {
      uniqueAreaMap.set(key, Array.from(areas)[0])
    }
  })

  return uniqueAreaMap
}

function buildAreaResolver(areaRows) {
  const exactAreaByCourseProfessor = new Map()
  const areaSetsByCourseName = new Map()
  const areaSetsByCanonicalCourseName = new Map()

  function addArea(areaSets, key, area) {
    if (!key || !area) return

    if (!areaSets.has(key)) {
      areaSets.set(key, new Set())
    }

    areaSets.get(key).add(area)
  }

  areaRows.forEach((entry) => {
    const courseName = normalizeString(entry.courseName)
    const professor = normalizeString(entry.professor)
    const area = normalizeString(entry.area)
    const canonicalCourseName = normalizeCourseName(courseName)

    if (courseName && professor) {
      const exactKey = `${courseName}|${professor}`

      if (area || !exactAreaByCourseProfessor.has(exactKey)) {
        exactAreaByCourseProfessor.set(exactKey, area)
      }
    }

    addArea(areaSetsByCourseName, courseName, area)
    addArea(areaSetsByCanonicalCourseName, canonicalCourseName, area)
  })

  const uniqueAreaByCourseName = buildUniqueAreaMap(areaSetsByCourseName)
  const uniqueAreaByCanonicalCourseName = buildUniqueAreaMap(areaSetsByCanonicalCourseName)

  return (courseName, professor) => {
    const normalizedCourseName = normalizeString(courseName)
    const normalizedProfessor = normalizeString(professor)
    const exactArea = exactAreaByCourseProfessor.get(`${normalizedCourseName}|${normalizedProfessor}`)

    if (exactArea) {
      return exactArea
    }

    return (
      uniqueAreaByCourseName.get(normalizedCourseName) ||
      uniqueAreaByCanonicalCourseName.get(normalizeCourseName(normalizedCourseName)) ||
      ''
    )
  }
}

function buildTimetableAreaResolver(timetable) {
  return buildAreaResolver(
    timetable.map((entry) => ({
      area: entry[FIELD_AREA],
      courseName: entry[FIELD_TIMETABLE_COURSE_NAME],
      professor: entry[FIELD_TIMETABLE_PROFESSOR],
    })),
  )
}

function buildTermAreaResolverMap(areaHistory) {
  const rowsByTerm = new Map()
  const resolverByTerm = new Map()

  areaHistory.forEach((entry) => {
    const term = normalizeString(entry.term)
    if (!term) return

    if (!rowsByTerm.has(term)) {
      rowsByTerm.set(term, [])
    }

    rowsByTerm.get(term).push(entry)
  })

  rowsByTerm.forEach((rows, term) => {
    resolverByTerm.set(term, buildAreaResolver(rows))
  })

  return resolverByTerm
}

function renderStars(percent) {
  if (percent == null || Number.isNaN(percent)) return ''

  const value = Math.max(0, Math.min(100, Number.parseFloat(percent)))
  const stars = '\u2605\u2605\u2605\u2605\u2605'

  return `<div class="rating" title="${value}%"><span class="star-bg">${stars}</span><span class="star-fill" style="width:${value}%">${stars}</span><span class="rating-text">${((value / 100) * 5).toFixed(2)} / 5</span></div>`
}

function updateTableScrollHint() {
  const scroller = document.querySelector('.table-responsive')
  const hint = document.getElementById('table-scroll-hint')
  if (!scroller || !hint) return

  const hasOverflow = scroller.scrollWidth > scroller.clientWidth + 1
  const hasMore = scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 1
  const isVisible = hasOverflow && hasMore

  hint.classList.toggle('is-visible', isVisible)
  hint.setAttribute('aria-hidden', String(!isVisible))
}

async function fetchTerms() {
  const response = await fetch('/api/terms')
  if (!response.ok) throw new Error('failed to fetch terms')
  return response.json()
}

async function fetchTerm(term) {
  const response = await fetch(`/api/${term}`)
  if (!response.ok) {
    return {data: [], time: null}
  }

  return response.json()
}

async function fetchLiberalArtsAreaHistory() {
  const response = await fetch('/api/liberalartsAreaHistory')
  if (!response.ok) throw new Error('failed to fetch liberal arts area history')
  return response.json()
}

function buildTableHeader(terms) {
  const headerRow = document.querySelector('thead tr')
  if (!headerRow) return

  headerRow.innerHTML = `
    <th class="name-col">\uad50\uacfc\ubaa9</th>
    ${terms.map((term, index) => `<th class="rate-col term-col-${index}">${formatTermLabel(term)}</th>`).join('')}
    <th class="rating-col">\ud3c9\uc810</th>
  `
}

function buildSortOptions(terms) {
  const sortEl = document.getElementById('sort')
  if (!sortEl) return

  sortEl.innerHTML = `${terms
    .map((term, index) => `<option value="term_${term}" ${index === 0 ? 'selected' : ''}>${term} \uae30\uc900 \ub0b4\ub9bc\ucc28\uc21c</option>`)
    .join('')}<option value="avg">\ud3c9\uade0 \uae30\uc900 \ub0b4\ub9bc\ucc28\uc21c</option>`
}

function averageFor(item, terms) {
  const values = terms.map((term) => item.rates[term]).filter((value) => typeof value === 'number')
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function isInactiveInRecentTerms(item, terms) {
  const recentTerms = terms.slice(0, 3)

  if (recentTerms.length < 3) {
    return false
  }

  return recentTerms.every((term) => typeof item.rates[term] !== 'number')
}

async function main() {
  const termDetails = await fetchTerms()
  const terms = termDetails.map((term) => term.id)
  const tbody = document.getElementById('tbody')

  if (!tbody) return

  if (!terms.length) {
    tbody.innerHTML = '<tr><td colspan="4">\ud45c\uc2dc\ud560 \ud559\uae30 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</td></tr>'
    return
  }

  buildTableHeader(terms)
  buildSortOptions(terms)

  const results = await Promise.all(terms.map((term) => fetchTerm(term)))
  const perTermMap = {}

  for (let index = 0; index < terms.length; index += 1) {
    perTermMap[terms[index]] = {
      time: results[index].time || null,
      items: (results[index].data || []).filter((item) => item[FIELD_DEPARTMENT] === DEPARTMENT_LIBERAL_ARTS),
    }
  }

  let termAreaResolvers = new Map()
  try {
    const areaHistoryJson = await fetchLiberalArtsAreaHistory()
    termAreaResolvers = buildTermAreaResolverMap(areaHistoryJson.data || [])
  } catch {}

  const ratingsMap = new Map()
  try {
    const ratingResponse = await fetch('/api/courseRate')
    if (ratingResponse.ok) {
      const ratingJson = await ratingResponse.json()
      ;(ratingJson.data || []).forEach((item) => {
        const key = `${normalizeString(item.course)}|${normalizeString(item.professor)}`
        const width = String(item.style || '').match(/width:\s*([\d.]+)/)
        if (width) {
          ratingsMap.set(key, Number.parseFloat(width[1]))
        }
      })
    }
  } catch {}

  const courses = new Map()
  for (const term of terms) {
    const areaResolver = termAreaResolvers.get(term)
    perTermMap[term].items.forEach((item) => {
      const key = `${item[FIELD_SOURCE_COURSE_NAME]}|${item[FIELD_SOURCE_PROFESSOR]}`
      if (!courses.has(key)) {
        courses.set(key, {
          area: '',
          courseNo: '',
          name: item[FIELD_SOURCE_COURSE_NAME],
          professor: item[FIELD_SOURCE_PROFESSOR],
          rates: {},
        })
      }
      const course = courses.get(key)
      course.rates[term] = Number.parseFloat(item[FIELD_COMPETITION])

      if (term === terms[0]) {
        course.courseNo = item[FIELD_COURSE_NUMBER]
      }

      if (!course.area && areaResolver) {
        course.area = areaResolver(item[FIELD_SOURCE_COURSE_NAME], item[FIELD_SOURCE_PROFESSOR])
      }
    })
  }

  let list = Array.from(courses.values()).filter((item) => {
    return !EXCLUDE_NAME_PATTERNS.some((pattern) => String(item.name || '').includes(pattern))
  })

  let timetable = []
  try {
    const timetableResponse = await fetch('/api/timetable')
    if (timetableResponse.ok) {
      const timetableJson = await timetableResponse.json()
      timetable = Array.isArray(timetableJson?.api?.api) ? timetableJson.api.api : []
    }
  } catch {}

  const resolveArea = buildTimetableAreaResolver(timetable)

  list.forEach((item) => {
    const area = item.area || resolveArea(item.name, item.professor)
    item.area = area && String(area).trim() ? area : '-'
  })

  const areaFilterEl = document.getElementById('areaFilter')
  if (areaFilterEl) {
    const discoveredAreas = Array.from(
      new Set(
        list
          .map((item) => item.area)
          .filter((area) => area && area !== '-'),
      ),
    )
    const areaOptions = Array.from(new Set([...MANUAL_AREAS, ...discoveredAreas]))

    areaFilterEl.innerHTML = `<option value="">${AREA_ALL}</option>${areaOptions.map((area) => `<option value="${area}">${area}</option>`).join('')}`
  }

  const searchEl = document.getElementById('search')
  const sortEl = document.getElementById('sort')

  function renderRows(filtered) {
    tbody.innerHTML = ''

    filtered.forEach((item) => {
      const tr = document.createElement('tr')

      const nameTd = document.createElement('td')
      nameTd.className = 'course-cell'
      const courseNameStyle = isInactiveInRecentTerms(item, terms)
        ? 'text-decoration:line-through; text-decoration-thickness:1.5px; color:#666;'
        : ''
      const avgValue = averageFor(item, terms)
      const courseNoTag = item.courseNo ? `<span class="course-meta-tag">${item.courseNo}</span>` : ''
      const averageTag = `<span class="course-meta-tag course-average-tag">\ud3c9\uade0: ${formatRate(avgValue)}</span>`
      nameTd.innerHTML = `
        <strong class="course-title" style="${courseNameStyle}">${item.name}</strong>
        <span class="course-meta-tags">
          ${courseNoTag}
          <span class="course-meta-tag">${item.area || '-'}</span>
          <span class="course-meta-tag">${item.professor || '-'}</span>
          ${averageTag}
        </span>
      `
      tr.appendChild(nameTd)

      terms.forEach((term, index) => {
        const td = document.createElement('td')
        td.className = `rate-col term-col-${index}`
        const value = item.rates[term]

        if (typeof value === 'number') {
          td.innerHTML = `<b style="color:${competitionColor(value)}">${formatRate(value)}</b>`
        } else {
          td.innerText = 'X'
        }

        tr.appendChild(td)
      })

      const ratingTd = document.createElement('td')
      ratingTd.className = 'rating-col'
      const ratingKey = `${normalizeString(item.name)}|${normalizeString(item.professor)}`
      const ratingPercent = ratingsMap.get(ratingKey)
      ratingTd.innerHTML = ratingPercent ? renderStars(ratingPercent) : '-'
      tr.appendChild(ratingTd)

      tbody.appendChild(tr)
    })

    updateTableScrollHint()
  }

  function applyFilters() {
    const query = String(searchEl?.value || '').trim().toLowerCase()
    const selectedArea = areaFilterEl ? areaFilterEl.value : ''
    const sortBy = sortEl?.value || `term_${terms[0]}`

    let filtered = list.filter((item) => {
      return item.name.toLowerCase().includes(query) || item.professor.toLowerCase().includes(query)
    })

    if (selectedArea) {
      filtered = filtered.filter((item) => item.area === selectedArea)
    }

    if (sortBy.startsWith('term_')) {
      const term = sortBy.slice(5)
      filtered.sort((left, right) => {
        const leftValue = typeof left.rates[term] === 'number' ? left.rates[term] : -1
        const rightValue = typeof right.rates[term] === 'number' ? right.rates[term] : -1
        return rightValue - leftValue
      })
    } else {
      filtered.sort((left, right) => (averageFor(right, terms) || 0) - (averageFor(left, terms) || 0))
    }

    renderRows(filtered)
  }

  let resizeTimer = 0
  function handleResize() {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(updateTableScrollHint, 40)
  }

  list.sort((left, right) => (right.rates[terms[0]] || 0) - (left.rates[terms[0]] || 0))
  renderRows(list)

  searchEl?.addEventListener('input', applyFilters)
  sortEl?.addEventListener('change', applyFilters)
  areaFilterEl?.addEventListener('change', applyFilters)
  document.querySelector('.table-responsive')?.addEventListener('scroll', updateTableScrollHint, {passive: true})
  window.addEventListener('resize', handleResize)
}

main().catch((error) => {
  console.error(error)
  const tbody = document.getElementById('tbody')
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4">\ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc624\ub294 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.</td></tr>'
  }
})
