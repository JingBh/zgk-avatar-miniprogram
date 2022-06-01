import { getDaysToGaokao } from '../miniprogram/utils/countdown'

test('countdown before', () => {
  const time = 1654041600000
  expect(getDaysToGaokao(time)).toBeGreaterThan(0)
})

test('countdown first day', () => {
  const time = 1654560000000
  expect(getDaysToGaokao(time)).toBeLessThanOrEqual(0)
})

test('countdown last day', () => {
  const time = 1654819200000
  expect(getDaysToGaokao(time)).toBeGreaterThanOrEqual(-3)
})

test('countdown after', () => {
  const time = 1655164800000
  expect(getDaysToGaokao(time)).toBeLessThan(-3)
})
