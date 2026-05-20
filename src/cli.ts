#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { generateFixture, type FixtureOptions, type JsonSchema } from './index.js'

type CliArgs = {
  schemaPath?: string
  seed?: string
  optional?: boolean
  help?: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--seed') args.seed = argv[++index]
    else if (arg === '--required-only') args.optional = false
    else if (!args.schemaPath) args.schemaPath = arg
  }
  return args
}

function printHelp(): void {
  console.log(`schema-fixture <schema.json> [--seed value] [--required-only]

Generate deterministic JSON fixtures from JSON Schema.

Examples:
  schema-fixture user.schema.json
  schema-fixture user.schema.json --seed docs
  schema-fixture user.schema.json --required-only`)
}

const args = parseArgs(process.argv.slice(2))
if (args.help || !args.schemaPath) {
  printHelp()
  process.exit(args.help ? 0 : 1)
}

const schema = JSON.parse(readFileSync(args.schemaPath, 'utf8')) as JsonSchema
const options: FixtureOptions = {
  seed: args.seed ?? 42,
  includeOptional: args.optional ?? true,
}

console.log(JSON.stringify(generateFixture(schema, options), null, 2))
