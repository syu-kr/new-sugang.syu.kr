const fs = require('fs')
const path = require('path')
const dataFiles = require('../shared/data-files.json')

const FIELD_DEPARTMENT = '\ud559\ubd80(\uacfc)'
const FIELD_COURSE_NAME = '\uac15\uc88c\uba85'
const FIELD_PROFESSOR = '\uad50\uc218\uba85'
const DEPARTMENT_LIBERAL_ARTS = '\uacf5\ud1b5(\uad50\uc591)'
const EXCLUDE_NAME_PATTERNS = ['\uc9c0\uad6c\uc0ac\ub791\uacfc\ubd09\uc0ac', '\uae00\ub85c\ubc8c \uc601\uc5b4']

function normalizeString(value) {
  return (value || '').toString().trim().replace(/\s+/g, ' ')
}

function formatTime(date) {
  const z = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())} ${z(date.getHours())}:${z(date.getMinutes())}:${z(date.getSeconds())}`
}

function getDiscoveredTerms(rootDirectory) {
  const termsDirectory = path.join(rootDirectory, dataFiles.directories.terms)

  return fs
    .readdirSync(termsDirectory)
    .filter((fileName) => /^\d{4}-[12]\.json$/.test(fileName))
    .map((fileName) => fileName.replace(/\.json$/, ''))
    .sort((left, right) => {
      const [leftYear, leftSemester] = left.split('-').map(Number)
      const [rightYear, rightSemester] = right.split('-').map(Number)

      if (leftYear !== rightYear) {
        return rightYear - leftYear
      }

      return rightSemester - leftSemester
    })
}

const root = path.join(__dirname, '..')
const courses = new Map()

for (const term of getDiscoveredTerms(root)) {
  const filePath = path.join(root, dataFiles.directories.terms, `${term}.json`)
  const raw = fs.readFileSync(filePath, 'utf8')
  const json = JSON.parse(raw)
  const items = Array.isArray(json.data) ? json.data : []

  for (const item of items) {
    if (item[FIELD_DEPARTMENT] !== DEPARTMENT_LIBERAL_ARTS) continue

    const course = String(item[FIELD_COURSE_NAME] || '')
    const professor = String(item[FIELD_PROFESSOR] || '')
    if (EXCLUDE_NAME_PATTERNS.some((pattern) => course.includes(pattern))) {
      continue
    }

    const key = `${normalizeString(course)}|${normalizeString(professor)}`
    if (!courses.has(key)) {
      courses.set(key, {[FIELD_COURSE_NAME]: course, [FIELD_PROFESSOR]: professor})
    }
  }
}

const result = {
  time: formatTime(new Date()),
  data: Array.from(courses.values()),
}

const outPath = process.argv[2] || path.join(root, dataFiles.catalog.liberalArts)

fs.mkdirSync(path.dirname(outPath), {recursive: true})
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8')
console.log(`Wrote ${result.data.length} items to ${outPath}`)
