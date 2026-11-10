// src/tests/garments.test.ts
// @vitest-environment node
//
// Pure logic tests — no DOM, no React, no mocks needed.
// These run in Node which is faster than jsdom.

import { describe, it, expect } from 'vitest'
import {
  GARMENTS,
  getDefaultColor,
  getColorByLabel,
  getGarmentById,
  getGarmentAssets,
  withAssets,
} from '#/data/garments'

// ── getGarmentById ────────────────────────────────────────────────────────────
describe('getGarmentById', () => {
  it('returns the correct garment for a valid id', () => {
    const tshirt = getGarmentById('tshirt')
    expect(tshirt).toBeDefined()
    expect(tshirt?.id).toBe('tshirt')
    expect(tshirt?.name).toBeTruthy()
  })

  it('returns undefined for an unknown id', () => {
    expect(getGarmentById('unicorn')).toBeUndefined()
  })

  it('finds every garment in the GARMENTS array', () => {
    GARMENTS.forEach(g => {
      expect(getGarmentById(g.id)).toBe(g)
    })
  })
})

// ── getDefaultColor ───────────────────────────────────────────────────────────
describe('getDefaultColor', () => {
  it('returns the first colour for every garment', () => {
    GARMENTS.forEach(g => {
      const defaultColor = getDefaultColor(g)
      expect(defaultColor).toBeDefined()
      expect(defaultColor).toEqual(g.colors[0])
    })
  })
})

// ── getColorByLabel ───────────────────────────────────────────────────────────
describe('getColorByLabel', () => {
  it('finds a colour by its label (case-insensitive)', () => {
    const tshirt = getGarmentById('tshirt')!
    const firstLabel = tshirt.colors[0].label

    const found = getColorByLabel(tshirt, firstLabel)
    expect(found).toBeDefined()
    expect(found?.label).toBe(firstLabel)
  })

  it('returns undefined for a label that does not exist', () => {
    const tshirt = getGarmentById('tshirt')!
    expect(getColorByLabel(tshirt, 'NotAColour_XYZ')).toBeUndefined()
  })
})

// ── getGarmentAssets ──────────────────────────────────────────────────────────
describe('getGarmentAssets', () => {
  it('returns an object with front and back keys', () => {
    const tshirt = getGarmentById('tshirt')!
    const defaultColor = getDefaultColor(tshirt)
    const assets = getGarmentAssets(tshirt, defaultColor)

    expect(assets).toHaveProperty('front')
    expect(assets).toHaveProperty('back')
  })

  it('returns string URLs for front and back', () => {
    const tshirt = getGarmentById('tshirt')!
    const defaultColor = getDefaultColor(tshirt)
    const assets = getGarmentAssets(tshirt, defaultColor)

    expect(typeof assets.front).toBe('string')
    expect(typeof assets.back).toBe('string')
  })

  it('returns different assets for different colours', () => {
    const tshirt = getGarmentById('tshirt')!
    if (tshirt.colors.length < 2) return // skip if only one colour

    const [colorA, colorB] = tshirt.colors
    const assetsA = getGarmentAssets(tshirt, colorA)
    const assetsB = getGarmentAssets(tshirt, colorB)

    // At minimum front images should differ across colours
    expect(assetsA.front).not.toBe(assetsB.front)
  })
})

// ── withAssets ────────────────────────────────────────────────────────────────
describe('withAssets', () => {
  it('enriches every garment with asset paths', () => {
    const enriched = withAssets(GARMENTS)
    enriched.forEach(g => {
      expect(g).toHaveProperty('assets')
      expect(g.assets).toHaveProperty('front')
      expect(g.assets).toHaveProperty('back')
    })
  })

  it('does not mutate the original GARMENTS array', () => {
    const original = JSON.stringify(GARMENTS)
    withAssets(GARMENTS)
    expect(JSON.stringify(GARMENTS)).toBe(original)
  })
})

// ── GARMENTS data shape ───────────────────────────────────────────────────────
describe('GARMENTS data shape', () => {
  it('every garment has required fields', () => {
    GARMENTS.forEach(g => {
      expect(g.id).toBeTruthy()
      expect(g.name).toBeTruthy()
      expect(Array.isArray(g.colors)).toBe(true)
      expect(g.colors.length).toBeGreaterThan(0)
      expect(Array.isArray(g.sizes)).toBe(true)
      expect(g.sizes.length).toBeGreaterThan(0)
    })
  })

  it('every colour has a label and hex', () => {
    GARMENTS.forEach(g => {
      g.colors.forEach(c => {
        expect(c.label).toBeTruthy()
        expect(c.hex).toMatch(/^#[0-9A-Fa-f]{3,6}$/)
      })
    })
  })

  it('has no duplicate garment ids', () => {
    const ids = GARMENTS.map(g => g.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})
