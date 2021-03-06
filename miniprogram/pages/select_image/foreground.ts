// pages/select_image/foreground.ts
import { getManifest, getPresetsOf, IImageDisplay, IPresetDisplay } from '../../utils/images'
import { clearGenerated, generate, listGenerated } from '../../utils/service'
import customSupported from '../../utils/custom-supported'
import { shareMsg, shareTimeline } from '../../utils/share'
import { buildUrl } from '../../utils/cloud-storage'

export default Page({
  data: {
    presets: [] as IPresetDisplay[],
    outerText: '清华附中',
    outerTextError: '',
    innerText: '',
    innerTextError: '',
    shadow: false,
    generated: false,
    generatedImage: null as string | null,
    generatedImageWithShadow: false,
    showShadowHelp: false,
    shadowDemoUrl: buildUrl('assets', 'shadow-demo.jpg'),
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
        presets: getPresetsOf(manifest).map((preset) => {
          preset.images = preset.images.map(image => {
            image.imageClass = "bg-dark"
            return image
          })
          return preset
        })
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

  onShadowChange() {
    this.setData({
      shadow: !this.data.shadow,
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
      const outerText = this.data.outerText
      const innerText = this.data.innerText
      const useShadow = this.data.shadow

      wx.showLoading({
        title: '生成图片中',
        mask: true
      })
      generate(
        outerText,
        innerText,
        useShadow
      ).then((url) => {
        wx.reportEvent('fg_custom', {
          outer_text: outerText,
          inner_text: innerText,
          color: '#fff',
          shadow: useShadow ? 1 : 0
        })

        this.setData({
          generated: true,
          generatedImage: url,
          generatedImageWithShadow: useShadow
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

  onClearGenerated() {
    wx.showLoading({
      title: '清除记录中',
      mask: true
    })
    this.setData({
      generated: false,
      generatedImage: '',
      customActivePreset: null,
      generatedPreset: []
    })
    clearGenerated().then(() => {
      wx.showToast({
        title: '清除记录成功',
        icon: 'success',
        duration: 2000
      })
    }).catch(() => {
      wx.showToast({
        title: '清除记录失败',
        icon: 'error',
        duration: 2000
      })
    }).then(() => {
      wx.hideLoading()
    })
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
