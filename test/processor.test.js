import { describe, expect, it } from "vitest";
import { processEvents } from "../src/processor.js";
describe("processEvents", () => {
    it("matches the sample behavior", () => {
        const events = [
            { patientName: "Nick", drugName: "A", eventName: "created" },
            { patientName: "Mark", drugName: "B", eventName: "created" },
            { patientName: "Mark", drugName: "B", eventName: "filled" },
            { patientName: "Mark", drugName: "C", eventName: "filled" },
            { patientName: "Mark", drugName: "B", eventName: "returned" },
            { patientName: "John", drugName: "E", eventName: "created" },
            { patientName: "Mark", drugName: "B", eventName: "filled" },
            { patientName: "Mark", drugName: "B", eventName: "filled" },
            { patientName: "Paul", drugName: "D", eventName: "filled" },
            { patientName: "John", drugName: "E", eventName: "filled" },
            { patientName: "John", drugName: "E", eventName: "returned" }
        ];
        expect(processEvents(events).reports).toEqual([
            { patientName: "Mark", totalFills: 2, income: 9 },
            { patientName: "John", totalFills: 0, income: -1 },
            { patientName: "Nick", totalFills: 0, income: 0 }
        ]);
    });
    it("ignores filled/returned before created", () => {
        const events = [
            { patientName: "A", drugName: "X", eventName: "filled" },
            { patientName: "A", drugName: "X", eventName: "returned" },
            { patientName: "A", drugName: "X", eventName: "created" },
            { patientName: "A", drugName: "X", eventName: "filled" }
        ];
        expect(processEvents(events).reports).toEqual([
            { patientName: "A", totalFills: 1, income: 5 }
        ]);
    });
    it("tracks prescriptions independently per drug", () => {
        const events = [
            { patientName: "A", drugName: "X", eventName: "created" },
            { patientName: "A", drugName: "Y", eventName: "created" },
            { patientName: "A", drugName: "X", eventName: "filled" },
            { patientName: "A", drugName: "Y", eventName: "filled" },
            { patientName: "A", drugName: "X", eventName: "returned" }
        ];
        expect(processEvents(events).reports).toEqual([
            { patientName: "A", totalFills: 1, income: 4 }
        ]);
    });
});
//# sourceMappingURL=processor.test.js.map