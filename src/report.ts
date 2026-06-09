import type { PatientReport } from "./types.js";

export function formatIncome(income: number): string {
  if (income < 0) {
    return `-$${Math.abs(income)}`;
  }

  return `$${income}`;
}

export function formatReportLine(report: PatientReport): string {
  return `${report.patientName}: ${report.totalFills} fills ${formatIncome(report.income)} income`;
}

export function formatReport(reports: PatientReport[]): string {
  return reports.map(formatReportLine).join("\n");
}
