export type ViewId = "home" | "timeline" | "appointments" | "medications" | "clinical-facts" | "health-profile" | "dental" | "records" | "documents" | "activity" | "exports" | "archive";

export type NavigationItem = {
  id: ViewId;
  label: string;
  icon: string;
};

export type TimelineEntry = {
  id: string;
  date: string;
  type: string;
  title: string;
  provider: string;
  source: "Entered by you" | "Uploaded document" | "Appointment" | "Medication" | "Health detail";
  tone: "teal" | "blue" | "amber";
  destination: ViewId;
};

export type HealthArea = {
  name: string;
  detail: string;
  code: string;
  tone: "blue" | "teal" | "purple" | "amber" | "coral" | "green";
  destination?: ViewId;
};

export type DocumentRow = {
  title: string;
  detail: string;
  area: string;
  date: string;
};

export type RecordCategory = {
  name: string;
  count: number;
};

export type HealthRecord = {
  id: string;
  type: string;
  title: string;
  date: string;
  provider: string;
  notes: string;
  source: "Entered by you";
  deletedAt?: string | null;
};

export type Appointment = {
  id: string;
  title: string;
  healthArea: string;
  provider: string;
  facility: string;
  startsAt: string;
  durationMinutes: number;
  location: string;
  preparation: string;
  status: "scheduled" | "completed" | "cancelled";
};

export type HealthProfile = {
  allergies: string[];
  medications: string[];
  conditions: string[];
  bloodType: string;
  primaryProvider: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  reviewedAt: string;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  prescribingProvider: string;
  startDate: string;
  endDate: string;
  refillDate: string;
  pharmacy: string;
  status: "active" | "completed" | "discontinued";
  notes: string;
};

export type ClinicalFact = { id:string; kind:"allergy"|"condition"; name:string; severity:"mild"|"moderate"|"severe"|"unknown"; reaction:string; onsetDate:string; status:"active"|"resolved"|"inactive"; confirmingProvider:string; notes:string };

export type HealthDocument = {
  id: string;
  title: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  healthArea: string;
  status: "available";
  uploadedAt: string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: "created" | "updated" | "uploaded" | "opened" | "exported" | "shared" | "accessed" | "revoked" | "archived" | "restored" | "cancelled" | "completed" | "requested";
  entityType: "health_record" | "document" | "health_summary" | "share_link" | "appointment" | "health_profile" | "account_deletion" | "medication" | "clinical_fact";
  entityId: string;
  entityLabel: string;
  occurredAt: string;
};

export type ShareGrant = {
  id: string;
  label: string;
  recordCount: number;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  lastAccessedAt: string | null;
  accessCount: number;
  active: boolean;
};
