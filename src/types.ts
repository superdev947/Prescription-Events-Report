export const EVENT_NAMES = ["created", "filled", "returned"] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export interface PrescriptionEvent {
  patientName: string;
  drugName: string;
  eventName: EventName;
}

export interface PatientReport {
  patientName: string;
  totalFills: number;
  income: number;
}

export interface ProcessResult {
  reports: PatientReport[];
}
