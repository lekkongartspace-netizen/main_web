// Shared data model + helpers for the Project Handover Document feature.
// The whole document is stored as a single JSON file on Google Drive
// (handover_<id>.json); uploaded photos live as separate Drive files and are
// referenced here only by their fileId (kept small so the JSON stays tiny and
// well under Vercel's request-body limit).

export interface Scope {
  key: string;
  label: string;
  status: "completed" | "pending";
}

export interface BuildingScope {
  label: string;
  done: boolean;
}

export interface Building {
  id: string;
  name: string;
  imageFileId: string;
  scopes: BuildingScope[];
  status: string;
  note: string;
}

export interface DetailImage {
  id: string;
  fileId: string;
  caption: string;
}

export interface DocItem {
  id: string;
  label: string;
  included: boolean;
}

export interface PunchItem {
  id: string;
  location: string;
  description: string;
  fixDate: string;
  status: "pending" | "fixed";
}

export interface AssetItem {
  id: string;
  item: string;
  qty: string;
  note: string;
}

export interface AcceptItem {
  id: string;
  label: string;
}

// Section 2 — รายละเอียดงานที่ส่งมอบ (auto-numbered: work item + detail + status)
export interface Deliverable {
  id: string;
  name: string;
  detail: string;
  status: "done" | "pending";
}

// Section 8 — ภาคผนวก (site photos / test reports / extra docs; image or PDF)
export interface AppendixItem {
  id: string;
  fileId: string;
  caption: string;
  isPdf: boolean;
}

export type HandoverStatus = "draft" | "sent" | "accepted" | "rejected";

export interface HandoverDoc {
  id: string;
  driveFileId?: string;
  createdAt?: string;
  updatedAt?: string;
  shareToken: string;
  status: HandoverStatus;

  // 1. Project information
  projectName: string;
  projectCode: string;
  location: string;
  owner: string;
  contractor: string;
  startDate: string;
  endDate: string;

  // 2. Deliverables — รายละเอียดงานที่ส่งมอบ
  deliverables: Deliverable[];

  // 8. Appendix — ภาคผนวก
  appendixItems: AppendixItem[];

  // Scope / completion status (Architecture / Interior / System / Landscape) — extra
  scopes: Scope[];

  // 3. Site overview
  siteImageFileId: string;
  buildings: Building[];

  // Detail & finish gallery
  detailImages: DetailImage[];

  // Documents handed over
  documents: DocItem[];

  // Punch list (outstanding work)
  punchList: PunchItem[];

  // Warranty
  warrantyMonths: string;
  warrantyNote: string;

  // Property / keys handed over
  assets: AssetItem[];

  // Acceptance checklist the client ticks
  acceptItems: AcceptItem[];

  // Contractor (deliverer) signature
  contractorSignName: string;
  contractorSignature: string; // PNG data URL
  contractorSignDate: string;

  // Client response (filled via the public share link)
  clientName: string;
  clientResult: "" | "pass" | "fail";
  clientReason: string;
  clientChecked: Record<string, boolean>; // acceptItem.id -> checked
  clientNote: string;
  clientSignature: string; // PNG data URL
  clientSignDate: string;
  clientSubmittedAt: string;
}

let counter = 0;
export function uid(prefix = ""): string {
  counter += 1;
  // Math.random is fine here — these ids only need to be locally unique within
  // one document, not cryptographically random.
  return prefix + Date.now().toString(36) + "_" + counter.toString(36) + Math.random().toString(36).slice(2, 6);
}

