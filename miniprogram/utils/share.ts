import { buildUrl } from './cloud-storage'

export const shareMsg = (options: Partial<WechatMiniprogram.Page.ICustomShareContent> = {}): ReturnType<WechatMiniprogram.Page.ILifetime['onShareAppMessage']> => {
  return Object.assign({
    title: '清华附中加油头像生成器',
    path: '/pages/index/index',
    imageUrl: buildUrl('assets', 'poster.jpg')
  }, options)
}

export const shareTimeline = (options: Partial<WechatMiniprogram.Page.ICustomTimelineContent> = {}): ReturnType<WechatMiniprogram.Page.ILifetime['onShareTimeline']> => {
  return Object.assign({
    title: '清华附中加油头像生成器'
  }, options)
}
