const COUNT_PER_PAGE = 50

const FIELD_COURSE_NO = '\uac15\uc88c\ubc88\ud638'
const FIELD_COURSE_NAME = '\uac15\uc88c\uba85'
const FIELD_PROFESSOR = '\uad50\uc218\uba85'
const FIELD_LIMIT = '\uc81c\ud55c\uc778\uc6d0'
const FIELD_BASKET = '\uc7a5\ubc14\uad6c\ub2c8'
const FIELD_COMPETITION = '\uacbd\uc7c1\ub960'
const FIELD_RANK = '__rank'

let datas = {time: null, data: []}

async function fetchTerms() {
  const response = await fetch('/api/terms', {method: 'get'})
  if (!response.ok) throw new Error('failed to fetch terms')
  return response.json()
}

async function getRequest(termId) {
  const response = await fetch(`/api/${termId}`, {method: 'get'})
  if (!response.ok) throw new Error(`failed to fetch term: ${termId}`)
  return response.json()
}

function getSearchParams() {
  return new URLSearchParams(window.location.search)
}

function getCurrentTermId() {
  const params = getSearchParams()
  const year = params.get('year')
  const semester = params.get('semester')
  return year && semester ? `${year}-${semester}` : null
}

function getSelectedTermId(terms) {
  const current = getCurrentTermId()
  const ids = terms.map((term) => term.id)

  if (current && ids.includes(current)) {
    return current
  }

  return ids[0] || null
}

function formatTermLabel(term) {
  const shortYear = String(term.year).slice(-2)
  return `'${shortYear} ${term.semester}\ud559\uae30`
}

function renderTermOptions(terms, selectedTermId) {
  const wrapper = document.getElementById('semester-list') || document.querySelector('.col-radio-wrapper')
  if (!wrapper) return

  wrapper.innerHTML = terms
    .map((term) => {
      const checked = term.id === selectedTermId ? 'checked' : ''
      return `
        <input type="radio" id="${term.id}" name="semester" value="${term.id}" ${checked} />
        <label for="${term.id}" class="semester-btn">${formatTermLabel(term)}</label>
      `
    })
    .join('')

  wrapper.querySelectorAll('input[name="semester"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      const [year, semester] = this.value.split('-')
      const url = new URL(window.location.href)
      url.searchParams.set('year', year)
      url.searchParams.set('semester', semester)
      window.location.href = url.toString()
    })
  })
}

function rankConvert(value) {
  if (value === 1) return '<div style="display: flex; justify-content: center;"><img class="rank" src="/1.png" width="24px" alt="1" /></div>'
  if (value === 2) return '<div style="display: flex; justify-content: center;"><img class="rank" src="/2.png" width="24px" alt="2" /></div>'
  if (value === 3) return '<div style="display: flex; justify-content: center;"><img class="rank" src="/3.png" width="24px" alt="3" /></div>'
  return `<span><b>${value}</b></span>`
}

function competitionColor(value) {
  if (value >= 4) return 'red'
  if (value >= 3) return '#ff7070'
  if (value >= 2) return 'orange'
  if (value >= 1) return '#cdcd00'
  return '#00ff00'
}

