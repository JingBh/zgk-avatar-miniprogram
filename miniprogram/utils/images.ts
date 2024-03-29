import { buildUrl } from './cloud-storage'

interface IImage {
  path: string,
  by?: string,
  title?: string,
  bg?: string
}

interface IImageGroup {
  name: string,
  by?: string,
  images?: IImage[]
}

interface IImageManifestSingleType {
  pathPrefix?: string,
  groups: IImageGroup[],
}

export interface IImageManifest {
  background: IImageManifestSingleType,
  foreground: IImageManifestSingleType
}

export interface IImageDisplay {
  title?: string,
  by?: string,
  url: string,
  imageClass?: string
}

export interface IPresetDisplay {
  name: string,
  by?: string,
  images: IImageDisplay[]
}

let manifestCache: IImageManifest | null = null

export function getManifest(): Promise<IImageManifest> {
  return new Promise<IImageManifest>((resolve, reject) => {
    if (manifestCache != null) {
      resolve(manifestCache)
    } else {
      wx.request<IImageManifest>({
        url: buildUrl('images', 'manifest.v3.json', 'timestamp'),
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

export function getPresetsOf(type: IImageManifestSingleType): IPresetDisplay[] {
  return type.groups.map((group) => {
    return {
      name: group.name,
      by: group.by,
      images: group.images?.map((image) => {
        return {
          title: image.title,
          by: image.by || group.by,
          url: buildUrl(type.pathPrefix || '', image.path),
          imageClass: image.bg ? 'bg-' + image.bg : undefined
        }
      }) || []
    }
  })
}
