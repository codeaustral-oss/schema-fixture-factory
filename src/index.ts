export type JsonSchema = {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema | JsonSchema[]
  enum?: unknown[]
  const?: unknown
  examples?: unknown[]
  default?: unknown
  format?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  additionalProperties?: boolean | JsonSchema
  oneOf?: JsonSchema[]
  anyOf?: JsonSchema[]
  allOf?: JsonSchema[]
}

export type FixtureOptions = {
  seed?: number | string
  includeOptional?: boolean
  maxDepth?: number
  arrayLength?: number
}

type FixtureContext = Required<FixtureOptions> & {
  random: () => number
}

const defaultOptions: Required<FixtureOptions> = {
  seed: 42,
  includeOptional: true,
  maxDepth: 6,
  arrayLength: 2,
}

export function generateFixture(schema: JsonSchema, options: FixtureOptions = {}): unknown {
  const normalized = { ...defaultOptions, ...options }
  const context: FixtureContext = {
    ...normalized,
    random: createRandom(hashSeed(normalized.seed)),
  }

  return visit(schema, context, 0, 'value')
}

function visit(schema: JsonSchema, context: FixtureContext, depth: number, propertyName: string): unknown {
  if (depth > context.maxDepth) {
    return null
  }

  if (schema.const !== undefined) {
    return schema.const
  }

  if (schema.examples?.length) {
    return schema.examples[Math.floor(context.random() * schema.examples.length)]
  }

  if (schema.default !== undefined) {
    return schema.default
  }

  if (schema.enum?.length) {
    return schema.enum[Math.floor(context.random() * schema.enum.length)]
  }

  if (schema.oneOf?.length) {
    return visit(pick(schema.oneOf, context), context, depth + 1, propertyName)
  }

  if (schema.anyOf?.length) {
    return visit(pick(schema.anyOf, context), context, depth + 1, propertyName)
  }

  if (schema.allOf?.length) {
    return visit(mergeAllOf(schema.allOf), context, depth + 1, propertyName)
  }

  const type = firstType(schema.type) ?? inferType(schema)

  if (type === 'object') {
    const result: Record<string, unknown> = {}
    const required = new Set(schema.required ?? [])
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (required.has(key) || context.includeOptional) {
        result[key] = visit(childSchema, context, depth + 1, key)
      }
    }

    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      result.extra = visit(schema.additionalProperties, context, depth + 1, 'extra')
    }

    return result
  }

  if (type === 'array') {
    const length = clamp(schema.minItems ?? context.arrayLength, schema.minItems ?? 0, schema.maxItems ?? 8)
    const itemSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items
    return Array.from({ length }, (_, index) => visit(itemSchema ?? { type: 'string' }, context, depth + 1, `${propertyName}${index}`))
  }

  if (type === 'integer') {
    return Math.round(numberInRange(schema.minimum, schema.maximum, context))
  }

  if (type === 'number') {
    return Number(numberInRange(schema.minimum, schema.maximum, context).toFixed(2))
  }

  if (type === 'boolean') {
    return context.random() > 0.5
  }

  if (type === 'null') {
    return null
  }

  return stringValue(schema, propertyName, context)
}

function firstType(type: string | string[] | undefined): string | undefined {
  if (Array.isArray(type)) {
    return type.find((item) => item !== 'null') ?? type[0]
  }
  return type
}

function inferType(schema: JsonSchema): string {
  if (schema.properties) return 'object'
  if (schema.items) return 'array'
  if (schema.minimum !== undefined || schema.maximum !== undefined) return 'number'
  return 'string'
}

function stringValue(schema: JsonSchema, propertyName: string, context: FixtureContext): string {
  const format = schema.format?.toLowerCase()
  if (format === 'email') return `${slug(propertyName)}.${nextWord(context)}@example.com`
  if (format === 'uri' || format === 'url') return `https://example.com/${slug(propertyName)}-${randomInt(context, 100, 999)}`
  if (format === 'uuid') return uuid(context)
  if (format === 'date') return `2026-${pad(randomInt(context, 1, 12))}-${pad(randomInt(context, 1, 28))}`
  if (format === 'date-time') return `2026-${pad(randomInt(context, 1, 12))}-${pad(randomInt(context, 1, 28))}T12:00:00.000Z`

  const value = `${humanize(propertyName)} ${nextWord(context)}`
  const min = schema.minLength ?? 0
  const max = schema.maxLength ?? Math.max(value.length, 64)
  return value.padEnd(min, 'x').slice(0, max)
}

function numberInRange(minimum: number | undefined, maximum: number | undefined, context: FixtureContext): number {
  const min = minimum ?? 1
  const max = maximum ?? Math.max(min + 100, 100)
  return min + context.random() * (max - min)
}

function mergeAllOf(schemas: JsonSchema[]): JsonSchema {
  return schemas.reduce<JsonSchema>((merged, schema) => ({
    ...merged,
    ...schema,
    properties: { ...(merged.properties ?? {}), ...(schema.properties ?? {}) },
    required: Array.from(new Set([...(merged.required ?? []), ...(schema.required ?? [])])),
  }), {})
}

function pick<T>(items: T[], context: FixtureContext): T {
  return items[Math.floor(context.random() * items.length)] ?? items[0]!
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function randomInt(context: FixtureContext, min: number, max: number): number {
  return Math.floor(min + context.random() * (max - min + 1))
}

function nextWord(context: FixtureContext): string {
  const words = ['atlas', 'signal', 'north', 'cedar', 'ember', 'harbor', 'lumen', 'ridge']
  return pick(words, context)
}

function humanize(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

function slug(value: string): string {
  return humanize(value).trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'value'
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function uuid(context: FixtureContext): string {
  const hex = () => randomInt(context, 0, 0xffff).toString(16).padStart(4, '0')
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`
}

function hashSeed(seed: number | string): number {
  const text = String(seed)
  let hash = 2166136261
  for (const char of text) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
