// pages/select_image/foreground.ts
import { getManifest, getPresetsOf } from '../../utils/images'

export default Page({
  data: {
    presets: [] as {
      name: string,
      images: {
        title?: string,
        by?: string,
        url: string
      }[]
    }[]
  },

  onLoad() {
    this.loadPresets()
  },

  loadPresets() {
    getManifest().then(({ foreground: manifest }) => {
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

  onClickImage(e: StringEvent) {
    wx.setStorage({
      key: 'foreground',
      data: e.detail,
      success: () => {
        wx.navigateTo({
          url: '/pages/export/export'
        })
      },
      fail: () => {
        wx.showToast({
          title: '保存图片失败',
          icon: 'error',
          duration: 2000
        })
      }
    })
  }
})
