import { describe, expect, it } from "vitest";
import { formatIncome, formatReport } from "../src/report.js";

describe("report formatting", () => {
  it("formats income with sign rules", () => {
    expect(formatIncome(9)).toBe("$9");
    expect(formatIncome(0)).toBe("$0");
    expect(formatIncome(-1)).toBe("-$1");
  });

  it("formats full report", () => {
    expect(
      formatReport([
        { patientName: "Mark", totalFills: 2, income: 9 },
        { patientName: "John", totalFills: 0, income: -1 }
      ])
    ).toBe(["Mark: 2 fills $9 income", "John: 0 fills -$1 income"].join("\n"));
  });
});
