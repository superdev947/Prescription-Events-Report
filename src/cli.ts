#!/usr/bin/env node
import { processEventStream } from "./processor.js";
import { formatReport } from "./report.js";
import { readLinesFromArgsOrStdin } from "./io.js";

interface CliOptions {
  strict: boolean;
  verbose: boolean;
  failureLogPath?: string;
  filename?: string;
}

const HELP_TEXT = `Usage: prescription-report [options] [filename]

Reads space-delimited prescription events from a file or stdin and prints a per-patient report.

Options:
  -h, --help                 Show this help message
  --strict                   Exit on the first malformed line
  --verbose                  Print parse warnings to stderr
  --log-failures <path>      Append parse failures to a JSONL log file
  --log-failures=<path>      Same as above

Examples:
  prescription-report sample.txt
  cat sample.txt | prescription-report
  prescription-report --strict --log-failures failures.log sample.txt
`;

function parseCliOptions(args: string[]): CliOptions {
  let strict = false;
  let verbose = false;
  let failureLogPath: string | undefined;
  let filename: string | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--strict") {
      strict = true;
      continue;
    }

    if (arg === "--verbose") {
      verbose = true;
      continue;
    }

    if (arg === "--log-failures") {
      const next = args[i + 1];
      if (!next) {
        throw new Error("Missing value for --log-failures. Example: --log-failures failures.log");
      }

      failureLogPath = next;
      i += 1;
      continue;
    }

    if (arg.startsWith("--log-failures=")) {
      const value = arg.split("=")[1];
      if (!value) {
        throw new Error("Missing value for --log-failures. Example: --log-failures failures.log");
      }

      failureLogPath = value;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}. Run with --help to see available options.`);
    }

    if (filename) {
      throw new Error("Expected zero or one input filename.");
    }

    filename = arg;
  }

  return { strict, verbose, failureLogPath, filename };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    process.stdout.write(HELP_TEXT);
    return;
  }

  const options = parseCliOptions(args);

  // Prefer a streaming flow to handle large inputs without buffering entire file
  const inputArgs = options.filename ? [options.filename] : [];
  const lines = readLinesFromArgsOrStdin(inputArgs);
  const sourceName = options.filename ?? "stdin";
  const { reports } = await processEventStream(lines, {
    strict: options.strict,
    failureLogPath: options.failureLogPath,
    verbose: options.verbose,
    sourceName
  });
  const output = formatReport(reports);

  if (output.length > 0) {
    process.stdout.write(`${output}\n`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`Could not generate report: ${message}\n`);
  process.exitCode = 1;
});
