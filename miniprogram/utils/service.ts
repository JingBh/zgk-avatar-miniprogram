import md5 from 'md5'
import { IImageDisplay } from './images'
import log from './log'

const { access, mkdir, readdir, readFile, unlink, writeFile } = wx.getFileSystemManager()

const baseUrl = 'https://s.zka.cslab.top/v2/'

export function generate(outerText: string, innerText: string, shadow: boolean = false): Promise<string> {
  const cacheKey = md5(`${outerText}-${innerText}${shadow ? '-shadow' : ''}`)
  const cacheDir = `${wx.env.USER_DATA_PATH}/custom`
  const cachePath = `${cacheDir}/${cacheKey}.png`
  const metaPath = `${cacheDir}/${cacheKey}.json`

  return new Promise((resolve, reject) => {
    access({
      path: cachePath,
      success: () => {
        resolve(cachePath)
      },
      fail: () => {
        access({
          path: cacheDir,
          fail: () => {
            mkdir({
              dirPath: cacheDir
            })
          }
        })

        const postData: Record<string, any> = { outerText, innerText }
        if (shadow) postData.shadow = true

        wx.request<ArrayBuffer>({
          url: baseUrl + 'generate',
          method: 'POST',
          data: postData,
          dataType: '其他',
          responseType: 'arraybuffer',
          enableHttp2: true,
          enableCache: true,
          success: ({ statusCode, data }) => {
            if (statusCode === 200) {
              writeFile({
                filePath: cachePath,
                data: data,
                encoding: 'binary',
                success: () => {
                  writeFile({
                    filePath: metaPath,
                    data: JSON.stringify(postData),
                    encoding: 'utf8',
                    success: () => resolve(cachePath),
                    fail: (error) => reject(error)
                  })
                },
                fail: (error) => reject(error)
              })
            } else {
              log.error(data)
              reject(new Error('server returned error'))
            }
          },
          fail: (error) => reject(error)
        })
      }
    })
  })
}

export function listGenerated(): Promise<IImageDisplay[]> {
  const cacheDir = `${wx.env.USER_DATA_PATH}/custom`

  return new Promise((resolve, reject) => {
    readdir({
      dirPath: cacheDir,
      success: async ({ files }) => {
        const data = [] as IImageDisplay[]

        for (const filename of files.filter(filename => filename.endsWith('.png'))) {
          const metaPath = `${cacheDir}/${filename.replace('.png', '.json')}`
          const image = await new Promise<IImageDisplay>((resolve1) => {
            readFile({
              filePath: metaPath,
              encoding: 'utf8',
              success: ({ data }) => {
                const meta = JSON.parse(data as string)
                resolve1({
                  title: `${meta.outerText}·${meta.innerText}${meta.shadow ? '（阴影）' : ''}`,
                  url: `${cacheDir}/${filename}`,
                  imageClass: (meta.shadow || meta.color === '#000') ? 'bg-light' : 'bg-dark' // backwards compatibility
                })
              },
              fail: (error) => reject(error)
            })
          })

          data.push(image)
        }

        resolve(data)
      },
      fail: (error) => reject(error)
    })
  })
}

export function clearGenerated(): Promise<void> {
  const cacheDir = `${wx.env.USER_DATA_PATH}/custom`

  return new Promise((resolve, reject) => {
    readdir({
      dirPath: cacheDir,
      success: async ({ files }) => {
        for (const filename of files) {
          await new Promise<void>((resolve1) => {
            unlink({
              filePath: `${cacheDir}/${filename}`,
              success: () => resolve1(),
              fail: (error) => reject(error)
            })
          })
        }

        resolve()
      },
      fail: (error) => reject(error)
    })
  })
}