function convertTime(datetimeStr) {
  if (!datetimeStr) return ''

  const date = new Date(datetimeStr.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return datetimeStr

  const fullYear = date.getFullYear()
  const shortYear = `'${String(fullYear).slice(-2)}`
  const month = date.getMonth() + 1
  const day = date.getDate()

  let hour = date.getHours()
  const minute = String(date.getMinutes()).padStart(2, '0')
  const isPM = hour >= 12
  const period = isPM ? '\uc624\ud6c4' : '\uc624\uc804'

  hour %= 12
  hour = hour === 0 ? 12 : hour

  return `\ub9c8\uc9c0\ub9c9 \uc5c5\ub370\uc774\ud2b8: ${shortYear}\ub144 ${month}\uc6d4 ${day}\uc77c ${period} ${hour}\uc2dc ${minute}\ubd84`
}

function pageButton(page, current) {
  return `
    <div class="page ${page === current ? 'active' : ''}" onclick="setPageOf(${page})">
      ${page}
    </div>
  `
}

function setPageButtons(pageNumber) {
  const totalPages = Math.ceil(datas.data.length / COUNT_PER_PAGE)
  const range = 2
  let html = ''

  if (pageNumber > 1) {
    html += `<div class="nav" onclick="setPageOf(${pageNumber - 1})">&lt;</div>`
  }

  html += pageButton(1, pageNumber)

  if (pageNumber > range + 2) {
    html += '<div class="dots">...</div>'
  }

  const start = Math.max(2, pageNumber - range)
  const end = Math.min(totalPages - 1, pageNumber + range)

  for (let page = start; page <= end; page += 1) {
    html += pageButton(page, pageNumber)
  }

  if (pageNumber < totalPages - (range + 1)) {
    html += '<div class="dots">...</div>'
  }

  if (totalPages > 1) {
    html += pageButton(totalPages, pageNumber)
  }

  if (pageNumber < totalPages) {
    html += `<div class="nav" onclick="setPageOf(${pageNumber + 1})">&gt;</div>`
  }

  document.getElementById('number-button-wrapper').innerHTML = html
}

function setPageOf(pageNumber) {
  let tbody = ''

  document.getElementById('time').innerHTML = convertTime(datas.time)
  setPageButtons(pageNumber)

  const colStateSource = typeof colStates === 'object' ? colStates : {courseNo: true, professor: true, count: true, rate: true}

  for (let index = COUNT_PER_PAGE * (pageNumber - 1); index < COUNT_PER_PAGE * pageNumber && index < datas.data.length; index += 1) {
    const item = datas.data[index]
    const competition = Number.parseFloat(item[FIELD_COMPETITION]).toFixed(2)

    tbody += `
      <tr>
        <td align="center" style="border-right-width: 1px" nowrap>${rankConvert(item[FIELD_RANK])}</td>
        <td class="col-courseNo ${!colStateSource.courseNo ? 'hidden-col' : ''}" align="center" nowrap><span style="color: #5f6062;">${item[FIELD_COURSE_NO]}</span></td>
        <td nowrap>
          <strong><span>${item[FIELD_COURSE_NAME]}</span></strong>
          <span class="col-professor ${!colStateSource.professor ? 'hidden-col' : ''}" id="professor">(${item[FIELD_PROFESSOR]})</span>
        </td>
        <td class="col-count ${!colStateSource.count ? 'hidden-col' : ''}" nowrap>
          <span><span style="color: ${competitionColor(competition)};">${item[FIELD_BASKET]}</span>/${item[FIELD_LIMIT]}</span>
        </td>
        <td class="col-rate ${!colStateSource.rate ? 'hidden-col' : ''}" align="center" nowrap>
          <b><span style="color: ${competitionColor(competition)};">${competition}:1</span></b>
        </td>
      </tr>
    `
  }

  document.getElementById('info').innerHTML = tbody
}

function filterDataBySearch(data) {
  const search = getSearchParams().get('search') || ''
  if (!search) return data

  const query = search.toLowerCase()
  return data.filter((item) => {
    return (
      String(item[FIELD_COURSE_NAME] || '')
        .toLowerCase()
        .includes(query) ||
      String(item[FIELD_PROFESSOR] || '')
        .toLowerCase()
        .includes(query) ||
      String(item[FIELD_COURSE_NO] || '')
        .toLowerCase()
        .includes(query)
    )
  })
}

async function init() {
  const terms = await fetchTerms()
  const selectedTermId = getSelectedTermId(terms)

  if (!selectedTermId) {
    document.getElementById('info').innerHTML = '<tr><td colspan="5" align="center">\ud45c\uc2dc\ud560 \ud559\uae30 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</td></tr>'
    return
  }

  renderTermOptions(terms, selectedTermId)

  const data = await getRequest(selectedTermId)
  data.data.sort((left, right) => Number.parseFloat(right[FIELD_COMPETITION]) - Number.parseFloat(left[FIELD_COMPETITION]))
  data.data = filterDataBySearch(data.data)
  data.data.forEach((item, index) => {
    item[FIELD_RANK] = index + 1
  })

  datas = data
  setPageOf(1)
}

window.setPageOf = setPageOf

document.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error(error)
    document.getElementById('info').innerHTML = '<tr><td colspan="5" align="center">\ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc624\ub294 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.</td></tr>'
  })
})
