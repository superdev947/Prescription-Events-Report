import { describe, expect, it } from "vitest";
import { processEventStream } from "../src/processor.js";

function* linesFromText(text: string) {
  for (const line of text.split(/\r?\n/)) {
    yield line;
  }
}

async function* asyncLines(text: string) {
  for (const l of linesFromText(text)) {
    // simulate async arrival
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
    yield l;
  }
}

describe("processEventStream", () => {
  it("matches the sample behavior when fed as a stream", async () => {
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

    const result = await processEventStream(asyncLines(sample));

    expect(result.reports).toEqual([
      { patientName: "Mark", totalFills: 2, income: 9 },
      { patientName: "John", totalFills: 0, income: -1 },
      { patientName: "Nick", totalFills: 0, income: 0 }
    ]);
  });
});
