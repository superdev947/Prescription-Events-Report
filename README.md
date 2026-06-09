# GiftHealth Prescription Events Report (TypeScript)

This project implements a command-line program that reads prescription events and prints a per-patient report of:

- Total active fills
- Total income

The implementation is designed to be production-quality for a small CLI task: strong typing, modular design, input validation, and automated tests.

## Runbook

### Requirements

- Node.js 20+

### Install

```bash
npm install
```

### Run

Input from a file argument:

```bash
npm run dev -- sample.txt
```

Input from stdin:

```bash
cat sample.txt | npm run dev
```

Build and run compiled output:

```bash
npm run build
node dist/cli.js sample.txt
```

The CLI supports streaming processing to handle large files without buffering the entire input and provides a `-h|--help` flag for usage information.

**CLI Flags**

- `-h`, `--help`: print usage and exit.
- `--strict`: run the parser in strict mode — the CLI will log the offending line (if `--log-failures` is provided) and exit with an error on the first malformed/unknown event line.
- `--log-failures <path>` or `--log-failures=<path>`: write parse failures to the provided file in JSON Lines (JSONL) format. Each failure record contains `timestamp`, `source`, `lineNumber`, `reason`, and the raw `line`.
- `--verbose`: print parse failure warnings to `stderr` in addition to writing the log file.

Examples:

```bash
# Process file and write failures to a log
npm run dev -- --log-failures failures.log sample.txt

# Process from stdin and show warnings on stderr
cat sample.txt | npm run dev -- --log-failures failures.log --verbose

# Fail fast on malformed input (strict)
npm run dev -- --strict --log-failures failures.log sample.txt
```

**Failure log format (JSONL)**

Each line in the failure log is a JSON object. Example record:

```json
{
  "timestamp": "2026-05-21T12:34:56.789Z",
  "source": "sample.txt",
  "lineNumber": 42,
  "reason": "Malformed line: \"badline\"",
  "line": "badline"
}
```

The log is append-only and intended for post-run analysis or ingestion by monitoring tooling. The CLI writes failures in a best-effort way and will not fail if the log file cannot be written (except in strict mode where the parse error itself is re-thrown).

### Test

```bash
npm test
```

## Input/Output

Input format (space-delimited):

```text
PatientName DrugName EventName
```

Supported events:

- created
- filled
- returned

Output format:

```text
PatientName: TotalFills fills $Income income
```

For negative income:

```text
PatientName: TotalFills fills -$Income income
```

## Design

### Module structure

- src/cli.ts: CLI entrypoint and error handling
- src/io.ts: Reads from filename argument or stdin
- src/parser.ts: Parses/validates lines into typed events
- src/processor.ts: Core business logic/state transitions
- src/report.ts: Output formatting
- src/types.ts: Shared domain types

### Core data structures

- Map keyed by "patient:drug" for prescription state:
  - created flag
  - active fill count for that prescription
- Map keyed by patient name for aggregate patient metrics:
  - totalFills
  - income

This gives O(n) time over n events and O(p + r) memory, where p is number of patients and r is number of unique prescriptions.

### Event handling rules implemented

- created initializes a prescription and ensures the patient appears in output.
- filled is counted only if the prescription was created.
- returned is counted only if the prescription was created and has an active fill to cancel.
- Events are processed in file order.

### Income model

Based on the prompt and expected output:

- filled adds +$5 and +1 active fill.
- returned cancels one prior fill and applies a $1 loss.

So a return applies net income delta of -$6 and -1 active fill.

## Assumptions

- If a line is malformed or has an unknown event name, it is ignored.
- A patient is included in output only if at least one created event is seen for any of their prescriptions.
- returned without an active fill for the prescription is ignored defensively (even though prompt says returns always have a prior fill).
- Output order is deterministic: total fills descending, then patient name ascending.

## Tradeoffs

- I chose lightweight stateful maps rather than a richer event-sourcing model because the input is already ordered and the report is aggregate-only.
- Parsing currently ignores invalid lines rather than failing fast; this makes the CLI more resilient to noisy input, but strict mode could be added if needed.
- Sorting is not required by the prompt, but deterministic ordering improves testability and UX.

## Example

Given the sample input in the prompt, output is:

```text
Mark: 2 fills $9 income
John: 0 fills -$1 income
Nick: 0 fills $0 income
```