// A fresh document pre-filled with sensible defaults so the admin starts from a
// usable template instead of a blank screen.
export function defaultHandover(id: string, shareToken: string): HandoverDoc {
  return {
    id,
    shareToken,
    status: "draft",
    projectName: "",
    projectCode: "",
    location: "",
    owner: "",
    contractor: "Matching Wealth Co., Ltd.",
    startDate: "",
    endDate: "",
    deliverables: [
      { id: uid("dl_"), name: "งานโครงสร้าง", detail: "เช่น ฐานราก เสา คาน", status: "done" },
      { id: uid("dl_"), name: "งานสถาปัตย์", detail: "ผนัง พื้น ฝ้า", status: "done" },
      { id: uid("dl_"), name: "งานระบบไฟฟ้า", detail: "เดินสาย ตู้ไฟ", status: "done" },
      { id: uid("dl_"), name: "งานระบบประปา", detail: "ท่อ น้ำดี น้ำทิ้ง", status: "done" },
    ],
    appendixItems: [],
    scopes: [
      { key: "architecture", label: "งานสถาปัตย์ / โครงสร้าง", status: "completed" },
      { key: "interior", label: "งานตกแต่งภายใน", status: "completed" },
      { key: "system", label: "งานระบบ (ไฟฟ้า/ประปา/แอร์)", status: "completed" },
      { key: "landscape", label: "งานภูมิทัศน์", status: "completed" },
    ],
    siteImageFileId: "",
    buildings: [
      {
        id: uid("b_"),
        name: "อาคารหลัก (Main House)",
        imageFileId: "",
        scopes: [
          { label: "โครงสร้าง", done: true },
          { label: "ตกแต่งภายใน", done: true },
          { label: "งานระบบ", done: true },
        ],
        status: "completed",
        note: "",
      },
    ],
    detailImages: [],
    documents: [
      { id: uid("d_"), label: "แบบก่อสร้าง (As-built Drawing)", included: false },
      { id: uid("d_"), label: "BOQ / รายการวัสดุ", included: false },
      { id: uid("d_"), label: "คู่มือการใช้งานระบบ", included: false },
      { id: uid("d_"), label: "ใบรับประกัน (Warranty)", included: false },
      { id: uid("d_"), label: "รายงานตรวจสอบคุณภาพ (Inspection Report)", included: false },
      { id: uid("d_"), label: "รูปถ่ายหน้างาน", included: false },
    ],
    punchList: [],
    warrantyMonths: "12",
    warrantyNote: "งานทั้งหมดดำเนินการแล้วเสร็จตามสัญญา",
    assets: [
      { id: uid("a_"), item: "กุญแจ", qty: "", note: "" },
      { id: uid("a_"), item: "รีโมท", qty: "", note: "" },
    ],
    acceptItems: [
      { id: uid("ac_"), label: "งานโครงสร้าง (ฐานราก เสา คาน)" },
      { id: uid("ac_"), label: "งานสถาปัตย์ (ผนัง พื้น ฝ้า)" },
      { id: uid("ac_"), label: "งานระบบไฟฟ้า (เดินสาย ตู้ไฟ)" },
      { id: uid("ac_"), label: "งานระบบประปา (ท่อ น้ำดี น้ำทิ้ง)" },
      { id: uid("ac_"), label: "งานตกแต่งภายใน" },
      { id: uid("ac_"), label: "ความสะอาดและการเก็บงานโดยรวม" },
    ],
    contractorSignName: "",
    contractorSignature: "",
    contractorSignDate: "",
    clientName: "",
    clientResult: "",
    clientReason: "",
    clientChecked: {},
    clientNote: "",
    clientSignature: "",
    clientSignDate: "",
    clientSubmittedAt: "",
  };
}

// Merge a stored (possibly older / partial) document onto the defaults so the
// UI never crashes on a missing array/field.
export function normalizeHandover(raw: Partial<HandoverDoc> & { id: string; shareToken: string }): HandoverDoc {
  const base = defaultHandover(raw.id, raw.shareToken);
  return {
    ...base,
    ...raw,
    deliverables: raw.deliverables?.length ? raw.deliverables : base.deliverables,
    appendixItems: raw.appendixItems ?? base.appendixItems,
    scopes: raw.scopes?.length ? raw.scopes : base.scopes,
    buildings: raw.buildings ?? base.buildings,
    detailImages: raw.detailImages ?? base.detailImages,
    documents: raw.documents?.length ? raw.documents : base.documents,
    punchList: raw.punchList ?? base.punchList,
    assets: raw.assets ?? base.assets,
    acceptItems: raw.acceptItems?.length ? raw.acceptItems : base.acceptItems,
    clientChecked: raw.clientChecked ?? {},
  };
}

export const STATUS_LABELS: Record<HandoverStatus, string> = {
  draft: "ฉบับร่าง",
  sent: "ส่งให้ลูกค้าแล้ว",
  accepted: "ลูกค้าตรวจรับแล้ว",
  rejected: "ลูกค้าไม่ผ่าน",
};

// Escape user-supplied values before injecting into print HTML strings.
export function esc(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatThaiDate(d?: string): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

// Public, no-auth proxy for handover photos (served because they are meant to be
// shown to the client). PII files from other features are NOT exposed here — the
// proxy only serves Drive files whose name starts with "handover_".
export function handoverImageUrl(fileId: string): string {
  return "/api/handover/file?id=" + encodeURIComponent(fileId);
}
