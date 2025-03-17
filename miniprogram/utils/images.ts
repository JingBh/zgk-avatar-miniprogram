import { buildUrl } from './cloud-storage'
import log from './log'

export interface IImageBackground {
  path: string
  by?: string
  title?: string
}

export interface IImageAlbumBackground {
  name: string
  title: string
  by?: string
  images: IImageBackground[]
}

export interface IImageForeground {
  outerText: string
  innerText: string
  shadowPath: string
  noShadowPath: string
}

export interface IImageManifest {
  background: {
    pathPrefix?: string
    albums: IImageAlbumBackground[]
  }
  foreground: {
    pathPrefix?: string
    images: IImageForeground[]
  }
}

let manifestCache: IImageManifest | null = null

export function getManifest(): Promise<IImageManifest> {
  return new Promise<IImageManifest>((resolve, reject) => {
    if (manifestCache != null) {
      resolve(manifestCache)
    } else {
      wx.request<IImageManifest>({
        url: buildUrl('images', 'manifest.v4.json', 'timestamp'),
        responseType: 'text',
        dataType: 'json',
        enableHttp2: true,
        enableQuic: true,
        enableCache: false,
        success: ({ statusCode, data }) => {
          if (statusCode >= 400) {
            log.error(`status code ${statusCode}`)
            reject(data)
          } else {
            data.background.albums.forEach((album) => {
              album.images.forEach((image) => {
                image.path = buildUrl('images', data.background.pathPrefix || 'bg', image.path)
              })
            })

            data.foreground.images.forEach((image) => {
              image.shadowPath = buildUrl('images', data.foreground.pathPrefix || 'fg', image.shadowPath)
              image.noShadowPath = buildUrl('images', data.foreground.pathPrefix || 'fg', image.noShadowPath)
            })

            manifestCache = data
            resolve(data)
          }
        },
        fail: (error) => reject(error)
      })
    }
  })
}

export function getBackgroundAlbum(name: string): Promise<IImageAlbumBackground> {
  return new Promise<IImageAlbumBackground>((resolve, reject) => {
    getManifest().then((manifest) => {
      const album = manifest.background.albums
        .find((album) => album.name === name)
      if (album) {
        resolve(album)
      } else {
        reject('album not found')
      }
    }).catch(reject)
  })
}
