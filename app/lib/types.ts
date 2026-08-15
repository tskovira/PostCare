export type ViewId = "home" | "timeline" | "dental" | "records" | "documents";

export type NavigationItem = {
  id: ViewId;
  label: string;
  icon: string;
};

export type TimelineEntry = {
  date: string;
  type: string;
  title: string;
  provider: string;
  source: "Entered by you" | "Uploaded document";
  tone: "teal" | "blue" | "amber";
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
};
