"use client";

import { useRef, useState } from "react";
import SignaturePad from "@/components/SignaturePad";
import { compressImage } from "@/lib/imageCompress";
import { HandoverDoc, InspectionItem, handoverImageUrl, formatThaiDate, uid } from "@/lib/handoverTypes";

interface Props {
  doc: HandoverDoc;
  token: string;
}

function MWLogo({ size = "md" }: { size?: "md" | "lg" }) {
  const cls = size === "lg" ? "w-24 h-24 text-2xl" : "w-9 h-9 text-sm";
  return (
    <div className={"bg-brand-red rounded-xl flex items-center justify-center shrink-0 " + cls}>
      <span className="text-white font-extrabold tracking-tight">MW</span>
    </div>
  );
}

// Small "you need to fill this" pill — guidance only, never printed.
function ActionTag() {
  return (
    <span className="no-print inline-flex items-center gap-1 bg-brand-red text-white text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
      ✍️ ส่วนที่ต้องกรอก
    </span>
  );
}

function PageHead({ no, title }: { no?: number; title: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <MWLogo />
        <span className="text-xs tracking-widest text-gray-400 font-semibold">MATCHING WEALTH CO., LTD.</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
        {no ? <span className="text-brand-red">{no}. </span> : null}
        {title}
      </h2>
      <div className="w-16 h-1 bg-brand-red mt-2 rounded-full" />
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="hv-page hv-avoid-break relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 mb-6 overflow-hidden">
      {children}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-brand-red" />
    </div>
  );
}

function Check({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex w-5 h-5 rounded-full bg-green-500 items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
    </span>
  ) : (
    <span className="inline-flex w-5 h-5 rounded-full bg-gray-200 items-center justify-center">
      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01" /></svg>
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-100">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value || "—"}</span>
    </div>
  );
}

// Client-side inspection photo uploader: compress in the browser, then POST one
// image to the token-gated public upload endpoint. Offers both "ถ่ายรูป" (opens
// the camera) and "แนบรูป" (gallery / file picker).
function InspectionPhoto({
  docId,
  token,
  fileId,
  onChange,
}: {
  docId: string;
  token: string;
  fileId: string;
  onChange: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
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
      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("id", docId);
      fd.append("token", token);
      const res = await fetch("/api/handover/client-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      onChange(data.fileId as string);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 h-40 flex items-center justify-center">
        {fileId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={handoverImageUrl(fileId)} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-gray-400 px-2 text-center">ยังไม่มีรูป — กดถ่ายรูปหรือแนบรูป</span>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="h-7 w-7 border-gray-200 border-t-brand-red rounded-full" style={{ animation: "spin 0.7s linear infinite", borderWidth: "3px" }} />
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()} className="btn-secondary text-sm flex items-center justify-center gap-1.5 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          ถ่ายรูป
        </button>
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="btn-secondary text-sm flex items-center justify-center gap-1.5 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          แนบรูป
        </button>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        {err ? <span className="text-xs text-red-500">{err}</span> : <span />}
        {fileId && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-gray-400 hover:text-brand-red">ลบรูป</button>
        )}
      </div>
    </div>
  );
}

