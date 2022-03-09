// pages/select_image/background.ts
import { getManifest, getPresetsOf } from '../../utils/images'

export default Page({
  data: {
    lastImage: null as string | null,
    canUseAvatar: false,
    presets: [] as {
      name: string,
      images: {
        title?: string,
        by?: string,
        url: string
      }[]
    }[],
    activePreset: null as unknown | null
  },

  onLoad() {
    this.loadPresets()

    if (wx.canIUse('getUserProfile')) {
      this.setData({
        canUseAvatar: true
      })
    }
  },

  onShow() {
    this.loadLastImage()
    this.setData({
      activePreset: null
    })
  },

  onActivePresetChange(event: WechatMiniprogram.CustomEvent) {
    this.setData({
      activePreset: event.detail
    })
  },

  loadLastImage() {
    wx.getStorage<string>({
      key: 'background',
      success: ({ data }) => {
        if (data) {
          if (data === 'fs') {
            this.setData({
              lastImage: `${wx.env.USER_DATA_PATH}/background.png`
            })
          } else {
            this.setData({
              lastImage: data
            })
          }
        }
      }
    })
  },

  loadPresets() {
    getManifest().then(({ background: manifest }) => {
      this.setData({
        presets: getPresetsOf(manifest)
      })
    }).catch(() => {
      wx.showToast({
        title: '加载数据失败',
        icon: 'error',
        duration: 2000
      })
    })
  },

  selectImage() {
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['original'],
        success: ({ tempFiles }) => {
          this.cropImage(tempFiles[0].tempFilePath)
        }
      })
    } else {
      wx.chooseImage({
        count: 1,
        sizeType: ['original'],
        success: ({ tempFilePaths }) => {
          this.cropImage(tempFilePaths[0])
        }
      })
    }
  },

  onClickImage(e: StringEvent) {
    wx.showLoading({
      title: '下载图片中',
      mask: true
    })
    wx.downloadFile({
      url: e.detail + '?x-oss-process=style/zoom',
      success: ({ tempFilePath }) => {
        this.cropImage(tempFilePath)
      },
      fail: () => {
        wx.showToast({
          title: '下载图片失败',
          icon: 'error',
          duration: 2000
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  onSelectUserAvatar() {
    if (wx.getUserProfile) {
      wx.getUserProfile({
        desc: '用于在当前头像基础上生成新头像',
        success: ({ userInfo: { avatarUrl }}) => {
          const urlParts = avatarUrl.split('/')
          if (Number(urlParts[urlParts.length - 1])) {
            urlParts[urlParts.length - 1] = '0'
          }
          const url = urlParts.join('/')

          this.cropImage(url)
        },
        fail: console.error
      })
    }
  },

  cropImage(src: string) {
    console.log(`selected image src: ${src}`)
    wx.navigateTo({
      url: `/pages/select_image/cropper?src=${encodeURIComponent(src)}`
    })
  },

  skip() {
    wx.navigateTo({
      url: '/pages/select_image/foreground'
    })
  }
})
