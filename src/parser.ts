import { EVENT_NAMES, type EventName, type PrescriptionEvent } from "./types.js";

const VALID_EVENTS = new Set<EventName>(EVENT_NAMES);

export function parseEventLine(
  line: string,
  options?: { strict?: boolean }
): PrescriptionEvent | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 3) {
    if (options?.strict) throw new Error(`Malformed line: "${line}"`);
    return null;
  }

  const [patientName, drugName, eventNameRaw] = parts;
  if (!VALID_EVENTS.has(eventNameRaw as EventName)) {
    if (options?.strict) throw new Error(`Unknown event name: "${eventNameRaw}"`);
    return null;
  }

  return {
    patientName,
    drugName,
    eventName: eventNameRaw as EventName
  };
}

export function parseEvents(input: string, options?: { strict?: boolean }): PrescriptionEvent[] {
  const events: PrescriptionEvent[] = [];

  for (const line of input.split(/\r?\n/)) {
    const event = parseEventLine(line, options);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

export function getParseFailureReason(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 3) return `Malformed line: "${line}"`;

  const eventNameRaw = parts[2];
  if (!VALID_EVENTS.has(eventNameRaw as EventName)) return `Unknown event name: "${eventNameRaw}"`;

  return null;
}
