import {setResponseHeader, setResponseStatus} from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const response = await fetch('https://api.syu.kr/v1/lecture/timetable')

    if (!response.ok) {
      setResponseStatus(event, 502)
      return {error: 'failed to fetch timetable', status: response.status}
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return response.json()
    }

    const text = await response.text()
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return text
  } catch {
    setResponseStatus(event, 500)
    return {error: 'failed to fetch timetable'}
  }
})
