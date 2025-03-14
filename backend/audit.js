const { audit, log } = require('./cloud.js')
const { errorToResponse } = require('./errors')

const handleAuditImage = async (openid, body) => {
  await log.writeLog({
    openid
  }, 'audit/image')

  if (body.byteLength > 10000000) {
    return errorToResponse(new Error('图片过大'), 413)
  }

  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: await audit.scanImage(body)
      }),
      isBase64Encoded: false
    }
  } catch (e) {
    if (e?.code === 'Throttling') {
      return errorToResponse(new Error('请求过于频繁'), 429)
    }

    throw e
  }
}

module.exports = {
  handleAuditImage
}
