const FIELD_DEPARTMENT = '\ud559\ubd80(\uacfc)'
const FIELD_SOURCE_COURSE_NAME = '\uac15\uc88c\uba85'
const FIELD_SOURCE_PROFESSOR = '\uad50\uc218\uba85'
const FIELD_COMPETITION = '\uacbd\uc7c1\ub960'
const FIELD_TIMETABLE_COURSE_NAME = '\uacfc\ubaa9\uba85'
const FIELD_TIMETABLE_PROFESSOR = '\uad50\uc218\uba85'
const FIELD_AREA = '\uc601\uc5ed\uad6c\ubd84'
const AREA_ALL = '\ubaa8\ub450'
const DEPARTMENT_LIBERAL_ARTS = '\uacf5\ud1b5(\uad50\uc591)'
const LEGACY_ALIAS_PATTERN = /\s*\((?:\uad6c|\u820a)\s*,[^)]*\)\s*/g
const RESPONSIVE_HIDE_BREAKPOINTS = [1120, 1040, 960, 880, 800, 720, 640, 560, 480, 400]

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
  if (value >= 4) return 'red'
  if (value >= 3) return '#ff7070'
  if (value >= 2) return 'orange'
  if (value >= 1) return '#cdcd00'
  return '#00ff00'
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

function hiddenColumnCountForWidth(width) {
  return RESPONSIVE_HIDE_BREAKPOINTS.reduce((count, breakpoint) => {
    return width <= breakpoint ? count + 1 : count
  }, 0)
}

function updateResponsiveColumns(terms) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200
  const hideOrder = ['rating-col', 'avg-col']
  const hiddenCount = Math.min(hiddenColumnCountForWidth(viewportWidth), hideOrder.length)

  hideOrder.forEach((className, index) => {
    document.querySelectorAll(`.${className}`).forEach((element) => {
      element.classList.toggle('responsive-hidden', index < hiddenCount)
    })
  })
}

function updateTermColumns(terms, visibleTerms) {
  terms.forEach((term, index) => {
    document.querySelectorAll(`.term-col-${index}`).forEach((element) => {
      element.classList.toggle('term-hidden', !visibleTerms.has(term))
    })
  })
}

function renderTermOptions(terms, visibleTerms, onChange) {
  const wrapper = document.getElementById('semester-list')
  if (!wrapper) return

  wrapper.innerHTML = terms
    .map((term) => {
      const checked = visibleTerms.has(term) ? 'checked' : ''
      return `
        <label><input type="checkbox" class="term-toggle" value="${term}" ${checked} /> ${formatTermLabel(term)}</label>
      `
    })
    .join('')

  wrapper.querySelectorAll('.term-toggle').forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      onChange(this.value, this.checked)
    })
  })
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
    <th class="name-col">\uacfc\ubaa9\uba85(\uad50\uc218\uba85)</th>
    <th class="area-col">\uc601\uc5ed</th>
    ${terms.map((term, index) => `<th class="rate-col term-col-${index}">${term}</th>`).join('')}
    <th class="rate-col avg-col">\ud3c9\uade0</th>
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
  const visibleTerms = new Set(terms)
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
        courses.set(key, {area: '', name: item[FIELD_SOURCE_COURSE_NAME], professor: item[FIELD_SOURCE_PROFESSOR], rates: {}})
      }
      const course = courses.get(key)
      course.rates[term] = Number.parseFloat(item[FIELD_COMPETITION])

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
      const courseNameStyle = isInactiveInRecentTerms(item, terms)
        ? 'text-decoration:line-through; text-decoration-thickness:1.5px; color:#666;'
        : ''
      nameTd.innerHTML = `<strong style="${courseNameStyle}">${item.name}</strong> <span style="color:#666">(${item.professor})</span>`
      tr.appendChild(nameTd)

      const areaTd = document.createElement('td')
      areaTd.className = 'area-col'
      areaTd.innerText = item.area || '-'
      tr.appendChild(areaTd)

      terms.forEach((term, index) => {
        const td = document.createElement('td')
        td.className = `rate-col term-col-${index}`
        const value = item.rates[term]

        if (typeof value === 'number') {
          td.innerHTML = `<span style="color:${competitionColor(value)}">${formatRate(value)}</span>`
        } else {
          td.innerText = 'X'
        }

        tr.appendChild(td)
      })

      const avgTd = document.createElement('td')
      avgTd.className = 'rate-col avg-col'
      const avgValue = averageFor(item, terms)
      avgTd.innerHTML = avgValue == null ? 'X' : `<b style="color:${competitionColor(avgValue)}">${formatRate(avgValue)}</b>`
      tr.appendChild(avgTd)

      const ratingTd = document.createElement('td')
      ratingTd.className = 'rating-col'
      const ratingKey = `${normalizeString(item.name)}|${normalizeString(item.professor)}`
      const ratingPercent = ratingsMap.get(ratingKey)
      ratingTd.innerHTML = ratingPercent ? renderStars(ratingPercent) : '-'
      tr.appendChild(ratingTd)

      tbody.appendChild(tr)
    })

    updateTermColumns(terms, visibleTerms)
    updateResponsiveColumns(terms)
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
    resizeTimer = window.setTimeout(() => updateResponsiveColumns(terms), 40)
  }

  renderTermOptions(terms, visibleTerms, (term, checked) => {
    if (checked) {
      visibleTerms.add(term)
    } else {
      visibleTerms.delete(term)
    }
    updateTermColumns(terms, visibleTerms)
  })

  list.sort((left, right) => (right.rates[terms[0]] || 0) - (left.rates[terms[0]] || 0))
  renderRows(list)

  searchEl?.addEventListener('input', applyFilters)
  sortEl?.addEventListener('change', applyFilters)
  areaFilterEl?.addEventListener('change', applyFilters)
  window.addEventListener('resize', handleResize)
}

main().catch((error) => {
  console.error(error)
  const tbody = document.getElementById('tbody')
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4">\ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc624\ub294 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.</td></tr>'
  }
})
