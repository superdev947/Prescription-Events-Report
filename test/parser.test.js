import { describe, expect, it } from "vitest";
import { parseEventLine, parseEvents } from "../src/parser.js";
describe("parseEventLine", () => {
    it("parses a valid line", () => {
        expect(parseEventLine("Mark B filled")).toEqual({
            patientName: "Mark",
            drugName: "B",
            eventName: "filled"
        });
    });
    it("returns null for invalid event names", () => {
        expect(parseEventLine("Mark B shipped")).toBeNull();
    });
    it("returns null for malformed lines", () => {
        expect(parseEventLine("Mark B")).toBeNull();
    });
});
describe("parseEvents", () => {
    it("skips blank and invalid lines", () => {
        const input = ["Mark B created", "", "Mark B nope", "John A filled"].join("\n");
        expect(parseEvents(input)).toEqual([
            { patientName: "Mark", drugName: "B", eventName: "created" },
            { patientName: "John", drugName: "A", eventName: "filled" }
        ]);
    });
});
//# sourceMappingURL=parser.test.js.map