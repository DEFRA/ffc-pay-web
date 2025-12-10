'use strict'

module.exports = require('neostandard')({
  globals: ['describe', 'beforeEach', 'expect', 'test', 'afterEach', 'jest', 'beforeAll', 'afterAll', 'XMLHttpRequest'],
  ignores: ['app/dist/**/*.js', 'test/acceptance/**/*.js'],
})
