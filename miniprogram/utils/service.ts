import md5 from 'md5'

import type { IImageForeground } from './images'
import { keyToken } from './local-storage'
import log from './log'

const { access, mkdir, readdir, readFile, unlink, writeFile } = wx.getFileSystemManager()

const baseUrl = 'https://s.zka.cslab.top/v3/'

type ServiceResponse<T = undefined> = {
  success: true
  data: T
  message?: string
} | {
  success: false
  message: string
}

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface GenerateResponse {
  outerText: string
  innerText: string
  shadow: string
  noShadow: string
}

const buildUrl = (url: string): string => {
  return `${baseUrl}${url}?timestamp=${Date.now()}`
}

const getToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    wx.getStorage({
      key: keyToken,
      success: ({ data }) => resolve(data as string || null),
      fail: () => resolve(null)
    })
  })
}

const setToken = (token: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    wx.setStorage({
      key: keyToken,
      data: token,
      success: () => resolve(),
      fail: reject
    })
  })
}

const checkConnection = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    getToken().then((token) => {
      wx.request<ServiceResponse>({
        url: buildUrl(''),
        header: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        enableHttp2: true,
        enableQuic: true,
        dataType: 'json',
        responseType: 'text',
        success: ({ statusCode, data }) => {
          if (data.message && data.message.indexOf('banned') !== -1) {
            wx.showModal({
              title: '注意',
              content: '您的账号被禁止使用该服务。如有疑问，请与管理员联系',
              showCancel: false,
              success: () => {
                wx.exitMiniProgram()
              }
            })
            reject('user is banned')
          } else if (statusCode === 403) {
            reject('not logged in')
          } else {
            resolve()
          }
        },
        fail: reject
      })
    })
  })
}

export const login = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    checkConnection().then(() => {
      log.debug('already logged in')
    }).catch(() => {
      wx.login({
        success: ({ code }) => {
          wx.request<ServiceResponse<TokenResponse>>({
            url: buildUrl('token'),
            method: 'POST',
            data: {
              code
            },
            dataType: 'json',
            responseType: 'text',
            enableHttp2: true,
            enableQuic: true,
            success: ({ statusCode, data }) => {
              if (statusCode === 200 && data.success) {
                setToken(data.data.access_token).then(() => {
                  log.debug('successfully logged in')
                  resolve()
                }).catch(reject)
              } else if (data.message && data.message.indexOf('banned') !== -1) {
                wx.showModal({
                  title: '注意',
                  content: '您的账号被禁止使用该服务。如有疑问，请与管理员联系',
                  showCancel: false,
                  success: () => {
                    wx.exitMiniProgram()
                  }
                })
                reject('user is banned')
              } else {
                reject(data)
              }
            },
            fail: reject
          })
        },
        fail: reject
      })
    })
  })
}

export const auditImage = (src: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: ({ path, width, height }) => {
        if (width > 30000 || height > 30000) {
          return reject('图片尺寸过大，请重新选择；若原图过大，可以选择压缩后再上传')
        }

        readFile({
          filePath: path,
          success: ({ data }) => {
            const length = (typeof data === 'string') ? data.length : data.byteLength
            if (length > 10000000) {
              return reject('图片大小暂不支持超过 10M，请重新选择；若原图过大，可以选择压缩后再上传')
            }

            getToken().then((token) => {
              wx.request<ServiceResponse<boolean>>({
                url: buildUrl('audit/image'),
                method: 'POST',
                data,
                header: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/octet-stream'
                },
                dataType: 'json',
                responseType: 'text',
                enableHttp2: true,
                enableQuic: true,
                success: ({ statusCode, data }) => {
                  if (statusCode === 200 && data.success) {
                    if (data.data) {
                      resolve()
                    } else {
                      reject('您选择的图片可能包含敏感内容，根据相关规定，小程序禁止处理此类图片。若您确定本次为误判，请重试一次')
                    }
                  } else if (statusCode === 403) {
                    wx.hideLoading()
                    return wx.showModal({
                      title: '注意',
                      content: '您尚未登录，请先登录',
                      showCancel: false,
                      confirmText: '一键登录',
                      success: () => {
                        login().then(() => {
                          auditImage(src).then(resolve).catch(reject)
                        }).catch((e) => {
                          log.error(e)
                          reject('登录失败')
                        })
                      }
                    })
                  } else if (statusCode === 429) {
                    reject('很抱歉，服务器当前正忙，请等待几秒再试')
                  } else if (statusCode === 413) {
                    reject('图片大小暂不支持超过 10M，请重新选择；若原图过大，可以选择压缩后再上传')
                  } else {
                    reject('请求失败，请稍后重试')
                  }
                },
                fail: (e) => {
                  log.error(e)
                  reject('请求失败，请稍后重试')
                }
              })
            })
          },
          fail: (e) => {
            log.error(e)
            reject('读取图片失败，请重试')
          }
        })
      },
      fail: (e) => {
        log.error(e)
        reject('读取图片失败，请重试')
      }
    })
  })
}

