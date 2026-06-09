import type { EventName, PatientReport, PrescriptionEvent, ProcessResult } from "./types.js";
import { parseEventLine, getParseFailureReason } from "./parser.js";
import { appendFile } from "node:fs/promises";

interface PrescriptionState {
  created: boolean;
  activeFills: number;
}

interface PatientState {
  totalFills: number;
  income: number;
}

const FILL_INCOME = 5;
// Returns cancel a prior fill (removes the $5 previously earned) and also
// impose an additional $1 penalty. Net effect on income for a return is -$6.
const RETURN_PENALTY = 6;

function getPrescriptionKey(event: PrescriptionEvent): string {
  return `${event.patientName}:${event.drugName}`;
}

function getOrCreatePatientState(
  patientStateByName: Map<string, PatientState>,
  patientName: string
): PatientState {
  const existing = patientStateByName.get(patientName);
  if (existing) {
    return existing;
  }

  const created: PatientState = { totalFills: 0, income: 0 };
  patientStateByName.set(patientName, created);
  return created;
}

function applyFilled(patientState: PatientState, prescriptionState: PrescriptionState): void {
  prescriptionState.activeFills += 1;
  patientState.totalFills += 1;
  patientState.income += FILL_INCOME;
}

function applyReturned(patientState: PatientState, prescriptionState: PrescriptionState): void {
  if (prescriptionState.activeFills <= 0) {
    return;
  }

  prescriptionState.activeFills -= 1;
  patientState.totalFills -= 1;
  patientState.income -= RETURN_PENALTY;
}

export function processEvents(events: PrescriptionEvent[]): ProcessResult {
  const prescriptionStateByKey = new Map<string, PrescriptionState>();
  const patientStateByName = new Map<string, PatientState>();

  for (const event of events) {
    const key = getPrescriptionKey(event);
    const prescription = prescriptionStateByKey.get(key);

    if (event.eventName === "created") {
      if (!prescription) {
        prescriptionStateByKey.set(key, { created: true, activeFills: 0 });
      }

      getOrCreatePatientState(patientStateByName, event.patientName);
      continue;
    }

    if (!prescription || !prescription.created) {
      continue;
    }

    const patientState = getOrCreatePatientState(patientStateByName, event.patientName);
    handlePostCreateEvent(event.eventName, patientState, prescription);
  }

  const reports: PatientReport[] = [...patientStateByName.entries()]
    .map(([patientName, patientState]) => ({
      patientName,
      totalFills: patientState.totalFills,
      income: patientState.income
    }))
    .sort((a, b) => b.totalFills - a.totalFills || a.patientName.localeCompare(b.patientName));

  return { reports };
}

export async function processEventStream(
  lines: AsyncIterable<string>,
  options?: { strict?: boolean; failureLogPath?: string; verbose?: boolean; sourceName?: string }
): Promise<ProcessResult> {
  const prescriptionStateByKey = new Map<string, PrescriptionState>();
  const patientStateByName = new Map<string, PatientState>();

  let lineNo = 0;
  const source = options?.sourceName ?? "stdin";

  async function logFailure(reason: string, lineText: string) {
    const record = {
      timestamp: new Date().toISOString(),
      source,
      lineNumber: lineNo,
      reason,
      line: lineText
    };

    if (options?.verbose) {
      // Print to stderr for immediate feedback
      process.stderr.write(`Warning: ${reason} (line ${lineNo})\n`);
    }

    if (options?.failureLogPath) {
      try {
        await appendFile(options.failureLogPath, JSON.stringify(record) + "\n", { encoding: "utf8" });
      } catch {
        // Best-effort logging: ignore file write errors to avoid masking primary errors
      }
    }
  }

  for await (const line of lines) {
    lineNo += 1;

    const reason = getParseFailureReason(line);
    if (reason) {
      if (options?.strict) {
        await logFailure(reason, line);
        throw new Error(reason);
      }

      await logFailure(reason, line);
      continue;
    }

    const event = parseEventLine(line);
    if (!event) continue;

    const key = getPrescriptionKey(event);
    const prescription = prescriptionStateByKey.get(key);

    if (event.eventName === "created") {
      if (!prescription) {
        prescriptionStateByKey.set(key, { created: true, activeFills: 0 });
      }

      getOrCreatePatientState(patientStateByName, event.patientName);
      continue;
    }

    if (!prescription || !prescription.created) {
      continue;
    }

    const patientState = getOrCreatePatientState(patientStateByName, event.patientName);
    handlePostCreateEvent(event.eventName, patientState, prescription);
  }

  const reports: PatientReport[] = [...patientStateByName.entries()]
    .map(([patientName, patientState]) => ({
      patientName,
      totalFills: patientState.totalFills,
      income: patientState.income
    }))
    .sort((a, b) => b.totalFills - a.totalFills || a.patientName.localeCompare(b.patientName));

  return { reports };
}

function handlePostCreateEvent(
  eventName: Exclude<EventName, "created">,
  patientState: PatientState,
  prescriptionState: PrescriptionState
): void {
  if (eventName === "filled") {
    applyFilled(patientState, prescriptionState);
    return;
  }

  applyReturned(patientState, prescriptionState);
}
