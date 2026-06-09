import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";

describe("CLI logging of failures", () => {
  it("writes malformed lines to the provided log file", () => {
    const tmpInput = "test/tmp_malformed_input.txt";
    const logFile = "test/tmp_failures.log";

    // prepare input with one bad line
    writeFileSync(tmpInput, "Good P D created\nbadline\nAnother Good X Y created\n", { encoding: "utf8" });

    // remove previous log file if present
    try {
      unlinkSync(logFile);
    } catch {}

    try {
      execSync(`npm run --silent dev -- --log-failures ${logFile} ${tmpInput}`, { encoding: "utf8" });
    } catch (err: any) {
      // CLI may exit non-zero depending on processing; ignore for test
    }

    const contents = readFileSync(logFile, { encoding: "utf8" });
    expect(contents).toContain("Malformed line");
    expect(contents).toContain("badline");

    // cleanup
    try {
      unlinkSync(tmpInput);
      unlinkSync(logFile);
    } catch {}
  });
});
