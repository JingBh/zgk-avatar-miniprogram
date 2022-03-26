// pages/select_image/foreground.ts
import {
  getManifest,
  getPresetsOf,
  IImageDisplay,
  IPresetDisplay,
} from '../../utils/images'
import { generate, listGenerated } from '../../utils/service'
import customSupported from '../../utils/custom-supported'
import { shareMsg, shareTimeline } from '../../utils/share'

export default Page({
  data: {
    presets: [] as IPresetDisplay[],

    outerText: '',
    outerTextError: '',
    innerText: '',
    innerTextError: '',
    generated: false,
    generatedImage: null as string | null,

    customActivePreset: null as unknown | null,
    generatedPreset: [] as IImageDisplay[]
  },

  onLoad() {
    this.loadPresets()
    this.loadGenerated()
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

  loadGenerated() {
    listGenerated().then((data) => {
      this.setData({
        generatedPreset: data
      })
    })
  },

  onCustomActivePresetChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      customActivePreset: e.detail
    })
  },

  onOuterTextChange() {
    const text = this.data.outerText

    if (!text) {
      return this.setData({ outerTextError: '' })
    }

    if (text.length < 3 || text.length > 4) {
      return this.setData({ outerTextError: '请输入 3-4 个汉字' })
    }

    for (const char of text) {
      if (!customSupported.includes(char)) {
        return this.setData({ outerTextError: `不支持字符“${char}”，请只输入汉字` })
      }
    }

    this.setData({
      outerTextError: '',
      generated: false
    })
  },

  onInnerTextChange() {
    const text = this.data.innerText

    if (!text) {
      return this.setData({ innerTextError: '' })
    }

    if (text.length < 4 || text.length > 8) {
      return this.setData({ innerTextError: '请输入 4-8 个汉字' })
    }

    for (const char of text) {
      if (!customSupported.includes(char)) {
        return this.setData({ innerTextError: `不支持字符“${char}”，请只输入汉字` })
      }
    }

    this.setData({
      innerTextError: '',
      generated: false
    })
  },

  onGenerate() {
    if (!this.data.outerText) {
      this.setData({ outerTextError: '文字内容不能为空' })
    }

    if (!this.data.innerText) {
      this.setData({ innerTextError: '文字内容不能为空' })
    }

    if (this.data.outerText && !this.data.outerTextError && this.data.innerText && !this.data.innerTextError) {
      wx.showLoading({
        title: '生成图片中',
        mask: true
      })
      generate(this.data.outerText, this.data.innerText).then((url) => {
        this.setData({
          generated: true,
          generatedImage: url
        })
        this.loadGenerated()
      }).catch((error) => {
        console.error(error)
        wx.showToast({
          title: '生成图片失败',
          icon: 'error',
          duration: 2000
        })
      }).then(() => {
        wx.hideLoading()
      })
    }
  },

  onUseGenerated() {
    wx.setStorage({
      key: 'foreground',
      data: this.data.generatedImage,
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
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
