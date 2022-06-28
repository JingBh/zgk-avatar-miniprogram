import { getDaysToGaokao } from '../miniprogram/utils/countdown'

test('countdown before', () => {
  const time = 1685577600000
  expect(getDaysToGaokao(time)).toBeGreaterThan(0)
})

test('countdown first day', () => {
  const time = 1686096000000
  expect(getDaysToGaokao(time)).toBeLessThanOrEqual(0)
})

test('countdown last day', () => {
  const time = 1686355200000
  expect(getDaysToGaokao(time)).toBeGreaterThanOrEqual(-3)
})

test('countdown after', () => {
  const time = 1686700800000
  expect(getDaysToGaokao(time)).toBeLessThan(-3)
})
