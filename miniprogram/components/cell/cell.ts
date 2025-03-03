Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared',
    virtualHost: true
  },
  properties: {
    customClass: {
      type: String,
      value: ''
    },
    theme: {
      type: String,
      value: 'auto'
    },
    iconClass: {
      type: String,
      value: ''
    },
    iconSlot: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: ''
    },
    titleClass: {
      type: String,
      value: ''
    },
    titleSlot: {
      type: Boolean,
      value: false
    },
    description: {
      type: String,
      value: ''
    },
    descriptionClass: {
      type: String,
      value: ''
    },
    descriptionSlot: {
      type: Boolean,
      value: false
    },
    value: {
      type: String,
      value: ''
    },
    valueClass: {
      type: String,
      value: ''
    },
    valueSlot: {
      type: Boolean,
      value: false
    },
    valueIconClass: {
      type: String,
      value: ''
    },
    hasDivider: {
      type: Boolean,
      value: false
    },
    isLarge: {
      type: Boolean,
      value: false
    },
    isAction: {
      type: Boolean,
      value: false
    }
  }
})
