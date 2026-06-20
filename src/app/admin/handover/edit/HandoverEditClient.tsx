"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import SaveOverlay from "@/components/SaveOverlay";
import Spinner from "@/components/Spinner";
import InactivityGuard from "@/components/InactivityGuard";
import SignaturePad from "@/components/SignaturePad";
import FlatpickrInput from "@/components/FlatpickrInput";
import { compressImage } from "@/lib/imageCompress";
import { MAX_FILE_BYTES, MAX_FILE_MB } from "@/lib/uploadLimits";
import {
  HandoverDoc,
  defaultHandover,
  normalizeHandover,
  handoverImageUrl,
  formatThaiDate,
  uid,
  Building,
  PunchItem,
  AssetItem,
  DocItem,
  AcceptItem,
  DetailImage,
  Deliverable,
  AppendixItem,
} from "@/lib/handoverTypes";

interface Props {
  session: { name: string; role: "admin" | "user" };
}

async function uploadOne(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/handover/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
  return data.fileId as string;
}

// ---- Single-image uploader: compress in the browser, upload one per request --
function ImageUpload({
  fileId,
  onChange,
  hint,
  tall,
}: {
  fileId: string;
  onChange: (id: string) => void;
  hint?: string;
  tall?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const { file: compressed, error } = await compressImage(file);
      if (error) {
        setErr(error);
        setBusy(false);
        return;
      }
      onChange(await uploadOne(compressed));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        onClick={() => !busy && inputRef.current?.click()}
        className={
          "relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-brand-red transition-colors bg-gray-50 flex items-center justify-center " +
          (tall ? "h-56" : "h-40")
        }
      >
        {fileId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={handoverImageUrl(fileId)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-2">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-gray-400">{hint || "คลิกเพื่ออัปโหลดรูป"}</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="h-7 w-7 border-gray-200 border-t-brand-red rounded-full" style={{ animation: "spin 0.7s linear infinite", borderWidth: "3px" }} />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div className="flex items-center justify-between mt-1.5">
        {err ? <span className="text-xs text-red-500">{err}</span> : <span />}
        {fileId && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-gray-400 hover:text-brand-red">
            ลบรูป
          </button>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {desc ? <p className="text-sm text-gray-500 mt-0.5 mb-4">{desc}</p> : <div className="mb-4" />}
      {children}
    </div>
  );
}

// Two (or more) mutually-exclusive buttons; click to pick one.
function ChoiceToggle({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: { value: string; label: string; activeClass?: string }[];
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={"inline-flex rounded-lg border-2 border-gray-200 overflow-hidden " + (className || "")}>
      {options.map((o, i) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={
              "flex-1 px-3 h-[42px] text-sm font-semibold transition-colors whitespace-nowrap " +
              (i > 0 ? "border-l-2 border-gray-200 " : "") +
              (active ? o.activeClass || "bg-brand-red text-white" : "bg-white text-gray-500 hover:bg-gray-50")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const iconBtn = "text-gray-400 hover:text-red-500 transition-colors";
const xIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);

export default function HandoverEditClient({ session }: Props) {
  const [doc, setDoc] = useState<HandoverDoc>(() => defaultHandover("", ""));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [appendixBusy, setAppendixBusy] = useState(false);
  const [appendixErr, setAppendixErr] = useState("");
  const appendixRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;
    setLoading(true);
    fetch("/api/handover")
      .then((r) => r.json())
      .then((list: HandoverDoc[]) => {
        const found = Array.isArray(list) ? list.find((d) => d.id === id) : null;
        if (found) {
          setDoc(normalizeHandover(found));
          setSavedOnce(true);
        } else {
          alert("ไม่พบเอกสาร");
          window.location.href = "/admin/handover";
        }
      })
      .catch(() => alert("โหลดเอกสารไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (doc.id && doc.shareToken) {
      setShareLink(window.location.origin + "/handover/" + doc.id + "?token=" + doc.shareToken);
    }
  }, [doc.id, doc.shareToken]);

  const set = <K extends keyof HandoverDoc>(key: K, val: HandoverDoc[K]) =>
    setDoc((p) => ({ ...p, [key]: val }));

  // ---- 2. Deliverables --------------------------------------------------------
  const addDeliverable = () =>
    setDoc((p) => ({ ...p, deliverables: [...p.deliverables, { id: uid("dl_"), name: "", detail: "", status: "done" }] }));
  const updateDeliverable = (id: string, patch: Partial<Deliverable>) =>
    setDoc((p) => ({ ...p, deliverables: p.deliverables.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  const removeDeliverable = (id: string) =>
    setDoc((p) => ({ ...p, deliverables: p.deliverables.filter((d) => d.id !== id) }));

  // ---- 3. Documents -----------------------------------------------------------
  const updateDocItem = (id: string, patch: Partial<DocItem>) =>
    setDoc((p) => ({ ...p, documents: p.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  const addDocItem = () =>
    setDoc((p) => ({ ...p, documents: [...p.documents, { id: uid("d_"), label: "", included: true }] }));
  const removeDocItem = (id: string) =>
    setDoc((p) => ({ ...p, documents: p.documents.filter((d) => d.id !== id) }));

  // ---- 4. Punch list ----------------------------------------------------------
  const addPunch = () =>
    setDoc((p) => ({ ...p, punchList: [...p.punchList, { id: uid("p_"), location: "", description: "", fixDate: "", status: "pending" }] }));
  const updatePunch = (id: string, patch: Partial<PunchItem>) =>
    setDoc((p) => ({ ...p, punchList: p.punchList.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removePunch = (id: string) =>
    setDoc((p) => ({ ...p, punchList: p.punchList.filter((x) => x.id !== id) }));

  // ---- 6. Assets --------------------------------------------------------------
  const addAsset = () =>
    setDoc((p) => ({ ...p, assets: [...p.assets, { id: uid("a_"), item: "", qty: "", note: "" }] }));
  const updateAsset = (id: string, patch: Partial<AssetItem>) =>
    setDoc((p) => ({ ...p, assets: p.assets.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removeAsset = (id: string) =>
    setDoc((p) => ({ ...p, assets: p.assets.filter((x) => x.id !== id) }));

  // ---- 8. Appendix (image + PDF) ---------------------------------------------
  const handleAppendix = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAppendixErr("");
    setAppendixBusy(true);
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let toUpload = file;
      if (!isPdf) {
        const { file: compressed, error } = await compressImage(file);
        if (error) {
          setAppendixErr(error);
          setAppendixBusy(false);
          return;
        }
        toUpload = compressed;
      } else if (file.size > MAX_FILE_BYTES) {
        setAppendixErr("ไฟล์ PDF ใหญ่เกิน " + MAX_FILE_MB + "MB");
        setAppendixBusy(false);
        return;
      }
      const fileId = await uploadOne(toUpload);
      setDoc((p) => ({ ...p, appendixItems: [...p.appendixItems, { id: uid("ap_"), fileId, caption: "", isPdf }] }));
    } catch (e2) {
      setAppendixErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setAppendixBusy(false);
    }
  };
  const updateAppendix = (id: string, patch: Partial<AppendixItem>) =>
    setDoc((p) => ({ ...p, appendixItems: p.appendixItems.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removeAppendix = (id: string) =>
    setDoc((p) => ({ ...p, appendixItems: p.appendixItems.filter((x) => x.id !== id) }));

  // ---- Extras: buildings / detail images / accept items -----------------------
  const addBuilding = () =>
    setDoc((p) => ({
      ...p,
      buildings: [...p.buildings, { id: uid("b_"), name: "", imageFileId: "", scopes: [{ label: "โครงสร้าง", done: true }], status: "completed", note: "" }],
    }));
  const updateBuilding = (id: string, patch: Partial<Building>) =>
    setDoc((p) => ({ ...p, buildings: p.buildings.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const removeBuilding = (id: string) =>
    setDoc((p) => ({ ...p, buildings: p.buildings.filter((b) => b.id !== id) }));
  const addBuildingScope = (id: string) =>
    setDoc((p) => ({ ...p, buildings: p.buildings.map((b) => (b.id === id ? { ...b, scopes: [...b.scopes, { label: "", done: true }] } : b)) }));
  const updateBuildingScope = (bid: string, i: number, patch: Partial<{ label: string; done: boolean }>) =>
    setDoc((p) => ({
      ...p,
      buildings: p.buildings.map((b) => (b.id === bid ? { ...b, scopes: b.scopes.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) } : b)),
    }));
  const removeBuildingScope = (bid: string, i: number) =>
    setDoc((p) => ({ ...p, buildings: p.buildings.map((b) => (b.id === bid ? { ...b, scopes: b.scopes.filter((_, idx) => idx !== i) } : b)) }));

  const addDetailImage = () =>
    setDoc((p) => ({ ...p, detailImages: [...p.detailImages, { id: uid("di_"), fileId: "", caption: "" }] }));
  const updateDetailImage = (id: string, patch: Partial<DetailImage>) =>
    setDoc((p) => ({ ...p, detailImages: p.detailImages.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  const removeDetailImage = (id: string) =>
    setDoc((p) => ({ ...p, detailImages: p.detailImages.filter((d) => d.id !== id) }));

  const addAccept = () =>
    setDoc((p) => ({ ...p, acceptItems: [...p.acceptItems, { id: uid("ac_"), label: "" }] }));
  const updateAccept = (id: string, patch: Partial<AcceptItem>) =>
    setDoc((p) => ({ ...p, acceptItems: p.acceptItems.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removeAccept = (id: string) =>
    setDoc((p) => ({ ...p, acceptItems: p.acceptItems.filter((x) => x.id !== id) }));

  // ---- Save -------------------------------------------------------------------
  const handleSave = async () => {
    if (!doc.projectName.trim()) {
      alert("กรุณากรอกชื่อโครงการก่อนบันทึก");
      return;
    }
    setSaving(true);
    try {
      const isNew = !savedOnce || !doc.id;
      const res = await fetch("/api/handover", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      if (isNew && data.id) {
        setDoc((p) => ({ ...p, id: data.id, shareToken: data.shareToken }));
        window.history.replaceState(null, "", "/admin/handover/edit?id=" + data.id);
      }
      setSavedOnce(true);
      alert("บันทึกเรียบร้อยแล้ว");
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + (err instanceof Error ? err.message : ""));
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("คัดลอกลิงก์นี้:", shareLink);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar session={session} />
        <div className="py-20"><Spinner /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Navbar session={session} />
      <InactivityGuard />
      {saving && <SaveOverlay message="กำลังบันทึก..." />}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="slide-up">
          <a href="/admin/handover" className="text-sm text-gray-500 hover:text-brand-red">← กลับรายการเอกสาร</a>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {savedOnce ? "แก้ไขเอกสารส่งมอบงาน" : "สร้างเอกสารส่งมอบงาน"}
          </h1>
          <p className="text-gray-500 mt-1">กรอกข้อมูล + อัปโหลดรูป แล้วส่งลิงก์ให้ลูกค้าตรวจรับ</p>
        </div>

        {savedOnce && shareLink && (
          <div className="card bg-brand-light border-brand-red/20">
            <p className="text-sm font-semibold text-brand-red mb-2">ลิงก์สำหรับลูกค้า</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input readOnly value={shareLink} className="input-field text-sm flex-1" onClick={(e) => e.currentTarget.select()} />
              <button onClick={copyLink} className="btn-secondary whitespace-nowrap text-sm">
                {copied ? "✓ คัดลอกแล้ว" : "คัดลอกลิงก์"}
              </button>
              <a href={shareLink} target="_blank" rel="noopener noreferrer" className="btn-primary whitespace-nowrap text-sm text-center">
                เปิดเอกสาร
              </a>
            </div>
            {doc.projectCode && (
              <p className="text-xs text-gray-500 mt-2">ลูกค้าเปิดเองได้ด้วย &quot;รหัสโครงการ&quot;: <span className="font-semibold text-gray-700">{doc.projectCode}</span></p>
            )}
          </div>
        )}

        {/* 1. Project info */}
        <SectionCard title="1. ข้อมูลโครงการ">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">ชื่อโครงการ <span className="text-red-500">*</span></label>
              <input value={doc.projectName} onChange={(e) => set("projectName", e.target.value)} className="input-field" placeholder="เช่น บ้านคุณสมชาย" />
            </div>
            <div>
              <label className="label">รหัสโครงการ</label>
              <input value={doc.projectCode} onChange={(e) => set("projectCode", e.target.value)} className="input-field" placeholder="ลูกค้าใช้รหัสนี้เปิดดูเอง" />
            </div>
            <div>
              <label className="label">สถานที่ก่อสร้าง</label>
              <input value={doc.location} onChange={(e) => set("location", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">เจ้าของโครงการ</label>
              <input value={doc.owner} onChange={(e) => set("owner", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">ผู้รับเหมา</label>
              <input value={doc.contractor} onChange={(e) => set("contractor", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">วันที่เริ่มต้น</label>
              <FlatpickrInput value={doc.startDate} onChange={(v) => set("startDate", v)} placeholder="เลือกวันที่" />
            </div>
            <div>
              <label className="label">วันที่แล้วเสร็จ</label>
              <FlatpickrInput value={doc.endDate} onChange={(v) => set("endDate", v)} placeholder="เลือกวันที่" />
            </div>
          </div>
        </SectionCard>

        {/* 2. Deliverables */}
        <SectionCard title="2. รายละเอียดงานที่ส่งมอบ" desc="ลำดับอัตโนมัติ · เลือกสถานะ เสร็จ/ค้าง · ลบหรือเพิ่มหัวข้อได้">
          <div className="hidden sm:flex items-center gap-2 px-1 mb-2 text-xs font-semibold text-gray-500">
            <span className="w-7 text-center shrink-0">ลำดับ</span>
            <span className="flex-1">รายการงาน</span>
            <span className="flex-1">รายละเอียด</span>
            <span className="w-[150px] text-center shrink-0">สถานะ</span>
            <span className="w-5 shrink-0" />
          </div>
          <div className="space-y-3 sm:space-y-2">
            {doc.deliverables.map((d, i) => (
              <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-gray-100 pb-3 sm:border-0 sm:pb-0">
                <div className="flex items-center gap-2 sm:contents">
                  <span className="w-7 text-center text-sm font-bold text-brand-red shrink-0">{i + 1}</span>
                  <input value={d.name} onChange={(e) => updateDeliverable(d.id, { name: e.target.value })} className="input-field flex-1" placeholder="รายการงาน" />
                </div>
                <input value={d.detail} onChange={(e) => updateDeliverable(d.id, { detail: e.target.value })} className="input-field flex-1" placeholder="รายละเอียด" />
                <div className="flex items-center gap-2">
                  <ChoiceToggle
                    className="w-[150px]"
                    value={d.status}
                    onChange={(v) => updateDeliverable(d.id, { status: v as "done" | "pending" })}
                    options={[
                      { value: "done", label: "เสร็จ", activeClass: "bg-green-600 text-white" },
                      { value: "pending", label: "ค้าง", activeClass: "bg-yellow-500 text-white" },
                    ]}
                  />
                  <button type="button" onClick={() => removeDeliverable(d.id)} className={"shrink-0 " + iconBtn}>{xIcon}</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addDeliverable} className="btn-secondary w-full mt-3">+ เพิ่มรายการงาน</button>
        </SectionCard>

        {/* 3. Documents handed over */}
        <SectionCard title="3. รายการเอกสารที่ส่งมอบ" desc="เลือก ส่งมอบ/ไม่ส่ง · เพิ่มรายการอื่นได้">
          <div className="hidden sm:flex items-center gap-2 px-1 mb-2 text-xs font-semibold text-gray-500">
            <span className="w-[170px] shrink-0 text-center">สถานะการส่งมอบ</span>
            <span className="flex-1">รายการเอกสาร</span>
            <span className="w-5 shrink-0" />
          </div>
          <div className="space-y-2">
            {doc.documents.map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <ChoiceToggle
                  className="w-[170px] shrink-0"
                  value={d.included ? "yes" : "no"}
                  onChange={(v) => updateDocItem(d.id, { included: v === "yes" })}
                  options={[
                    { value: "yes", label: "ส่งมอบ", activeClass: "bg-green-600 text-white" },
                    { value: "no", label: "ไม่ส่ง", activeClass: "bg-gray-400 text-white" },
                  ]}
                />
                <input value={d.label} onChange={(e) => updateDocItem(d.id, { label: e.target.value })} className="input-field flex-1" />
                <button type="button" onClick={() => removeDocItem(d.id)} className={iconBtn}>{xIcon}</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addDocItem} className="text-xs text-brand-red mt-2 hover:underline">+ เพิ่มรายการเอกสาร</button>
        </SectionCard>

        {/* 4. Punch list */}
        <SectionCard title="4. งานคงค้าง (Punch List)" desc="รายการที่ต้องแก้ไข">
          <div className="space-y-3">
            {doc.punchList.map((x, i) => (
              <div key={x.id} className="border border-gray-200 rounded-xl p-3 relative">
                <button type="button" onClick={() => removePunch(x.id)} className={"absolute top-3 right-3 " + iconBtn}>{xIcon}</button>
                <h4 className="text-xs font-semibold text-gray-500 mb-2">รายการที่ {i + 1}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">ตำแหน่ง</label>
                    <input value={x.location} onChange={(e) => updatePunch(x.id, { location: e.target.value })} className="input-field" placeholder="เช่น อาคารหลัก" />
                  </div>
                  <div>
                    <label className="label">กำหนดแก้ไข</label>
                    <FlatpickrInput value={x.fixDate} onChange={(v) => updatePunch(x.id, { fixDate: v })} placeholder="เลือกวันที่" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">รายละเอียดงานที่ต้องแก้</label>
                    <input value={x.description} onChange={(e) => updatePunch(x.id, { description: e.target.value })} className="input-field" placeholder="รายละเอียด" />
                  </div>
                  <div>
                    <label className="label">สถานะ</label>
                    <ChoiceToggle
                      value={x.status}
                      onChange={(v) => updatePunch(x.id, { status: v as "pending" | "fixed" })}
                      options={[
                        { value: "pending", label: "ค้าง", activeClass: "bg-yellow-500 text-white" },
                        { value: "fixed", label: "แก้แล้ว", activeClass: "bg-green-600 text-white" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addPunch} className="btn-secondary w-full mt-3">+ เพิ่มงานคงค้าง</button>
        </SectionCard>

        {/* 5. Acceptance result (client-filled) */}
        <SectionCard title="5. การตรวจรับงาน" desc="ส่วนนี้ลูกค้าจะกรอกผ่านลิงก์ตรวจรับ">
          {doc.clientSubmittedAt ? (
            <div className={"rounded-xl px-4 py-3 text-sm " + (doc.clientResult === "fail" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700")}>
              <p className="font-semibold">{doc.clientResult === "fail" ? "❌ ลูกค้าไม่ผ่าน" : "✅ ลูกค้าตรวจรับแล้ว"}{doc.clientName ? " · " + doc.clientName : ""}</p>
              {doc.clientResult === "fail" && doc.clientReason && <p className="mt-1">เหตุผล: {doc.clientReason}</p>}
              {doc.clientNote && <p className="mt-1">หมายเหตุ: {doc.clientNote}</p>}
              <p className="text-xs mt-1 opacity-75">ส่งเมื่อ {formatThaiDate(doc.clientSubmittedAt)}</p>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500">
              ☐ ผ่าน &nbsp;&nbsp; ☐ ไม่ผ่าน (ระบุเหตุผล) &nbsp;·&nbsp; ลูกค้าจะเลือกผลและกรอกหมายเหตุเองในหน้าตรวจรับ
            </div>
          )}
        </SectionCard>

        {/* 6. Assets / keys */}
        <SectionCard title="6. การส่งมอบทรัพย์สิน / กุญแจ / ระบบ">
          <div className="hidden sm:flex items-center gap-2 px-1 mb-2 text-xs font-semibold text-gray-500">
            <span className="flex-1">รายการ</span>
            <span className="w-24 shrink-0">จำนวน</span>
            <span className="flex-1">หมายเหตุ</span>
            <span className="w-5 shrink-0" />
          </div>
          <div className="space-y-2">
            {doc.assets.map((x) => (
              <div key={x.id} className="flex gap-2">
                <input value={x.item} onChange={(e) => updateAsset(x.id, { item: e.target.value })} className="input-field flex-1" placeholder="รายการ" />
                <input value={x.qty} onChange={(e) => updateAsset(x.id, { qty: e.target.value })} className="input-field w-24" placeholder="จำนวน" />
                <input value={x.note} onChange={(e) => updateAsset(x.id, { note: e.target.value })} className="input-field flex-1" placeholder="หมายเหตุ" />
                <button type="button" onClick={() => removeAsset(x.id)} className={iconBtn}>{xIcon}</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addAsset} className="text-xs text-brand-red mt-2 hover:underline">+ เพิ่มรายการ</button>
        </SectionCard>

        {/* 7. Signatures */}
        <SectionCard title="7. ลายเซ็นรับรอง" desc="ลายเซ็นผู้รับเหมา (กรอกที่นี่) · ลูกค้าจะเซ็นเองในหน้าตรวจรับ">
          <p className="text-sm font-bold text-gray-700 mb-2">ผู้ส่งมอบ (ผู้รับเหมา)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">ชื่อผู้ส่งมอบ</label>
              <input value={doc.contractorSignName} onChange={(e) => set("contractorSignName", e.target.value)} className="input-field" />
              <label className="label mt-3">วันที่</label>
              <FlatpickrInput value={doc.contractorSignDate} onChange={(v) => set("contractorSignDate", v)} placeholder="เลือกวันที่" />
            </div>
            <SignaturePad value={doc.contractorSignature} onChange={(v) => set("contractorSignature", v)} label="ลายเซ็น" />
          </div>
          <div className="mt-4 rounded-xl bg-gray-50 border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
            ผู้รับมอบ (เจ้าของงาน): {doc.clientSignature ? "ลูกค้าเซ็นแล้ว — " + (doc.clientName || "") : "ลูกค้าจะเซ็นชื่อในหน้าตรวจรับ"}
          </div>
        </SectionCard>

        {/* 8. Appendix */}
        <SectionCard title="8. ภาคผนวก" desc="รูปภาพหน้างาน · รายงานการทดสอบระบบ · เอกสารเพิ่มเติม (รองรับรูปและ PDF)">
          {doc.appendixItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {doc.appendixItems.map((a) => (
                <div key={a.id} className="border border-gray-200 rounded-xl p-3">
                  {a.isPdf ? (
                    <a href={handoverImageUrl(a.fileId)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 h-40 bg-gray-50 rounded-lg justify-center text-brand-red">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-sm font-medium">เปิดไฟล์ PDF</span>
                    </a>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={handoverImageUrl(a.fileId)} alt="" className="w-full h-40 object-cover rounded-lg" />
                  )}
                  <input value={a.caption} onChange={(e) => updateAppendix(a.id, { caption: e.target.value })} className="input-field mt-2 text-sm" placeholder="คำบรรยาย เช่น รูปหน้างาน / รายงานทดสอบ" />
                  <button type="button" onClick={() => removeAppendix(a.id)} className="text-xs text-gray-400 hover:text-red-500 mt-2">ลบไฟล์นี้</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" disabled={appendixBusy} onClick={() => appendixRef.current?.click()} className="btn-secondary w-full">
            {appendixBusy ? "กำลังอัปโหลด..." : "+ เพิ่มไฟล์ภาคผนวก (รูป / PDF)"}
          </button>
          <input ref={appendixRef} type="file" accept="image/*,application/pdf" onChange={handleAppendix} className="hidden" />
          {appendixErr && <p className="text-xs text-red-500 mt-2">{appendixErr}</p>}
        </SectionCard>

        {/* ---- Optional extras ---- */}
        <div className="pt-2">
          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ส่วนเพิ่มเติม (ใส่หรือไม่ก็ได้)</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
        </div>

        {/* Site overview + buildings */}
        <SectionCard title="ผังโครงการ (Site Overview) + อาคาร" desc="รูปผังรวม/ภาพมุมสูง และรายการอาคาร">
          <label className="label">รูปผังรวม / ภาพมุมสูง</label>
          <ImageUpload fileId={doc.siteImageFileId} onChange={(id) => set("siteImageFileId", id)} hint="อัปโหลดภาพผังโครงการ" tall />
          <div className="mt-6 space-y-4">
            <label className="label">อาคารในโครงการ</label>
            {doc.buildings.map((b, bi) => (
              <div key={b.id} className="border border-gray-200 rounded-xl p-4 relative">
                <button type="button" onClick={() => removeBuilding(b.id)} className={"absolute top-3 right-3 " + iconBtn}>{xIcon}</button>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">อาคารที่ {bi + 1}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">ชื่ออาคาร</label>
                    <input value={b.name} onChange={(e) => updateBuilding(b.id, { name: e.target.value })} className="input-field" placeholder="เช่น อาคารหลัก" />
                    <label className="label mt-3">สถานะ</label>
                    <ChoiceToggle
                      className="w-full"
                      value={b.status === "pending" ? "pending" : "completed"}
                      onChange={(v) => updateBuilding(b.id, { status: v })}
                      options={[
                        { value: "completed", label: "เสร็จแล้ว", activeClass: "bg-green-600 text-white" },
                        { value: "pending", label: "กำลังดำเนินการ", activeClass: "bg-yellow-500 text-white" },
                      ]}
                    />
                    <label className="label mt-3">หมายเหตุ (เช่น จำนวนห้อง)</label>
                    <input value={b.note} onChange={(e) => updateBuilding(b.id, { note: e.target.value })} className="input-field" placeholder="เช่น 4 ห้องนอน 3 ห้องน้ำ" />
                  </div>
                  <div>
                    <label className="label">รูปอาคาร</label>
                    <ImageUpload fileId={b.imageFileId} onChange={(id) => updateBuilding(b.id, { imageFileId: id })} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="label">รายการงานในอาคาร</label>
                  <div className="space-y-2">
                    {b.scopes.map((s, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <input value={s.label} onChange={(e) => updateBuildingScope(b.id, si, { label: e.target.value })} className="input-field flex-1" placeholder="เช่น งานระบบ" />
                        <button type="button" onClick={() => removeBuildingScope(b.id, si)} className={iconBtn}>{xIcon}</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addBuildingScope(b.id)} className="text-xs text-brand-red mt-2 hover:underline">+ เพิ่มรายการงาน</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addBuilding} className="btn-secondary w-full">+ เพิ่มอาคาร</button>
          </div>
        </SectionCard>

        {/* Detail & finish */}
        <SectionCard title="รายละเอียดและงานเก็บ (Detail & Finish)" desc="รูปประกอบในแต่ละจุด พร้อมคำบรรยาย">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doc.detailImages.map((d) => (
              <div key={d.id} className="border border-gray-200 rounded-xl p-3">
                <ImageUpload fileId={d.fileId} onChange={(id) => updateDetailImage(d.id, { fileId: id })} />
                <input value={d.caption} onChange={(e) => updateDetailImage(d.id, { caption: e.target.value })} className="input-field mt-2 text-sm" placeholder="คำบรรยายรูป" />
                <button type="button" onClick={() => removeDetailImage(d.id)} className="text-xs text-gray-400 hover:text-red-500 mt-2">ลบรูปนี้</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addDetailImage} className="btn-secondary w-full mt-4">+ เพิ่มรูป</button>
        </SectionCard>

        {/* Warranty */}
        <SectionCard title="การรับประกัน (Warranty)">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">ระยะเวลา (เดือน)</label>
              <input value={doc.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} className="input-field" placeholder="12" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">หมายเหตุการรับประกัน</label>
              <input value={doc.warrantyNote} onChange={(e) => set("warrantyNote", e.target.value)} className="input-field" />
            </div>
          </div>
        </SectionCard>

        {/* Acceptance checklist (per-item ticking) */}
        <SectionCard title="รายการให้ลูกค้าติ๊กตรวจรับ (รายข้อ)" desc="ถ้าใส่ไว้ ลูกค้าจะติ๊กแต่ละข้อในหน้าตรวจรับเพิ่มเติมได้">
          <div className="space-y-2">
            {doc.acceptItems.map((x, i) => (
              <div key={x.id} className="flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-light text-brand-red rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <input value={x.label} onChange={(e) => updateAccept(x.id, { label: e.target.value })} className="input-field flex-1" />
                <button type="button" onClick={() => removeAccept(x.id)} className={iconBtn}>{xIcon}</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addAccept} className="text-xs text-brand-red mt-2 hover:underline">+ เพิ่มรายการตรวจรับ</button>
        </SectionCard>
      </main>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <a href="/admin/handover" className="btn-ghost text-sm">ยกเลิก</a>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "กำลังบันทึก..." : savedOnce ? "บันทึกการแก้ไข" : "บันทึกเอกสาร"}
          </button>
        </div>
      </div>
    </div>
  );
}
