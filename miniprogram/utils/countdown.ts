const gaokaoDate = 1654531200000
const zhongkaoDate = 1656000000000
const day = 1000 * 60 * 60 * 24

export function getDaysToGaokao(): number {
  const now = new Date().getTime()
  return Math.ceil((gaokaoDate - now) / day)
}

export function getDaysToZhongkao(): number {
  const now = new Date().getTime()
  return Math.ceil((zhongkaoDate - now) / day)
}
