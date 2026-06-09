# Project Overview

## Project Name
GiftHealth Prescription Events Report

## Purpose
This project is a TypeScript command-line application that reads prescription event data and produces a per-patient summary of:
- total active fills
- total income

It is designed to process input from a file or from standard input and generate a deterministic report for downstream use or manual review.

## What the CLI does
The program:
- parses event lines in the format `PatientName DrugName EventName`
- supports the event types `created`, `filled`, and `returned`
- tracks prescription state and patient-level aggregates
- prints a final report grouped by patient
- optionally logs malformed input lines for debugging or monitoring

## Main Features
- Streaming input support for large files
- Strict mode for fail-fast validation
- Failure-log support in JSONL format
- Verbose stderr warnings
- Modular TypeScript architecture
- Automated tests with Vitest

## Core Architecture
Key source files:
- `src/cli.ts` — CLI entry point, argument parsing, and error handling
- `src/io.ts` — input reading from file or stdin
- `src/parser.ts` — line parsing and validation
- `src/processor.ts` — business logic and event state transitions
- `src/report.ts` — formatted output generation
- `src/types.ts` — shared domain types

## Business Rules
- `created` initializes a prescription and ensures the patient appears in the report.
- `filled` increases the active fill count and income when the prescription exists.
- `returned` cancels one prior fill and applies a net income adjustment when valid.
- Invalid or unknown lines are ignored by default, unless strict mode is enabled.

## Output Format
Example report line:

```text
PatientName: TotalFills fills $Income income
```

For negative income, the output uses a minus sign, for example:

```text
PatientName: 0 fills -$1 income
```

## Quick Start
Install dependencies:

```bash
npm install
```

Run the CLI on a sample file:

```bash
npm run dev -- sample.txt
```

Build and run compiled output:

```bash
npm run build
node dist/cli.js sample.txt
```

## Testing
Run the test suite with:

```bash
npm test
```

## Summary
This project is a compact, well-structured CLI tool that demonstrates strong typing, modular design, robust input handling, and test-driven development practices for a prescription event reporting task.
