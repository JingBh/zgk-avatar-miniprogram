const { handleAuditImage } = require('./audit.js')
const { errorToResponse } = require('./errors.js')
const { getFont } = require('./font.js')
const { handleGenerate } = require('./generate.js')
const { verifyToken, handleToken } = require('./token.js')

const handleHello = async () => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'text/plain'
  },
  body: 'OK',
  isBase64Encoded: false
})

const initializer = async () => {
  await getFont()
}

const handler = async (event, ctx) => {
  try {
    const eventObj = JSON.parse(event)
    if (eventObj.version !== 'v1') {
      console.warn('http event version might be incompatible: ', eventObj.version)
    }

    let openid = null
    if (eventObj.requestContext.http.path !== '/token') {
      try {
        openid = await verifyToken(eventObj.headers.Authorization)
        if (!openid) {
          return errorToResponse(new Error('请先登录'), 403)
        }
      } catch (e) {
        if (e.message === 'banned') {
          return errorToResponse(e, 403)
        }
        return errorToResponse('请先登录', 403)
      }
    }

    if (eventObj.requestContext.http.method === 'POST') {
      try {
        if (eventObj.isBase64Encoded) {
          eventObj.body = Buffer.from(eventObj.body, 'base64')
        }

        switch (eventObj.headers['Content-Type']) {
          case 'application/json':
            eventObj.body = JSON.parse(eventObj.body.toString())
            break
          case 'application/x-www-form-urlencoded':
            eventObj.body = Object.fromEntries(new URLSearchParams(eventObj.body.toString()))
            break
        }
      } catch (e) {
        console.error(e)
        return errorToResponse(new Error('解析请求失败'), 400)
      }
    }

    switch (eventObj.requestContext.http.path) {
      case '/':
        return await handleHello()
      case '/audit/image':
        return await handleAuditImage(openid, eventObj.body)
      case '/generate':
        return await handleGenerate(openid, eventObj.body)
      case '/token':
        return await handleToken(eventObj.body)
      default:
        return errorToResponse(new Error('解析请求失败'), 404)
    }
  } catch (e) {
    console.error(e)
    return errorToResponse(e)
  }
}

module.exports = {
  handler,
  initializer
}
