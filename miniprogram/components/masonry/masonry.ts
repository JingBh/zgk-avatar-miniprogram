// components/masonry/masonry.ts
export default Component({
  options: {
    styleIsolation: 'shared'
  },

  properties: {
    process: {
      type: String,
      value: 'thumbnail'
    },
    images: Array,
    image_class: String
  },

  data: {},

  methods: {
    onClickImage(e: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('click', e.currentTarget.dataset.url)
    }
  }
})
