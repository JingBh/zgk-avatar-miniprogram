// pages/index/index.ts
import { getDaysToGaokao, getDaysToZhongkao } from '../../utils/countdown'
import { shareMsg, shareTimeline } from '../../utils/share'

let countdownInterval: number | null = null

export default Page({
  data: {
    countdownGaokao: getDaysToGaokao(),
    countdownZhongkao: getDaysToZhongkao(),
    countdownType: 1, // 1 for gaokao, 2 for zhongkao
    developerPopupShow: false,
    developerPopupShown: false,
    feedbackPopupShow: false
  },

  beforeShowDeveloperPopup() {
    this.setData({
      developerPopupShown: true
    })
  },

  showDeveloperPopup() {
    this.setData({
      developerPopupShow: true
    })
  },

  hideDeveloperPopup() {
    this.setData({
      developerPopupShow: false
    })
  },

  afterHideDeveloperPopup() {
    this.setData({
      developerPopupShown: false
    })
  },

  showFeedbackPopup() {
    this.setData({
      feedbackPopupShow: true
    })
  },

  hideFeedbackPopup() {
    this.setData({
      feedbackPopupShow: false
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
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
