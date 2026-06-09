import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import readline from "node:readline";

export async function readInputFromArgsOrStdin(args: string[]): Promise<string> {
  if (args.length > 1) {
    throw new Error("Expected zero or one argument: [filename]");
  }

  if (args.length === 1) {
    return readFile(args[0], "utf8");
  }

  return readStdin();
}

export function readLinesFromArgsOrStdin(args: string[]): AsyncIterable<string> {
  if (args.length > 1) {
    throw new Error("Expected zero or one argument: [filename]");
  }

  const inputStream = args.length === 1 ? createReadStream(args[0], { encoding: "utf8" }) : process.stdin;

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity
  });

  // Return the async iterator from readline which yields lines
  return rl;
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    process.stdin.on("data", (chunk: Buffer | string) => {
      if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk));
        return;
      }

      chunks.push(chunk);
    });

    process.stdin.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    process.stdin.on("error", reject);
  });
}
