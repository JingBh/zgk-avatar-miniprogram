const { Readable } = require('stream')

const {
  default: ImageAudit20191230,
  ScanImageAdvanceRequest,
  ScanImageAdvanceRequestTask,
  ScanTextRequest,
  ScanTextRequestLabels,
  ScanTextRequestTasks
} = require('@alicloud/imageaudit20191230')
const {
  default: Sls20201230,
  LogContent,
  LogGroup,
  LogItem,
  PutLogsRequest
} = require('@alicloud/sls20201230')
const { Config } = require('@alicloud/openapi-client')
const { RuntimeOptions } = require('@alicloud/tea-util')
const OSS = require('ali-oss')

/**
 * Alibaba Cloud OSS Client
 */
const oss = new OSS({
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  endpoint: process.env.ALIYUN_OSS_ENDPOINT,
  bucket: process.env.ALIYUN_OSS_BUCKET
})

/**
 * Alibaba Cloud SLS log service client
 */
class LogService {
  constructor() {
    const config = new Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: process.env.ALIYUN_SLS_ENDPOINT,
    })
    this.client = new Sls20201230(config)
    this.project = process.env.ALIYUN_SLS_PROJECT
    this.logStore = process.env.ALIYUN_SLS_LOGSTORE
  }

  async writeLog(entries, topic) {
    entries = Array.isArray(entries) ? entries : Object.entries(entries)
    try {
      await this.client.putLogs(this.project, this.logStore, new PutLogsRequest({
        body: new LogGroup({
          topic: topic,
          logItems: [
            new LogItem({
              time: Math.floor(Date.now() / 1000),
              contents: entries.map(([key, value]) => new LogContent({
                key,
                value: value.toString()
              }))
            })
          ]
        })
      }))
    } catch (error) {
      console.error(error)
    }
  }
}

const log = new LogService()

/**
 * Alibaba Cloud ImageAudit service client
 */

class AuditService {
  constructor() {
    const config = new Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'imageaudit.cn-shanghai.aliyuncs.com',
    })
    this.client = new ImageAudit20191230(config)
  }

  async scanText(content) {
    if (typeof content === 'string') {
      content = [content]
    }

    const result = await this.client.scanText(new ScanTextRequest({
      tasks: content.map((text) => new ScanTextRequestTasks({
        content: text
      })),
      labels: [
        new ScanTextRequestLabels({
          label: 'politics'
        }),
        new ScanTextRequestLabels({
          label: 'abuse'
        }),
        new ScanTextRequestLabels({
          label: 'terrorism'
        }),
        new ScanTextRequestLabels({
          label: 'porn'
        })
      ]
    }))

    try {
      for (const task of result.body.data.elements) {
        for (const result of task.results) {
          if (result.suggestion !== 'pass') {
            console.log('blocked by audit: ', result.details)
            return false
          }
        }
      }
    } catch (e) {
      console.error('error when auditing: ', e)
      return false
    }

    return true
  }

  async scanImage(content) {
    const result = await this.client.scanImageAdvance(new ScanImageAdvanceRequest({
      task: [
        new ScanImageAdvanceRequestTask({
          imageURLObject: Readable.from(content)
        })
      ],
      scene: [
        'porn',
        'terrorism'
      ]
    }), new RuntimeOptions({}))

    try {
      for (const task of result.body.data.results) {
        for (const scene of task.subResults) {
          if (scene.suggestion !== 'pass') {
            console.log('blocked by audit: ', scene)
            return false
          }
        }
      }
    } catch (e) {
      console.error('error when auditing: ', e)
      return false
    }

    return true
  }
}

const audit = new AuditService()

/**
 * WeChat MiniProgram backend service client
 */
class WechatService {
  constructor() {
    this.accessToken = null
    this.accessTokenExpiry = 0
  }

  async getAccessToken() {
    if (this.accessToken && this.accessTokenExpiry - 5 > Date.now()) {
      return this.accessToken
    }

    const res = await fetch('https://api.weixin.qq.com/cgi-bin/stable_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credential',
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_APPSECRET
      })
    })
    const data = await res.json()
    if (!data.access_token) {
      console.error(data)
      throw new Error(data.errmsg || '登录失败')
    }
    this.accessToken = data.access_token
    this.accessTokenExpiry = Date.now() + data.expires_in * 1000
    return this.accessToken
  }

  async codeToOpenId(code) {
    const res = await fetch('https://api.weixin.qq.com/sns/jscode2session?' + new URLSearchParams({
      appid: process.env.WECHAT_APPID,
      secret: process.env.WECHAT_APPSECRET,
      js_code: code,
      grant_type: 'authorization_code'
    }))
    const data = await res.json()
    if (!data.openid) {
      console.error(data)
      throw new Error(data.errmsg || '登录失败')
    }
    return data.openid
  }
}

const wechat = new WechatService()

module.exports = {
  oss,
  log,
  audit,
  wechat
}
