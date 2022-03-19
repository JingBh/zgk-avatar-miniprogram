import { buildUrl } from './cloud-storage'

interface IAnnouncement {
  entry: {
    title: string
    label?: string
    value?: string
  }
  content: AnnouncementContent
}

type AnnouncementContent =
  IAnnouncementContentPage |
  IAnnouncementContentNavigatePage |
  IAnnouncementContentNavigateMiniProgram

interface IAnnouncementContentPage {
  type: 'page'
  title: string
  author: string
  path: string
}

interface IAnnouncementContentNavigatePage {
  type: 'navigatePage'
  url: string
}

interface IAnnouncementContentNavigateMiniProgram {
  type: 'navigateMiniProgram'
  config: WechatMiniprogram.NavigateToMiniProgramOption
}

export type AnnouncementManifest = Record<string, IAnnouncement>

let manifestCache: AnnouncementManifest | null = null

export function getManifest(): Promise<AnnouncementManifest> {
  return new Promise<AnnouncementManifest>((resolve, reject) => {
    if (manifestCache != null) {
      resolve(manifestCache)
    } else {
      wx.request<AnnouncementManifest>({
        url: buildUrl('announcements', 'manifest.json', 'timestamp'),
        responseType: 'text',
        dataType: 'json',
        enableCache: false,
        success: ({ statusCode, data }) => {
          if (statusCode >= 400) {
            console.error(`status code ${statusCode}`)
            reject(data)
          } else {
            manifestCache = data
            resolve(data)
          }
        },
        fail: (error) => reject(error)
      })
    }
  })
}