export const generate = (outerText: string, innerText: string): Promise<IImageForeground> => {
  const cacheKey = md5(`${outerText}-${innerText}`)
  const cacheDir = `${wx.env.USER_DATA_PATH}/custom`
  const cachePath = `${cacheDir}/${cacheKey}.json`
  const shadowPath = `${cacheDir}/${cacheKey}-shadow.png`
  const noShadowPath = `${cacheDir}/${cacheKey}-no-shadow.png`

  return new Promise((resolve, reject) => {
    accessGenerated(cachePath).then(resolve).catch(() => {
      access({
        path: cacheDir,
        fail: () => {
          mkdir({
            dirPath: cacheDir
          })
        }
      })

      getToken().then((token) => {
        wx.request<ServiceResponse<GenerateResponse>>({
          url: baseUrl + 'generate',
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`
          },
          data: {
            outerText,
            innerText
          },
          dataType: 'json',
          responseType: 'text',
          enableHttp2: true,
          enableQuic: true,
          enableCache: true,
          success: ({ statusCode, data }) => {
            if (statusCode === 200 && data.success) {
              writeFile({
                filePath: shadowPath,
                data: data.data.shadow,
                encoding: 'base64',
                success: () => {
                  writeFile({
                    filePath: noShadowPath,
                    data: data.data.noShadow,
                    encoding: 'base64',
                    success: () => {
                      const result: IImageForeground = {
                        outerText,
                        innerText,
                        shadowPath,
                        noShadowPath
                      }
                      writeFile({
                        filePath: cachePath,
                        data: JSON.stringify(result),
                        encoding: 'utf-8',
                        success: () => {
                          resolve(result)
                        },
                        fail: (e) => {
                          log.error(e)
                          reject('保存图片失败，请重试')
                        }
                      })
                    },
                    fail: (e) => {
                      log.error(e)
                      reject('保存图片失败，请重试')
                    }
                  })
                },
                fail: (e) => {
                  log.error(e)
                  reject('保存图片失败，请重试')
                }
              })
            } else if (statusCode === 403) {
              wx.hideLoading()
              return wx.showModal({
                title: '注意',
                content: '您尚未登录，请先登录',
                showCancel: false,
                confirmText: '一键登录',
                success: () => {
                  login().then(() => {
                    generate(outerText, innerText).then(resolve).catch(reject)
                  }).catch((e) => {
                    log.error(e)
                    reject('登录失败')
                  })
                }
              })
            } else if (statusCode === 429) {
              reject('很抱歉，服务器当前正忙，请等待几秒再试')
            } else if (statusCode === 451) {
              reject('您输入的文本可能包含敏感内容，根据相关规定，小程序禁止处理此类文本。请重新输入')
            } else {
              reject('请求失败，请稍后重试')
            }
          },
          fail: (e) => {
            log.error(e)
            reject('请求失败，请稍后重试')
          }
        })
      })
    })
  })
}

export const accessGenerated = (cachePath: string): Promise<IImageForeground> => {
  return new Promise<IImageForeground>((resolve, reject) => {
    readFile({
      filePath: cachePath,
      encoding: 'utf-8',
      success: ({ data }) => {
        try {
          const result = JSON.parse(data as string) as IImageForeground
          access({
            path: result.shadowPath,
            success: () => {
              access({
                path: result.noShadowPath,
                success: () => {
                  resolve(result)
                },
                fail: reject
              })
            },
            fail: reject
          })
        } catch (e) {
          reject(e)
        }
      },
      fail: reject
    })
  })
}

export const listGenerated = (): Promise<IImageForeground[]> => {
  const cacheDir = `${wx.env.USER_DATA_PATH}/custom`

  return new Promise<IImageForeground[]>((resolve, reject) => {
    readdir({
      dirPath: cacheDir,
      success: async ({ files }) => {
        const data = [] as IImageForeground[]
        for (const filename of files.filter(filename => filename.endsWith('.json'))) {
          try {
            const item = await accessGenerated(`${cacheDir}/${filename}`)
            data.push(item)
          } catch (e) {
            log.error(e)
          }
        }
        resolve(data)
      },
      fail: reject
    })
  })
}

export const clearGenerated = (): Promise<void> => {
  const cacheDir = `${wx.env.USER_DATA_PATH}/custom`

  return new Promise<void>((resolve, reject) => {
    readdir({
      dirPath: cacheDir,
      success: async ({ files }) => {
        for (const filename of files) {
          await new Promise<void>((resolve1) => {
            unlink({
              filePath: `${cacheDir}/${filename}`,
              success: () => resolve1(),
              fail: (e) => {
                log.error(e)
              }
            })
          })
        }
        resolve()
      },
      fail: reject
    })
  })
}
