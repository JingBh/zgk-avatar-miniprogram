import compareVersion from '../../utils/compare-version'
import { getManifest, getPresetsOf, type IPresetDisplay } from '../../utils/images'
import { keyBackground } from '../../utils/local-storage'
import { shareMsg, shareTimeline } from '../../utils/share'

Page({
  data: {
    lastImage: null as string | null,
    canUseAvatar: false,
    canSelectImageFromChat: false,
    presets: [] as IPresetDisplay[]
  },

  onLoad() {
    this.loadPresets()

    // the avatar api is only usable between 2.9.5 and 2.27.1 (exclusive)
    if (compareVersion('2.9.5') * compareVersion('2.27.1') === -1) {
      this.setData({
        canUseAvatar: true
      })
    }

    if (wx.canIUse('chooseMessageFile')) {
      this.setData({
        canSelectImageFromChat: true
      })
    }
  },

  onShow() {
    this.loadLastImage()
  },

  loadLastImage() {
    this.setData({
      lastImage: null
    })

    wx.getStorage<string>({
      key: keyBackground,
      success: ({ data }) => {
        if (data) {
          if (data.startsWith('fs:')) {
            this.setData({
              lastImage: `${wx.env.USER_DATA_PATH}/${data.substring(3)}`
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
    }).catch((error) => {
      console.error(error)
      wx.showToast({
        title: '加载相册失败',
        icon: 'error',
        duration: 2000
      })
    })
  },

  handleSelectImage() {
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['original'],
        success: ({ tempFiles }) => {
          wx.reportEvent('bg_custom')
          this.cropImage(tempFiles[0].tempFilePath)
        }
      })
    } else {
      wx.chooseImage({
        count: 1,
        sizeType: ['original'],
        success: ({ tempFilePaths }) => {
          wx.reportEvent('bg_custom')
          this.cropImage(tempFilePaths[0])
        }
      })
    }
  },

  handleSelectImageChat() {
    wx.chooseMessageFile({
      count: 1,
      type: 'image',
      success: ({ tempFiles }) => {
        wx.reportEvent('bg_custom')
        this.cropImage(tempFiles[0].path)
      }
    })
  },

  handleLastImageError() {
    this.setData({
      lastImage: null
    })
  },

  handleSelectUserAvatar() {
    if (wx.getUserProfile) {
      wx.getUserProfile({
        desc: '用于在当前头像基础上生成新头像',
        success: ({ userInfo: { avatarUrl }}) => {
          const urlParts = avatarUrl.split('/')
          if (Number(urlParts[urlParts.length - 1])) {
            urlParts[urlParts.length - 1] = '0'
          }
          const url = urlParts.join('/')

          wx.reportEvent('bg_avatar')
          this.cropImage(url)
        },
        fail: console.error
      })
    }
  },

  handleSkip() {
    wx.navigateTo({
      url: '/pages/select_image/foreground'
    })
  },

  handleOpenAlbum(e: WechatMiniprogram.TouchEvent) {
    const presetName = e.currentTarget.dataset.preset
    console.log(e.currentTarget.dataset)
    wx.navigateTo({
      url: '/pages/select_image/album?name=' + encodeURIComponent(presetName)
    })
  },

  cropImage(src: string) {
    console.log(`selected image src: ${src}`)
    wx.navigateTo({
      url: `/pages/select_image/cropper?src=${encodeURIComponent(src)}`
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
