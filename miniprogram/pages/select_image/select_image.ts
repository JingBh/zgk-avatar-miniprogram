import compareVersion from '../../utils/compare-version'
import { getManifest, type IImageAlbumBackground } from '../../utils/images'
import log from '../../utils/log'
import { keyBackground } from '../../utils/local-storage'
import { auditImage } from '../../utils/service'
import { shareMsg, shareTimeline } from '../../utils/share'

Page({
  data: {
    lastImage: null as string | null,
    canUseOpenData: false,
    canUseAvatar: false,
    canSelectImageFromChat: false,
    albums: [] as IImageAlbumBackground[]
  },

  onLoad() {
    this.loadAlbums()

    if (compareVersion('2.21.2') === 1) {
      this.setData({
        canUseOpenData: true
      })
    }

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

  loadAlbums() {
    getManifest().then((manifest) => {
      this.setData({
        albums: manifest.background.albums
      })
    }).catch((error) => {
      log.error(error)
      // TODO: replace with custom notify
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
        sizeType: ['original', 'compressed'],
        success: ({ tempFiles }) => {
          wx.reportEvent('bg_custom')
          this.cropAuditImage(tempFiles[0].tempFilePath)
        }
      })
    } else {
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        success: ({ tempFilePaths }) => {
          wx.reportEvent('bg_custom')
          this.cropAuditImage(tempFilePaths[0])
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
        this.cropAuditImage(tempFiles[0].path)
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
          this.cropAuditImage(url)
        },
        fail: log.error
      })
    }
  },

  handleSelectOpenDataAvatar(e: ChooseAvatarEvent) {
    wx.getImageInfo({
      src: e.detail.avatarUrl,
      success: ({ path, width, height }) => {
        wx.reportEvent('bg_avatar')

        if (width === height) {
          wx.setStorage({
            key: keyBackground,
            data: path,
            success: () => {
              wx.navigateTo({
                url: '/pages/export/export'
              })
            },
            fail: () => {
              wx.navigateTo({
                url: `/pages/cropper/cropper?src=${encodeURIComponent(path)}`
              })
            }
          })
        } else {
          wx.navigateTo({
            url: `/pages/cropper/cropper?src=${encodeURIComponent(path)}`
          })
        }
      },
      fail: (e) => {
        log.error(e)
        this.setData({
          canUseOpenData: false
        })
        wx.showModal({
          title: '注意',
          content: '获取当前头像失败，请选择其它方法上传图片',
          showCancel: false
        })
      }
    })
  },

  handleSkip() {
    wx.navigateTo({
      url: '/pages/export/export'
    })
  },

  cropAuditImage(src: string) {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    auditImage(src).then(() => {
      wx.hideLoading()
      wx.navigateTo({
        url: `/pages/cropper/cropper?src=${encodeURIComponent(src)}`
      })
    }).catch((e) => {
      wx.hideLoading()
      wx.showModal({
        title: '注意',
        content: e,
        showCancel: false
      })
    })
  },

  handleOpenAlbum(e: WechatMiniprogram.TouchEvent) {
    const albumName = e.currentTarget.dataset.album
    wx.navigateTo({
      url: `/pages/select_image/album?name=${encodeURIComponent(albumName)}`
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
