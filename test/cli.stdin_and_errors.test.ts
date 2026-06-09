import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

const sample = `Nick A created
Mark B created
Mark B filled
Mark C filled
Mark B returned
John E created
Mark B filled
Mark B filled
Paul D filled
John E filled
John E returned`;

describe("CLI stdin and error cases", () => {
  it("accepts piped stdin and prints report", () => {
    const out = execSync("npm run --silent dev", { input: sample, encoding: "utf8" });
    const trimmed = out.trim();

    expect(trimmed).toContain("Mark: 2 fills $9 income");
    expect(trimmed).toContain("John: 0 fills -$1 income");
  });

  it("returns a non-zero exit and prints an error for missing file", () => {
    try {
      execSync("npm run --silent dev -- non-existent-file.txt", { encoding: "utf8" });
      throw new Error("expected command to fail");
    } catch (err: any) {
      expect(err.status).toBeGreaterThan(0);
      const stderr = err.stderr?.toString() || err.message || "";
      expect(stderr).toContain("Could not generate report:");
    }
  });

  it("in strict mode, malformed input causes a non-zero exit and error message", () => {
    try {
      execSync("npm run --silent dev -- --strict", { input: "badline\n", encoding: "utf8" });
      throw new Error("expected command to fail");
    } catch (err: any) {
      expect(err.status).toBeGreaterThan(0);
      const stderr = err.stderr?.toString() || err.message || "";
      expect(stderr).toMatch(/Malformed line|Unknown event name/);
    }
  });
});
