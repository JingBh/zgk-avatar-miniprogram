interface StringEvent extends WechatMiniprogram.BaseEvent {
  detail: string
}

type ChooseAvatarEvent = WechatMiniprogram.CustomEvent<{
  avatarUrl: string
}>
