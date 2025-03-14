// pages/export/export.ts
import { shareMsg, shareTimeline } from '../../utils/share'

Page({
  data: {},

  onLoad() {

  },

  onReady() {
  },

  onShareAppMessage: () => shareMsg(),

  onShareTimeline: () => shareTimeline()
})
