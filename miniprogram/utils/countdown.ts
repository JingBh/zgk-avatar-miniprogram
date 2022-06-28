const gaokaoDate = 1686067200000 // 2023-06-07
const zhongkaoDate = 1687536000000 // 2023-06-24
const day = 1000 * 60 * 60 * 24

export const getDaysToGaokao = (time: number = new Date().getTime()) => Math.ceil((gaokaoDate - time) / day)

export const getDaysToZhongkao = (time: number = new Date().getTime()) => Math.ceil((zhongkaoDate - time) / day)
