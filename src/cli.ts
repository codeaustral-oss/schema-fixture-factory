#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { generateFixture, type FixtureOptions, type JsonSchema } from './index.js'

type CliArgs = {
  schemaPath?: string
  seed?: string
  arrayLength?: number
  maxDepth?: number
  optional?: boolean
  help?: boolean
  version?: boolean
}

const version = '0.1.0'

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--version' || arg === '-v') args.version = true
    else if (arg === '--seed') args.seed = argv[++index]
    else if (arg === '--array-length') args.arrayLength = Number(argv[++index])
    else if (arg === '--max-depth') args.maxDepth = Number(argv[++index])
    else if (arg === '--required-only') args.optional = false
    else if (!args.schemaPath) args.schemaPath = arg
  }
  return args
}

function printHelp(): void {
  console.log(`schema-fixture <schema.json> [--seed value] [--required-only] [--array-length n] [--max-depth n]

Generate deterministic JSON fixtures from JSON Schema.

Examples:
  schema-fixture user.schema.json
  schema-fixture user.schema.json --seed docs
  schema-fixture user.schema.json --required-only
  schema-fixture catalog.schema.json --array-length 4 --max-depth 8`)
}

const args = parseArgs(process.argv.slice(2))
if (args.version) {
  console.log(version)
  process.exit(0)
}

if (args.help || !args.schemaPath) {
  printHelp()
  process.exit(args.help ? 0 : 1)
}

const schema = JSON.parse(readFileSync(args.schemaPath, 'utf8')) as JsonSchema
const options: FixtureOptions = {
  seed: args.seed ?? 42,
  includeOptional: args.optional ?? true,
  arrayLength: Number.isFinite(args.arrayLength) ? args.arrayLength : undefined,
  maxDepth: Number.isFinite(args.maxDepth) ? args.maxDepth : undefined,
}

console.log(JSON.stringify(generateFixture(schema, options), null, 2))
