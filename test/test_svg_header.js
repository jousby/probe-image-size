'use strict'


const assert = require('assert')
const { describe, it } = require('node:test')
const parseSvgHeader = require('../lib/common/svg_header')


describe('svg header parser', function () {
  it('should extract width info from viewbox', function () {
    assert.deepStrictEqual(
      parseSvgHeader('<svg viewbox="0 0 800 600"></svg>'),
      { width: 800, height: 600, type: 'svg', mime: 'image/svg+xml', wUnits: 'px', hUnits: 'px' }
    )
  })

  it('should extract width info from camel cased viewBox', function () {
    assert.deepStrictEqual(
      parseSvgHeader('<svg viewBox="0 0 800 600"></svg>'),
      { width: 800, height: 600, type: 'svg', mime: 'image/svg+xml', wUnits: 'px', hUnits: 'px' }
    )
  })

  it('should return width/height units', function () {
    assert.deepStrictEqual(
      parseSvgHeader('<svg width="5in" height="4pt"></svg>'),
      { width: 5, height: 4, type: 'svg', mime: 'image/svg+xml', wUnits: 'in', hUnits: 'pt' }
    )
  })

  it('should ignore stroke-width', function () {
    assert.deepStrictEqual(
      parseSvgHeader('<svg stroke-width="2" width="5" height="4"></svg>'),
      { width: 5, height: 4, type: 'svg', mime: 'image/svg+xml', wUnits: 'px', hUnits: 'px' }
    )
  })

  it('should not parse HTML as SVG', function () {
    assert.strictEqual(
      parseSvgHeader('<html><body><svg width="5" height="4"></svg></body></html>'),
      undefined
    )
  })

  it('should skip initial comments and directives', function () {
    assert.deepStrictEqual(
      parseSvgHeader('<?xml version="1.0"?><!-- comment --><svg width="5" height="4"></svg>'),
      { width: 5, height: 4, type: 'svg', mime: 'image/svg+xml', wUnits: 'px', hUnits: 'px' }
    )
  })

  it('should allow SVG namespace', function () {
    assert.deepStrictEqual(
      parseSvgHeader('<aaa:svg xmlns:aaa="http://www.w3.org/2000/svg" width="5" height="4"></aaa:svg>'),
      { width: 5, height: 4, type: 'svg', mime: 'image/svg+xml', wUnits: 'px', hUnits: 'px' }
    )
  })

  describe('coverage', function () {
    it('single quotes (width/height)', function () {
      assert.deepStrictEqual(
        parseSvgHeader("<svg width='5in' height='4pt'></svg>"),
        { width: 5, height: 4, type: 'svg', mime: 'image/svg+xml', wUnits: 'in', hUnits: 'pt' }
      )
    })

    it('single quotes (viewbox)', function () {
      assert.deepStrictEqual(
        parseSvgHeader("<svg width='1in' viewbox='0 0 100 50'>"),
        { width: 1, height: 0.5, type: 'svg', mime: 'image/svg+xml', wUnits: 'in', hUnits: 'in' }
      )
    })

    it('width, no height', function () {
      assert.deepStrictEqual(
        parseSvgHeader('<svg width="1in" viewbox="0 0 100 50">'),
        { width: 1, height: 0.5, type: 'svg', mime: 'image/svg+xml', wUnits: 'in', hUnits: 'in' }
      )
    })

    it('height, no width', function () {
      assert.deepStrictEqual(
        parseSvgHeader('<svg height="1in" viewbox="0 0 100 50">'),
        { width: 2, height: 1, type: 'svg', mime: 'image/svg+xml', wUnits: 'in', hUnits: 'in' }
      )
    })

    it('width is invalid, no height', function () {
      assert.strictEqual(parseSvgHeader('<svg width="-1" viewbox="0 0 100 50">'), undefined)
    })

    it('height is invalid, no width', function () {
      assert.strictEqual(parseSvgHeader('<svg height="foobar" viewbox="0 0 100 50">'), undefined)
    })

    it('width is invalid (non positive)', function () {
      assert.strictEqual(parseSvgHeader('<svg width="0" height="5">'), undefined)
    })

    it('width is invalid (Infinity)', function () {
      assert.strictEqual(parseSvgHeader('<svg width="Infinity" height="5">'), undefined)
    })

    it('no viewbox, no height', function () {
      assert.strictEqual(parseSvgHeader('<svg width="5">'), undefined)
    })

    it('viewbox units are different', function () {
      assert.strictEqual(parseSvgHeader('<svg width="5" viewbox="0 0 5px 3in">'), undefined)
    })

    it('unclosed tag', function () {
      assert.strictEqual(parseSvgHeader('<svg width="5" height="5"'), undefined)
    })
  })
})
