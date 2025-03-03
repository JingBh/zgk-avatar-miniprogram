// pages/select_image/foreground.ts
import { getManifest, getPresetsOf, type IPresetDisplay } from '../../utils/images'
import { shareMsg, shareTimeline } from '../../utils/share'
import { buildUrl } from '../../utils/cloud-storage'

Page({
  data: {
    presets: [] as IPresetDisplay[],
    showShadowHelp: false,
    shadowDemoUrl: buildUrl('assets', 'shadow-demo.jpg')
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
    wx.reportEvent('fg_preset', {
      image_url: e.detail
    })

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
  },

  navigateCustom() {
    wx.navigateTo({
      url: '/pages/select_image/foreground_custom'
    })
  },

  onShowShadowHelp() {
    this.setData({
      showShadowHelp: true
    })
  },

  onCloseShadowHelp() {
    this.setData({
      showShadowHelp: false
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
