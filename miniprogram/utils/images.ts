import { buildUrl } from './cloud-storage'

interface IImage {
  path: string,
  by?: string,
  title?: string
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

let manifestCache: IImageManifest | null = null

export function getManifest(): Promise<IImageManifest> {
  return new Promise<IImageManifest>((resolve, reject) => {
    if (manifestCache != null) {
      resolve(manifestCache)
    } else {
      wx.request<IImageManifest>({
        url: buildUrl('images', 'manifest.v2.json'),
        responseType: 'text',
        dataType: 'json',
        enableCache: true,
        success({ data }) {
          manifestCache = data
          resolve(data)
        },
        fail: ({ errMsg }) => reject(errMsg)
      })
    }
  })
}

export function getPresetsOf(type: IImageManifestSingleType) {
  return type.groups.filter((group) => {
    return group.images && group.images.length > 0
  }).map((group) => {
    return {
      name: group.name,
      by: group.by,
      images: group.images!.map((image) => {
        return {
          title: image.title,
          by: image.by || group.by,
          url: buildUrl(type.pathPrefix || '', image.path)
        }
      })
    }
  })
}
