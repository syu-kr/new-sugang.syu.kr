import {constants} from 'node:fs'
import {access, readFile, readdir} from 'node:fs/promises'
import {join, resolve} from 'node:path'

import dataFiles from '~/shared/data-files.json'

const TERM_FILE_PATTERN = /^(\d{4})-([12])\.json$/

function rootPath(...parts: string[]) {
  return join(process.cwd(), ...parts)
}

function parseTerm(term: string) {
  const match = TERM_FILE_PATTERN.exec(`${term}.json`)

  if (!match) {
    return null
  }

  return {
    year: Number.parseInt(match[1], 10),
    semester: Number.parseInt(match[2], 10),
  }
}

async function readJsonFile(filePath: string) {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

export function getTermsDirectoryPath() {
  return rootPath(dataFiles.directories.terms)
}

export async function listAvailableTerms() {
  const entries = await readdir(getTermsDirectoryPath(), {withFileTypes: true})

  return entries
    .filter((entry) => entry.isFile() && TERM_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name.replace(/\.json$/, ''))
    .sort((left, right) => {
      const leftTerm = parseTerm(left)
      const rightTerm = parseTerm(right)

      if (!leftTerm || !rightTerm) {
        return right.localeCompare(left)
      }

      if (leftTerm.year !== rightTerm.year) {
        return rightTerm.year - leftTerm.year
      }

      return rightTerm.semester - leftTerm.semester
    })
}

export async function listAvailableTermDetails() {
  const terms = await listAvailableTerms()

  return terms.map((term) => {
    const parsed = parseTerm(term)

    return {
      id: term,
      year: parsed?.year ?? 0,
      semester: parsed?.semester ?? 0,
    }
  })
}

export function getTermFilePath(term: string) {
  return join(getTermsDirectoryPath(), `${term}.json`)
}

export async function isKnownTerm(term: string) {
  if (!parseTerm(term)) {
    return false
  }

  try {
    await access(getTermFilePath(term), constants.F_OK)
    return true
  } catch {
    return false
  }
}

export function getLiberalArtsFilePath() {
  return rootPath(dataFiles.catalog.liberalArts)
}

export function getCourseRateFilePath() {
  return rootPath(dataFiles.catalog.courseRate)
}

export function getSnapshotFilePath(snapshot: keyof typeof dataFiles.snapshots) {
  return rootPath(dataFiles.snapshots[snapshot])
}

export function getExternalLiveFilePath() {
  return resolve(process.cwd(), dataFiles.external.liveResponse)
}

export async function readRequiredJsonFromPath(filePath: string) {
  return readJsonFile(filePath)
}

export async function readOptionalJsonFromPath(filePath: string, fallback = {time: null, data: []}) {
  try {
    await access(filePath, constants.F_OK)
  } catch {
    return fallback
  }

  return readJsonFile(filePath)
}