export default function HandoverDocumentClient({ doc, token }: Props) {
  const alreadyDone = !!doc.clientSubmittedAt;
  const [editing, setEditing] = useState(!alreadyDone);
  const [submitted, setSubmitted] = useState(alreadyDone);
  const [sending, setSending] = useState(false);

  const [clientName, setClientName] = useState(doc.clientName || "");
  const [clientResult, setClientResult] = useState<"" | "pass" | "fail">(doc.clientResult || "");
  const [clientReason, setClientReason] = useState(doc.clientReason || "");
  const [clientNote, setClientNote] = useState(doc.clientNote || "");
  const [clientSignature, setClientSignature] = useState(doc.clientSignature || "");
  const [checked, setChecked] = useState<Record<string, boolean>>(doc.clientChecked || {});
  const [inspection, setInspection] = useState<InspectionItem[]>(doc.inspectionItems || []);

  const addInspection = () =>
    setInspection((p) => [...p, { id: uid("in_"), name: "", fileId: "", result: "", note: "" }]);
  const updateInspection = (id: string, patch: Partial<InspectionItem>) =>
    setInspection((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeInspection = (id: string) =>
    setInspection((p) => p.filter((x) => x.id !== id));

  const toggle = (id: string) => editing && setChecked((p) => ({ ...p, [id]: !p[id] }));
  const handlePrint = () => window.print();

  const handleSubmit = async () => {
    if (!clientName.trim()) return alert("กรุณากรอกชื่อผู้ตรวจรับ");
    if (!clientResult) return alert("กรุณาเลือกผลการตรวจรับ (ผ่าน / ไม่ผ่าน)");
    if (!clientSignature) return alert("กรุณาเซ็นชื่อ");
    setSending(true);
    try {
      const res = await fetch("/api/handover/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doc.id,
          token,
          clientName,
          clientResult,
          clientReason,
          clientNote,
          clientSignature,
          clientChecked: checked,
          inspectionItems: inspection,
          clientSignDate: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ส่งไม่สำเร็จ");
      setSubmitted(true);
      setEditing(false);
    } catch (err) {
      alert("ส่งผลตรวจรับไม่สำเร็จ: " + (err instanceof Error ? err.message : ""));
    } finally {
      setSending(false);
    }
  };

  const warrantyMonths = doc.warrantyMonths || "12";
  const includedDocs = doc.documents.filter((d) => d.included);
  const filledAssets = doc.assets.filter((a) => a.item.trim());
  const hasSite = !!doc.siteImageFileId || doc.buildings.length > 0;
  const hasBuildingDetails = doc.buildings.some((b) => b.imageFileId || b.scopes.length);
  const hasDetailImgs = doc.detailImages.some((d) => d.fileId);
  const hasAppendix = doc.appendixItems.length > 0;
  const hasAccept = doc.acceptItems.length > 0;

  const statusBadge = (ok: boolean, okText = "เสร็จแล้ว", noText = "ค้าง") => (
    <span className={"text-xs px-2.5 py-1 rounded-full font-medium " + (ok ? "bg-green-50 text-green-700" : "bg-yellow-100 text-yellow-700")}>
      {ok ? okText : noText}
    </span>
  );

  return (
    <div className="hv-shell min-h-screen bg-gray-100 pb-16">
      {/* Toolbar (hidden on print) */}
      <div className="no-print sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MWLogo />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{doc.projectName || "เอกสารส่งมอบงาน"}</p>
              <p className="text-xs text-gray-400">เอกสารส่งมอบงาน</p>
            </div>
          </div>
          <button onClick={handlePrint} className="btn-primary text-sm whitespace-nowrap flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            พิมพ์ / บันทึก PDF
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-6">
        {/* Customer instructions — shown only while filling, never printed */}
        {editing && !submitted && (
          <div className="no-print mb-6 rounded-2xl border-2 border-brand-red/30 bg-brand-light p-5 slide-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">👋</span>
              <h2 className="font-bold text-gray-900">สำหรับลูกค้า — วิธีตรวจรับงาน</h2>
            </div>
            <ol className="text-sm text-gray-700 space-y-1.5">
              <li><span className="font-bold text-brand-red">1.</span> อ่านรายละเอียดงานและรูปภาพในเอกสาร</li>
              <li><span className="font-bold text-brand-red">2.</span> ที่หัวข้อ <b>“5. การตรวจรับงาน”</b> แตะติ๊กรายการที่ตรวจแล้ว แล้วเลือก <b>ผ่าน / ไม่ผ่าน</b></li>
              <li><span className="font-bold text-brand-red">3.</span> ที่หัวข้อ <b>“7. ลายเซ็นรับรอง”</b> กรอกชื่อและเซ็นชื่อในช่อง <b>ผู้รับมอบ</b></li>
              <li><span className="font-bold text-brand-red">4.</span> กดปุ่ม <b>“ยืนยันผลการตรวจรับ”</b> ด้านล่างสุด</li>
              <li><span className="font-bold text-brand-red">5.</span> (ถ้าต้องการ) กด <b>“พิมพ์ / บันทึก PDF”</b> ด้านบนเพื่อเก็บไฟล์</li>
            </ol>
            <p className="text-xs text-gray-400 mt-3">* คำแนะนำนี้จะไม่แสดงในไฟล์ PDF · ช่องที่ต้องกรอกจะมีป้าย <span className="text-brand-red font-semibold">✍️ ส่วนที่ต้องกรอก</span> กำกับไว้</p>
          </div>
        )}

        {/* Cover */}
        <Page>
          <div className="flex flex-col items-center text-center py-10 sm:py-16">
            <MWLogo size="lg" />
            <p className="mt-4 text-sm tracking-widest text-gray-400 font-semibold">MATCHING WEALTH</p>
            <h1 className="mt-10 text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">PROJECT HANDOVER<br />DOCUMENT</h1>
            <div className="w-20 h-1 bg-brand-red my-6 rounded-full" />
            <p className="text-xl font-bold text-brand-red">{doc.projectName || "[ชื่อโครงการ]"}</p>
            {doc.location && <p className="text-gray-500 mt-1">{doc.location}</p>}
            <p className="mt-12 text-xs tracking-widest text-gray-400 font-semibold">MATCHING WEALTH CO., LTD.</p>
          </div>
        </Page>

        {/* 1. Project information */}
        <Page>
          <PageHead no={1} title="ข้อมูลโครงการ" />
          <InfoLine label="ชื่อโครงการ" value={doc.projectName} />
          <InfoLine label="รหัสโครงการ" value={doc.projectCode} />
          <InfoLine label="สถานที่" value={doc.location} />
          <InfoLine label="เจ้าของโครงการ" value={doc.owner} />
          <InfoLine label="ผู้รับเหมา" value={doc.contractor} />
          <InfoLine label="วันที่เริ่มต้น" value={doc.startDate} />
          <InfoLine label="วันที่แล้วเสร็จ" value={doc.endDate} />
        </Page>

        {/* 2. Deliverables */}
        <Page>
          <PageHead no={2} title="รายละเอียดงานที่ส่งมอบ" />
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-white text-left">
                  <th className="px-3 py-2 w-10">#</th>
                  <th className="px-3 py-2">รายการงาน</th>
                  <th className="px-3 py-2">รายละเอียด</th>
                  <th className="px-3 py-2 w-24">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {doc.deliverables.map((d, i) => (
                  <tr key={d.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-900 font-medium">{d.name || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{d.detail || "—"}</td>
                    <td className="px-3 py-2">{statusBadge(d.status === "done", "เสร็จ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Page>

        {/* 3. Documents handed over */}
        <Page>
          <PageHead no={3} title="รายการเอกสารที่ส่งมอบ" />
          {includedDocs.length === 0 ? (
            <p className="text-sm text-gray-400">—</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {includedDocs.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                  <Check on={true} />
                  {d.label}
                </div>
              ))}
            </div>
          )}
        </Page>

        {/* 4. Punch list */}
        <Page>
          <PageHead no={4} title="งานคงค้าง (Punch List)" />
          {doc.punchList.length === 0 ? (
            <div className="bg-green-50 text-green-700 rounded-xl px-4 py-6 text-center font-medium">ไม่มีงานคงค้าง — งานเสร็จสมบูรณ์</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white text-left">
                    <th className="px-3 py-2 w-10">#</th>
                    <th className="px-3 py-2">ตำแหน่ง</th>
                    <th className="px-3 py-2">รายละเอียด</th>
                    <th className="px-3 py-2 w-28">กำหนดแก้ไข</th>
                    <th className="px-3 py-2 w-20">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.punchList.map((p, i) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-500">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-3 py-2 text-gray-900">{p.location || "—"}</td>
                      <td className="px-3 py-2 text-gray-700">{p.description || "—"}</td>
                      <td className="px-3 py-2 text-gray-700">{p.fixDate || "—"}</td>
                      <td className="px-3 py-2">{statusBadge(p.status === "fixed", "แก้แล้ว", "Pending")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Page>

        {/* 5. Acceptance result (client) */}
        <Page>
          <div className="flex flex-wrap items-center gap-3">
            <PageHead no={5} title="การตรวจรับงาน" />
            {editing && <ActionTag />}
          </div>
          {editing && (
            <p className="no-print -mt-3 mb-5 text-sm text-gray-500">โปรดติ๊กรายการที่ตรวจแล้ว และเลือกผลการตรวจรับด้านล่าง</p>
          )}

          {hasAccept && (
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-700 mb-1">รายการตรวจรับ</p>
              {editing && <p className="no-print text-xs text-gray-500 mb-2">แตะที่แต่ละข้อเพื่อติ๊กว่าตรวจแล้ว</p>}
              <div className="space-y-2">
                {doc.acceptItems.map((item, i) => {
                  const on = !!checked[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!editing}
                      onClick={() => toggle(item.id)}
                      className={"w-full flex items-center gap-3 text-left rounded-xl px-4 py-3 border transition-colors " + (on ? "border-green-300 bg-green-50" : "border-gray-200 bg-white") + (editing ? " hover:border-brand-red cursor-pointer" : " cursor-default")}
                    >
                      <span className="w-6 h-6 bg-brand-light text-brand-red rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm text-gray-800">{item.label}</span>
                      <Check on={on} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-topic inspection: client adds topics, each with pass/fail + photo + detail */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-sm font-bold text-gray-700">ตรวจรับรายหัวข้อ (พร้อมรูป)</p>
              {editing && <ActionTag />}
            </div>
            {editing && (
              <p className="no-print text-xs text-gray-500 mb-3">เพิ่มหัวข้อที่ต้องการตรวจ · เลือกผ่าน/ไม่ผ่าน · ถ่ายรูปหรือแนบรูป · ใส่รายละเอียด · ลบหัวข้อที่ไม่มีได้</p>
            )}

            {editing ? (
              <>
                <div className="space-y-4">
                  {inspection.map((x, i) => (
                    <div key={x.id} className="border border-gray-200 rounded-xl p-4 relative bg-white">
                      <button type="button" onClick={() => removeInspection(x.id)} className="no-print absolute top-3 right-3 text-gray-400 hover:text-red-500" aria-label="ลบหัวข้อ">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <p className="text-xs font-semibold text-gray-400 mb-3">หัวข้อที่ {i + 1}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">รูปประกอบ</label>
                          <InspectionPhoto docId={doc.id} token={token} fileId={x.fileId} onChange={(id) => updateInspection(x.id, { fileId: id })} />
                        </div>
                        <div>
                          <label className="label">ชื่อหัวข้อ / ส่วนที่ตรวจ</label>
                          <input value={x.name} onChange={(e) => updateInspection(x.id, { name: e.target.value })} className="input-field" placeholder="เช่น ห้องน้ำชั้น 2 / สีผนัง" />
                          <label className="label mt-3">ผลการตรวจ</label>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => updateInspection(x.id, { result: "pass" })} className={"flex-1 rounded-lg py-2 text-sm font-semibold border-2 transition-colors " + (x.result === "pass" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500")}>✔ ผ่าน</button>
                            <button type="button" onClick={() => updateInspection(x.id, { result: "fail" })} className={"flex-1 rounded-lg py-2 text-sm font-semibold border-2 transition-colors " + (x.result === "fail" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-500")}>✘ ไม่ผ่าน</button>
                          </div>
                          <label className="label mt-3">รายละเอียด / หมายเหตุ</label>
                          <input value={x.note} onChange={(e) => updateInspection(x.id, { note: e.target.value })} className="input-field" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addInspection} className="no-print btn-secondary w-full mt-3">+ เพิ่มหัวข้อตรวจรับ</button>
              </>
            ) : inspection.length === 0 ? (
              <p className="text-sm text-gray-400">—</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inspection.map((x, i) => (
                  <div key={x.id} className="hv-avoid-break rounded-xl overflow-hidden border border-gray-100">
                    {x.fileId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={handoverImageUrl(x.fileId)} alt={x.name} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gray-50 flex items-center justify-center text-gray-300 text-sm">ไม่มีรูป</div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-gray-900">{i + 1}. {x.name || "—"}</span>
                        {x.result === "pass" ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-700">✔ ผ่าน</span>
                        ) : x.result === "fail" ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-700">✘ ไม่ผ่าน</span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">รอตรวจ</span>
                        )}
                      </div>
                      {x.note && <p className="text-xs text-gray-600 mt-1.5">รายละเอียด: {x.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm font-bold text-gray-700 mb-2">ผลการตรวจรับ {editing && <span className="text-red-500">*</span>}</p>
          <div className="flex gap-3 mb-4">
            <button type="button" disabled={!editing} onClick={() => setClientResult("pass")} className={"flex-1 rounded-xl py-3 font-semibold border-2 transition-colors " + (clientResult === "pass" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500")}>✔ ผ่าน</button>
            <button type="button" disabled={!editing} onClick={() => setClientResult("fail")} className={"flex-1 rounded-xl py-3 font-semibold border-2 transition-colors " + (clientResult === "fail" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-500")}>✘ ไม่ผ่าน</button>
          </div>
          {clientResult === "fail" && (
            <div className="mb-4">
              <label className="label">เหตุผลที่ไม่ผ่าน</label>
              <textarea value={clientReason} onChange={(e) => setClientReason(e.target.value)} disabled={!editing} className="input-field" rows={2} placeholder="ระบุเหตุผล" />
            </div>
          )}
          <div>
            <label className="label">หมายเหตุเพิ่มเติม</label>
            <textarea value={clientNote} onChange={(e) => setClientNote(e.target.value)} disabled={!editing} className="input-field" rows={2} placeholder="หมายเหตุ (ถ้ามี)" />
          </div>
        </Page>

        {/* 6. Assets / keys */}
        <Page>
          <PageHead no={6} title="การส่งมอบทรัพย์สิน / กุญแจ / ระบบ" />
          {filledAssets.length === 0 ? (
            <p className="text-sm text-gray-400">—</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-left">
                    <th className="px-3 py-2">รายการ</th>
                    <th className="px-3 py-2 w-24">จำนวน</th>
                    <th className="px-3 py-2">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {filledAssets.map((a) => (
                    <tr key={a.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-900">{a.item}</td>
                      <td className="px-3 py-2 text-gray-700">{a.qty || "—"}</td>
                      <td className="px-3 py-2 text-gray-700">{a.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Page>

        {/* 7. Signatures */}
        <Page>
          <PageHead no={7} title="ลายเซ็นรับรอง" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 hv-avoid-break">
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">ผู้ส่งมอบ (ผู้รับเหมา)</p>
              <div className="border border-gray-200 rounded-xl p-4 h-full">
                {doc.contractorSignature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc.contractorSignature} alt="ลายเซ็นผู้ส่งมอบ" className="h-20 object-contain" />
                ) : (
                  <div className="h-20 flex items-center justify-center text-gray-300 text-sm border-b border-dashed border-gray-200">ลายเซ็น</div>
                )}
                <p className="text-sm text-gray-900 font-medium mt-2">{doc.contractorSignName || doc.contractor || "—"}</p>
                <p className="text-xs text-gray-400">วันที่: {formatThaiDate(doc.contractorSignDate) || "—"}</p>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-sm font-bold text-gray-700">ผู้รับมอบ (เจ้าของงาน)</p>
                {editing && <ActionTag />}
              </div>
              {editing ? (
                <>
                  <label className="label">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="input-field mb-3" placeholder="กรอกชื่อ-นามสกุลผู้ตรวจรับ" />
                  <label className="label">เซ็นชื่อ <span className="text-red-500">*</span></label>
                  <SignaturePad value={clientSignature} onChange={setClientSignature} />
                </>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4">
                  {clientSignature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clientSignature} alt="ลายเซ็นผู้รับมอบ" className="h-20 object-contain" />
                  ) : (
                    <div className="h-20 flex items-center justify-center text-gray-300 text-sm">—</div>
                  )}
                  <p className="text-sm text-gray-900 font-medium mt-2">{clientName || "—"}</p>
                  <p className="text-xs text-gray-400">วันที่: {formatThaiDate(doc.clientSignDate) || "—"}</p>
                </div>
              )}
            </div>
          </div>
        </Page>

        {/* 8. Appendix */}
        {hasAppendix && (
          <Page>
            <PageHead no={8} title="ภาคผนวก" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doc.appendixItems.map((a) => (
                <div key={a.id} className="hv-avoid-break rounded-xl overflow-hidden border border-gray-100">
                  {a.isPdf ? (
                    <a href={handoverImageUrl(a.fileId)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-44 bg-gray-50 text-brand-red">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-sm font-medium mt-1">เปิดไฟล์ PDF</span>
                    </a>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={handoverImageUrl(a.fileId)} alt={a.caption} className="w-full h-44 object-cover" />
                  )}
                  {a.caption && <p className="text-xs text-gray-600 px-3 py-2 bg-gray-50">{a.caption}</p>}
                </div>
              ))}
            </div>
          </Page>
        )}

        {/* ---- Optional extra pages ---- */}
        {hasSite && (
          <Page>
            <PageHead title="ผังโครงการ (Site Overview)" />
            {doc.siteImageFileId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={handoverImageUrl(doc.siteImageFileId)} alt="ผังโครงการ" className="w-full rounded-xl border border-gray-100 mb-5 object-cover" />
            )}
            <div className="divide-y divide-gray-100">
              {doc.buildings.map((b, i) => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-brand-light rounded-full flex items-center justify-center text-xs font-bold text-brand-red">{i + 1}</span>
                    <div>
                      <span className="text-gray-900 font-medium">{b.name || "อาคาร"}</span>
                      {b.note && <span className="text-gray-400 text-sm"> · {b.note}</span>}
                    </div>
                  </div>
                  {statusBadge(b.status === "completed", "เสร็จแล้ว", "กำลังดำเนินการ")}
                </div>
              ))}
            </div>
          </Page>
        )}

        {hasBuildingDetails && (
          <Page>
            <PageHead title="รายละเอียดอาคาร" />
            <div className="space-y-6">
              {doc.buildings.map((b) => (
                <div key={b.id} className="hv-avoid-break border border-gray-100 rounded-xl overflow-hidden">
                  {b.imageFileId && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={handoverImageUrl(b.imageFileId)} alt={b.name} className="w-full h-56 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">{b.name || "อาคาร"}</h3>
                      {statusBadge(b.status === "completed", "Completed", "In progress")}
                    </div>
                    {b.note && <p className="text-sm text-gray-500 mt-1">{b.note}</p>}
                    <div className="mt-3 space-y-2">
                      {b.scopes.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check on={s.done} />
                          <span className="text-sm text-gray-700">{s.label || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Page>
        )}

        {hasDetailImgs && (
          <Page>
            <PageHead title="รายละเอียดและงานเก็บ" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doc.detailImages.filter((d) => d.fileId).map((d) => (
                <div key={d.id} className="hv-avoid-break rounded-xl overflow-hidden border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={handoverImageUrl(d.fileId)} alt={d.caption} className="w-full h-44 object-cover" />
                  {d.caption && <p className="text-xs text-gray-600 px-3 py-2 bg-gray-50">{d.caption}</p>}
                </div>
              ))}
            </div>
          </Page>
        )}

        {/* Warranty */}
        <Page>
          <PageHead title="การรับประกัน (Warranty)" />
          <div className="text-center bg-brand-light rounded-2xl py-8">
            <div className="w-14 h-14 bg-brand-red rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.6 1.6A9 9 0 1112 3a9 9 0 018.6 6.6z" /></svg>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">WARRANTY</p>
            <p className="mt-2 text-lg text-brand-red font-bold">ระยะเวลารับประกัน: {warrantyMonths} เดือน</p>
            {doc.warrantyNote && <p className="text-sm text-gray-500 mt-1">{doc.warrantyNote}</p>}
          </div>
        </Page>

        {/* Submit / status (hidden on print) */}
        <div className="no-print mb-10">
          {submitted && !editing ? (
            <div className={"rounded-2xl px-4 py-5 text-center " + (clientResult === "fail" ? "bg-red-50" : "bg-green-50")}>
              <p className={"font-bold text-lg " + (clientResult === "fail" ? "text-red-700" : "text-green-700")}>
                {clientResult === "fail" ? "บันทึกผล: ไม่ผ่าน" : "✅ ตรวจรับงานเรียบร้อยแล้ว ขอบคุณครับ"}
              </p>
              {doc.clientSubmittedAt && <p className="text-xs text-gray-500 mt-1">ส่งเมื่อ {formatThaiDate(doc.clientSubmittedAt)}</p>}
              <button onClick={() => { setEditing(true); setSubmitted(false); }} className="btn-ghost text-sm mt-3">แก้ไขผลการตรวจรับ</button>
            </div>
          ) : (
            <div>
              <p className="text-center text-sm text-gray-500 mb-2">
                ก่อนกดยืนยัน โปรดเช็ก: เลือก <b>ผ่าน/ไม่ผ่าน</b> · กรอก <b>ชื่อ</b> · <b>เซ็นชื่อ</b> ครบแล้ว
              </p>
              <button onClick={handleSubmit} disabled={sending} className="btn-primary w-full py-3 text-base">
                {sending ? "กำลังส่ง..." : "ยืนยันผลการตรวจรับ"}
              </button>
            </div>
          )}
          <p className="text-center text-xs text-gray-400 mt-3">กดปุ่ม &quot;พิมพ์ / บันทึก PDF&quot; ด้านบนเพื่อบันทึกเอกสารเป็นไฟล์ PDF</p>
          <div className="text-center text-xs text-gray-400 mt-6">MATCHING WEALTH CO., LTD.</div>
        </div>
      </div>
    </div>
  );
}
