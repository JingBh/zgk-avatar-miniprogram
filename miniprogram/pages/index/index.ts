// pages/index/index.ts
import {
  getDaysToGaokao,
  getDaysToZhongkao
} from '../../utils/countdown'

let countdownInterval: number | null = null

export default Page({
  data: {
    countdownGaokao: getDaysToGaokao(),
    countdownZhongkao: getDaysToZhongkao(),
    countdownType: 1, // 1 for gaokao, 2 for zhongkao
    developerPopupShown: false,
    feedbackPopupShown: false
  },

  showDeveloperPopup() {
    this.setData({
      developerPopupShown: true
    })
  },

  hideDeveloperPopup() {
    this.setData({
      developerPopupShown: false
    })
  },

  showFeedbackPopup() {
    this.setData({
      feedbackPopupShown: true
    })
  },

  hideFeedbackPopup() {
    this.setData({
      feedbackPopupShown: false
    })
  },

  onLoad() {
    countdownInterval = setInterval(() => {
      this.setData({
        countdownType: this.data.countdownType === 1 ? 2 : 1
      })
    }, 5000)
  },

  onUnload() {
    if (countdownInterval != null) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  },

  toSelectImage() {
    wx.navigateTo({
      url: '/pages/select_image/background'
    })
  }
})
