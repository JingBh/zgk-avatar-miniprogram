import { buildUrl } from './cloud-storage'

export const shareMsg = (options: Partial<WechatMiniprogram.Page.ICustomShareContent> = {}) => {
  return Object.assign({
    path: '/pages/index/index',
    imageUrl: buildUrl('images', 'poster.jpg')
  }, options)
}

export const shareTimeline = (options: Partial<WechatMiniprogram.Page.ICustomTimelineContent> = {}) => {
  return Object.assign({
    title: '中高考加油头像生成器'
  }, options)
}
