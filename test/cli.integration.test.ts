import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

describe("CLI integration", () => {
  it("prints expected report when given a filename", () => {
    const out = execSync("npm run --silent dev -- sample.txt", { encoding: "utf8" });
    const trimmed = out.trim();

    expect(trimmed).toContain("Mark: 2 fills $9 income");
    expect(trimmed).toContain("John: 0 fills -$1 income");
    expect(trimmed).toContain("Nick: 0 fills $0 income");
  });
});
