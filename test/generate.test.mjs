import assert from 'node:assert/strict'
import test from 'node:test'
import { generateFixture } from '../dist/index.js'

test('generates deterministic fixtures from objects', () => {
  const schema = {
    type: 'object',
    required: ['id', 'email'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      role: { enum: ['admin', 'reader'] },
      tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
    },
  }

  assert.deepEqual(generateFixture(schema, { seed: 'docs' }), generateFixture(schema, { seed: 'docs' }))
  assert.equal(typeof generateFixture(schema, { seed: 'docs' }), 'object')
})

test('can omit optional properties', () => {
  const fixture = generateFixture({
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      nickname: { type: 'string' },
    },
  }, { includeOptional: false })

  assert.deepEqual(Object.keys(fixture).sort(), ['name'])
})
