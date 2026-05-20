# Schema Fixture Factory

Generate deterministic, useful JSON fixtures from JSON Schema.

## Why

Mock data often drifts away from the contract it is supposed to represent. Schema Fixture Factory gives documentation, tests, and API examples a small zero-runtime-dependency generator that reads the schema first.

## Install

```bash
npm install schema-fixture-factory
```

## CLI

```bash
npx schema-fixture-factory user.schema.json --seed docs
```

## Library

```ts
import { generateFixture } from 'schema-fixture-factory'

const user = generateFixture({
  type: 'object',
  required: ['id', 'email'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { enum: ['admin', 'reader'] },
  },
}, { seed: 'docs' })
```

## Supports

- `object`, `array`, `string`, `number`, `integer`, `boolean`, and `null`
- `properties`, `required`, `items`, `enum`, `const`, `default`, and `examples`
- `oneOf`, `anyOf`, and shallow `allOf`
- String formats: `email`, `uri`, `url`, `uuid`, `date`, `date-time`
- Deterministic seeds for repeatable fixtures

## Development

```bash
npm install
npm test
```
