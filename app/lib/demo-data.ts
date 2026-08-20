import type {
  DocumentRow,
  HealthArea,
  NavigationItem,
  RecordCategory,
  HealthRecord,
} from "./types";

export const navigationItems: NavigationItem[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "appointments", label: "Appointments", icon: "◫" },
  { id: "medications", label: "Medications", icon: "Rx" },
  { id: "clinical-facts", label: "Health", icon: "♡" },
  { id: "records", label: "Records", icon: "▤" },
  { id: "documents", label: "Documents", icon: "□" },
  { id: "dental", label: "Specialists", icon: "⌘" },
  { id: "exports", label: "Share", icon: "⇩" },
];

export const timelineEntries = [
  {
    date: "Aug 12, 2026",
    type: "Dental visit",
    title: "Routine exam and cleaning",
    provider: "Dr. Maya Chen · Northside Dental",
    source: "Entered by you",
    tone: "teal",
  },
  {
    date: "Jul 28, 2026",
    type: "Laboratory result",
    title: "Annual metabolic panel",
    provider: "Allegheny Health Lab",
    source: "Uploaded document",
    tone: "blue",
  },
  {
    date: "Jun 03, 2026",
    type: "Medication",
    title: "Amoxicillin 500 mg",
    provider: "Prescribed after dental procedure",
    source: "Entered by you",
    tone: "amber",
  },
  {
    date: "May 30, 2026",
    type: "Dental procedure",
    title: "Crown placed · Tooth 19",
    provider: "Dr. Maya Chen · Northside Dental",
    source: "Uploaded document",
    tone: "teal",
  },
];

export const healthAreas: HealthArea[] = [
  { name: "Primary care", detail: "3 visits · 5 records", code: "PC", tone: "blue" },
  { name: "Dental", detail: "8 visits · 12 records", code: "DE", tone: "teal", destination: "dental" },
  { name: "Vision", detail: "2 visits · 4 records", code: "VI", tone: "purple" },
  { name: "Specialists", detail: "4 providers · 9 records", code: "SP", tone: "amber" },
  { name: "Medications", detail: "3 current · 7 historical", code: "RX", tone: "coral" },
  { name: "Lab results", detail: "16 results", code: "LB", tone: "green" },
];

export const recordCategories: RecordCategory[] = [
  { name: "Conditions", count: 3 },
  { name: "Allergies", count: 1 },
  { name: "Medications", count: 10 },
  { name: "Immunizations", count: 7 },
  { name: "Procedures", count: 4 },
  { name: "Measurements", count: 12 },
  { name: "Encounters", count: 9 },
  { name: "Diagnostic reports", count: 16 },
];

export const documents: DocumentRow[] = [
  { title: "Treatment plan", detail: "Northside Dental · PDF", area: "Dental", date: "Aug 12, 2026" },
  { title: "Annual metabolic panel", detail: "Allegheny Health Lab · PDF", area: "Primary care", date: "Jul 28, 2026" },
  { title: "Dental X-ray · Tooth 19", detail: "Northside Dental · Image", area: "Dental", date: "May 30, 2026" },
  { title: "Vision prescription", detail: "Oakland Vision Center · PDF", area: "Vision", date: "Jan 14, 2026" },
];

export const initialHealthRecords: HealthRecord[] = [
  { id: "record-1", type: "Dental", title: "Routine exam and cleaning", date: "2026-08-12", provider: "Dr. Maya Chen", notes: "No new cavities. Continue monitoring sensitivity near tooth 19.", source: "Entered by you" },
  { id: "record-2", type: "Medication", title: "Amoxicillin 500 mg", date: "2026-06-03", provider: "Northside Dental", notes: "Completed seven-day course after dental procedure.", source: "Entered by you" },
  { id: "record-3", type: "Primary care", title: "Annual wellness visit", date: "2026-02-18", provider: "Dr. Elena Brooks", notes: "Routine physical and preventive care review.", source: "Entered by you" },
];
