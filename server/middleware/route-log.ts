const trackedRoutes = new Set(['/basket', '/liberalarts', '/testlogin'])

export default defineEventHandler((event) => {
  const path = (getRequestURL(event).pathname || '').toLowerCase()

  if (!trackedRoutes.has(path)) {
    return
  }

  const forwardedFor = getHeader(event, 'x-forwarded-for')
  const socketAddress = event.node.req.socket.remoteAddress
  const timestamp = new Date().toLocaleString('sv-SE', {timeZone: 'Asia/Seoul'})
  const ip = forwardedFor || socketAddress || ''

  console.log(`[${timestamp} KST] ${ip} ${event.node.req.method} ${event.node.req.url}`)
})
