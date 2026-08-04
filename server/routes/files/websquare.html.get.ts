export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')

  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"></head><body></body></html>'
})
