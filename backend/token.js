const { sign, verify} = require('jsonwebtoken')

const { log, wechat } = require('./cloud.js')
const { errorToResponse } = require('./errors.js')

// messages for hackers (if there are any)
const messageEn = 'If you are reading this message,' +
  'please note that your WeChat OpenID is recorded when calling APIs provided by this service.' +
  'Abusing this service might result in your WeChat account being permanently banned from using our MiniProgram.'
const messageCn = '如果你正在阅读这条信息，请注意，' +
  '调用本服务提供的 API 的过程中，你的微信 OpenID 会被记录。' +
  '滥用本服务可能导致你的微信号被永久禁止使用本小程序。'

const bannedOpenIds = JSON.parse(process.env.APP_BANNED_OPENIDS || '[]')
const jwtSecret = Buffer.from(process.env.APP_JWT_SECRET, 'hex')

const verifyToken = async (token) => {
  if (token.startsWith('Bearer ')) {
    token = token.slice(7)
  }

  const openid = verify(token, jwtSecret).sub
  if (bannedOpenIds.includes(openid)) {
    throw new Error('banned')
  }

  return openid
}

const handleToken = async (body) => {
  if (!body.code) {
    return errorToResponse(new Error('解析请求失败'), 400)
  }

  const openid = await wechat.codeToOpenId(body.code)
  await log.writeLog({
    openid
  }, 'token')
  if (bannedOpenIds.includes(openid)) {
    return errorToResponse(new Error('banned'), 403)
  }

  const token = sign({}, jwtSecret, {
    expiresIn: '7d',
    subject: openid
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 60 * 60 * 24 * 7
      },
      message: `${messageEn}\n${messageCn}`
    }),
    isBase64Encoded: false
  }
}

module.exports = {
  verifyToken,
  handleToken
}
