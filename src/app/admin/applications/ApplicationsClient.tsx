"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import InactivityGuard from "@/components/InactivityGuard";
import { calcAge } from "@/lib/calcAge";

interface Application {
  id: string;
  createdAt: string;
  submittedAt?: string;
  prefixTh?: string;
  firstNameTh?: string;
  lastNameTh?: string;
  prefixEn?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  nickname?: string;
  nationality?: string;
  idCardNumber?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  militaryStatus?: string;
  phone?: string;
  email?: string;
  lineId?: string;
  addressLine?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  languages?: string;
  languageLevels?: string;
  educations?: string;
  workHistories?: string;
  hasWorkExperience?: string;
  skills?: string;
  computerSkills?: string;
  drivingLicense?: string;
  vehicleTypes?: string;
  workAttitude?: string;
  strengthWeakness?: string;
  expectedSalary?: string;
  availableStartDate?: string;
  howDidYouKnow?: string;
  emergencyContacts?: string;
  files?: Record<string, string>;
  [key: string]: unknown;
}

interface Props {
  session: { name: string; role: "admin" | "user" };
}

function parseJson(val: unknown): unknown {
  if (typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
}

// Escape applicant-supplied values before injecting into the print window's
// HTML string to prevent stored XSS.
function esc(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("th-TH", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
}

function driveImageUrl(fileId: string) {
  return "/api/files?id=" + fileId;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "false" || value === "undefined") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2.5 border-b border-gray-50">
      <span className="text-sm text-gray-500 sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 first:mt-0">
      <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
        <span className="text-white text-sm">{icon}</span>
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
  );
}

function DetailModal({ app, onClose, onDelete }: {
  app: Application;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const languages = parseJson(app.languages) as string[] | null;
  const languageLevels = parseJson(app.languageLevels) as Record<string, string> | null;
  const educations = parseJson(app.educations) as Array<{
    level: string; institution: string; field: string; graduationYear: string;
  }> | null;
  const workHistories = parseJson(app.workHistories) as Array<{
    company: string; position: string; startDate: string; endDate: string; description: string;
  }> | null;
  const emergencyContacts = parseJson(app.emergencyContacts) as Array<{
    name: string; relationship: string; phone: string;
  }> | null;
  const hasWork = app.hasWorkExperience === "true";
  const hasDriving = app.drivingLicense === "true";
  const photoFileId = app.files?.photo;
  const resumeFileId = app.files?.resume;
  const idCardFileId = app.files?.idCard;

  const startEdit = () => {
    sessionStorage.setItem("editApp", JSON.stringify(app));
    window.location.href = "/admin/applications/edit";
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, fileIds: app.files }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onDelete(app.id);
    } catch (err) {
      alert("ลบไม่สำเร็จ: " + (err instanceof Error ? err.message : ""));
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    const socials = [
      app.phone && ("โทร: " + esc(app.phone)),
      app.email && ("อีเมล: " + esc(app.email)),
      app.lineId && ("Line: " + esc(app.lineId)),
      (app.facebook as string) && ("Facebook: " + esc(app.facebook)),
      (app.instagram as string) && ("IG: " + esc(app.instagram)),
      (app.tiktok as string) && ("TikTok: " + esc(app.tiktok)),
    ].filter(Boolean).join(" | ");

    const eduHtml = educations && educations.length > 0
      ? educations.map((e) => "<div style='margin-bottom:6px'><strong>" + esc(e.institution||"-") + "</strong><br/><span style='color:#666'>" + esc(e.level) + (e.field ? " · " + esc(e.field) : "") + (e.graduationYear ? " · จบ พ.ศ. " + esc(e.graduationYear) : "") + "</span></div>").join("")
      : "<span style='color:#999'>ไม่มีข้อมูล</span>";

    const workHtml = hasWork && workHistories && workHistories.length > 0
      ? workHistories.map((w) => "<div style='margin-bottom:6px'><strong>" + esc(w.position||"-") + "</strong> — " + esc(w.company||"") + "<br/><span style='color:#666'>" + esc(w.startDate||"?") + " — " + esc(w.endDate||"ปัจจุบัน") + "</span>" + (w.description ? "<br/><span style='color:#555'>" + esc(w.description) + "</span>" : "") + "</div>").join("")
      : "<span style='color:#999'>ไม่มีประสบการณ์</span>";

    const ecHtml = emergencyContacts && emergencyContacts.length > 0
      ? emergencyContacts.map((c) => "<div>" + esc(c.name||"-") + (c.relationship ? " (" + esc(c.relationship) + ")" : "") + (c.phone ? " — <strong style='color:#E31E24'>" + esc(c.phone) + "</strong>" : "") + "</div>").join("")
      : "<span style='color:#999'>ไม่มีข้อมูล</span>";

    const langHtml = languages && languages.length > 0
      ? languages.map((l) => "<span style='background:#FEF2F2;color:#E31E24;padding:2px 10px;border-radius:6px;font-size:13px;margin-right:6px'>" + esc(l) + (languageLevels && languageLevels[l] ? " · " + esc(languageLevels[l]) : "") + "</span>").join("")
      : "-";

    const photoHtml = photoFileId
      ? "<img src='" + esc(driveImageUrl(photoFileId)) + "' style='width:100px;height:100px;border-radius:8px;object-fit:cover;border:3px solid #FEF2F2' />"
      : "";

    const html = "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>ใบสมัครงาน - " + esc(app.firstNameTh || "") + "</title><style>"
      + "@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); "
      + "* { margin:0; padding:0; box-sizing:border-box; } "
      + "html { background:#e5e7eb; } "
      + "body { font-family:'Sarabun','Segoe UI',sans-serif; color:#1f2937; font-size:14px; } "
      + ".page { width:210mm; min-height:297mm; margin:20px auto; background:white; box-shadow:0 4px 24px rgba(0,0,0,0.12); } "
      + ".header { background:#E31E24; color:white; padding:20px 32px; display:flex; justify-content:space-between; align-items:center; } "
      + ".header h1 { font-size:18px; font-weight:700; } "
      + ".header small { opacity:0.8; font-size:12px; } "
      + ".content { padding:28px 36px; } "
      + ".photo-row { text-align:center; margin-bottom:16px; } "
      + ".name { text-align:center; margin-bottom:24px; } "
      + ".name h2 { font-size:20px; font-weight:700; } "
      + ".name p { color:#6b7280; font-size:13px; } "
      + ".section { margin-top:20px; } "
      + ".section-title { font-size:15px; font-weight:700; color:#E31E24; border-bottom:2px solid #E31E24; padding-bottom:4px; margin-bottom:10px; } "
      + ".row { display:flex; padding:6px 0; border-bottom:1px solid #f3f4f6; } "
      + ".row-label { width:160px; color:#6b7280; font-size:13px; flex-shrink:0; } "
      + ".row-value { font-weight:500; } "
      + ".footer { text-align:center; margin-top:30px; padding-top:16px; border-top:2px solid #E31E24; color:#9ca3af; font-size:11px; padding-bottom:20px; } "
      + ".print-btn { position:fixed; bottom:24px; right:24px; background:#E31E24; color:white; border:none; padding:12px 28px; border-radius:12px; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(227,30,36,0.4); font-family:'Sarabun',sans-serif; } "
      + ".print-btn:hover { background:#B71820; } "
      + "@media print { html { background:white; } .page { margin:0; box-shadow:none; width:100%; } .print-btn { display:none; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .header { background:#E31E24 !important; } } "
      + "</style></head><body>"
      + "<div class='page'>"
      + "<div class='header'><div><h1>ใบสมัครงาน</h1><small>Matching Wealth Co., Ltd.</small></div><div style='text-align:right'><small>" + esc(formatDate(app.createdAt || app.submittedAt || "")) + "</small></div></div>"
      + "<div class='content'>"
      + (photoHtml ? "<div class='photo-row'>" + photoHtml + "</div>" : "")
      + "<div class='name'><h2>" + esc(app.prefixTh||"") + esc(app.firstNameTh||"") + " " + esc(app.lastNameTh||"") + "</h2>"
      + ((app.firstNameEn||app.lastNameEn) ? "<p>" + esc(app.prefixEn||"") + " " + esc(app.firstNameEn||"") + " " + esc(app.lastNameEn||"") + "</p>" : "")
      + (app.nickname ? "<p>ชื่อเล่น: " + esc(app.nickname) + "</p>" : "") + "</div>"
      + "<div class='section'><div class='section-title'>ข้อมูลส่วนตัว</div>"
      + "<div class='row'><div class='row-label'>สัญชาติ</div><div class='row-value'>" + esc(app.nationality||"-") + "</div></div>"
      + "<div class='row'><div class='row-label'>เลขบัตรประชาชน</div><div class='row-value'>" + esc(app.idCardNumber||"-") + "</div></div>"
      + "<div class='row'><div class='row-label'>วันเกิด</div><div class='row-value'>" + esc(app.birthDate||"-") + "</div></div>"
      + "<div class='row'><div class='row-label'>อายุ</div><div class='row-value'>" + esc(calcAge(app.birthDate||"") || "-") + "</div></div>"
      + "<div class='row'><div class='row-label'>เพศ</div><div class='row-value'>" + esc(app.gender||"-") + "</div></div>"
      + "<div class='row'><div class='row-label'>สถานภาพ</div><div class='row-value'>" + esc(app.maritalStatus||"-") + "</div></div>"
      + "<div class='row'><div class='row-label'>สถานะทางทหาร</div><div class='row-value'>" + esc(app.militaryStatus||"-") + "</div></div>"
      + "<div class='row'><div class='row-label'>ช่องทางติดต่อ</div><div class='row-value' style='font-size:12px'>" + socials + "</div></div></div>"
      + "<div class='section'><div class='section-title'>ที่อยู่</div><p>" + esc([app.addressLine, app.subDistrict, app.district, app.province, app.postalCode].filter(Boolean).join(" ")) + "</p></div>"
      + "<div class='section'><div class='section-title'>การศึกษา</div>" + eduHtml + "</div>"
      + "<div class='section'><div class='section-title'>ประสบการณ์ทำงาน</div>" + workHtml + "</div>"
      + "<div class='section'><div class='section-title'>ภาษา</div>" + langHtml + "</div>"
      + "<div class='section'><div class='section-title'>ความสามารถ</div>"
      + (app.skills ? "<div class='row'><div class='row-label'>ความสามารถพิเศษ</div><div class='row-value'>" + esc(app.skills) + "</div></div>" : "")
      + (app.computerSkills ? "<div class='row'><div class='row-label'>คอมพิวเตอร์</div><div class='row-value'>" + esc(app.computerSkills) + "</div></div>" : "")
      + ((app.itSkills as string) ? "<div class='row'><div class='row-label'>IT</div><div class='row-value'>" + esc(app.itSkills) + "</div></div>" : "")
      + ((app.aiSkills as string) ? "<div class='row'><div class='row-label'>AI</div><div class='row-value'>" + esc(app.aiSkills) + "</div></div>" : "")
      + "<div class='row'><div class='row-label'>ใบขับขี่</div><div class='row-value'>" + (hasDriving ? "มี" + (app.vehicleTypes ? " (" + esc(app.vehicleTypes) + ")" : "") : "ไม่มี") + "</div></div></div>"
      + "<div class='section'><div class='section-title'>ทัศนคติและข้อมูลเพิ่มเติม</div>"
      + (app.workAttitude ? "<div class='row'><div class='row-label'>ทัศนคติ</div><div class='row-value'>" + esc(app.workAttitude) + "</div></div>" : "")
      + (app.strengthWeakness ? "<div class='row'><div class='row-label'>จุดแข็ง/จุดอ่อน</div><div class='row-value'>" + esc(app.strengthWeakness) + "</div></div>" : "")
      + (app.expectedSalary ? "<div class='row'><div class='row-label'>เงินเดือนที่คาดหวัง</div><div class='row-value'>" + esc(app.expectedSalary) + " บาท</div></div>" : "")
      + (app.availableStartDate ? "<div class='row'><div class='row-label'>เริ่มงานได้</div><div class='row-value'>" + esc(app.availableStartDate) + "</div></div>" : "")
      + (app.howDidYouKnow ? "<div class='row'><div class='row-label'>ทราบข่าวจาก</div><div class='row-value'>" + esc(app.howDidYouKnow) + "</div></div>" : "") + "</div>"
      + "<div class='section'><div class='section-title'>บุคคลอ้างอิง</div>" + ecHtml + "</div>"
      + "<div class='footer'>MATCHING WEALTH CO., LTD.</div>"
      + "</div></div>"
      + "<button class='print-btn' onclick='window.print()'>🖨️ พิมพ์ / บันทึก PDF</button>"
      + "</body></html>";

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.onload = () => setTimeout(() => w.print(), 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto slide-up" onClick={(e) => e.stopPropagation()}>
        {(saving || deleting) && (
          <div className="absolute inset-0 z-20 bg-white/80 rounded-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-3 border-gray-200 border-t-brand-red rounded-full" style={{ animation: "spin 0.7s linear infinite", borderWidth: "3px" }} />
              <p className="text-sm text-gray-600">{saving ? "กำลังบันทึก..." : "กำลังลบ..."}</p>
            </div>
          </div>
        )}

        <div className="sticky top-0 bg-brand-red text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold">รายละเอียดใบสมัคร</h2>
            <p className="text-red-100 text-sm">{formatDate(app.createdAt || app.submittedAt || "")}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
              {photoFileId && (
                <div className="flex justify-center mb-4">
                  <div className="w-28 h-28 rounded-xl overflow-hidden border-4 border-brand-light shadow-md">
                    <img src={driveImageUrl(photoFileId)} alt="รูปถ่าย" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{app.prefixTh}{app.firstNameTh} {app.lastNameTh}</h3>
                {(app.firstNameEn || app.lastNameEn) && <p className="text-gray-500 text-sm">{app.prefixEn} {app.firstNameEn} {app.lastNameEn}</p>}
                {app.nickname && <p className="text-gray-400 text-sm">ชื่อเล่น: {app.nickname}</p>}
              </div>

              <SectionHeader icon="👤" title="ข้อมูลส่วนตัว" />
              <div className="bg-gray-50 rounded-xl p-4">
                <InfoRow label="สัญชาติ" value={app.nationality} />
                <InfoRow label="เลขบัตรประชาชน" value={app.idCardNumber} />
                <InfoRow label="วันเกิด" value={app.birthDate} />
                <InfoRow label="อายุ" value={calcAge(app.birthDate || "")} />
                <InfoRow label="เพศ" value={app.gender} />
                <InfoRow label="สถานภาพ" value={app.maritalStatus} />
                <InfoRow label="สถานะทางทหาร" value={app.militaryStatus} />
                <InfoRow label="เบอร์โทรศัพท์" value={app.phone} />
                <InfoRow label="อีเมล" value={app.email} />
                <InfoRow label="Line ID" value={app.lineId} />
                <InfoRow label="Facebook" value={app.facebook as string} />
                <InfoRow label="Instagram" value={app.instagram as string} />
                <InfoRow label="TikTok" value={app.tiktok as string} />
              </div>

              <SectionHeader icon="🏠" title="ที่อยู่" />
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-900">{[app.addressLine, app.subDistrict, app.district, app.province, app.postalCode].filter(Boolean).join(" ")}</p>
              </div>

              <SectionHeader icon="🎓" title="การศึกษา" />
              <div className="space-y-3">
                {educations && educations.length > 0 ? educations.map((edu, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-900">{edu.institution || "-"}</p>
                    <p className="text-sm text-gray-600">{edu.level}{edu.field ? " · " + edu.field : ""}</p>
                    {edu.graduationYear && <p className="text-xs text-gray-400 mt-1">ปีที่จบ: พ.ศ. {edu.graduationYear}</p>}
                  </div>
                )) : <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>}
              </div>

              <SectionHeader icon="💼" title="ประสบการณ์ทำงาน" />
              {hasWork && workHistories && workHistories.length > 0 ? (
                <div className="space-y-3">
                  {workHistories.map((wh, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-900">{wh.position || "-"}</p>
                      <p className="text-sm text-gray-600">{wh.company}</p>
                      <p className="text-xs text-gray-400 mt-1">{wh.startDate || "?"} — {wh.endDate || "ปัจจุบัน"}</p>
                      {wh.description && <p className="text-sm text-gray-700 mt-2">{wh.description}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">ไม่มีประสบการณ์ทำงาน</p>}

              <SectionHeader icon="🌐" title="ภาษา" />
              <div className="bg-gray-50 rounded-xl p-4">
                {languages && languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <span key={lang} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                        <span className="font-medium text-gray-900">{lang}</span>
                        {languageLevels && languageLevels[lang] && <span className="text-gray-400">· {languageLevels[lang]}</span>}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>}
              </div>

              <SectionHeader icon="⭐" title="ความสามารถ" />
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <InfoRow label="ความสามารถพิเศษ" value={app.skills} />
                <InfoRow label="ทักษะคอมพิวเตอร์" value={app.computerSkills} />
                <InfoRow label="ทักษะด้าน IT" value={app.itSkills as string} />
                <InfoRow label="ทักษะด้าน AI" value={app.aiSkills as string} />
                <InfoRow label="ใบขับขี่" value={hasDriving ? "มี" + (app.vehicleTypes ? " (" + app.vehicleTypes + ")" : "") : "ไม่มี"} />
              </div>

              <SectionHeader icon="💭" title="ทัศนคติและข้อมูลเพิ่มเติม" />
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <InfoRow label="ทัศนคติในการทำงาน" value={app.workAttitude} />
                <InfoRow label="จุดแข็งและจุดอ่อน" value={app.strengthWeakness} />
                <InfoRow label="เงินเดือนที่คาดหวัง" value={app.expectedSalary ? app.expectedSalary + " บาท" : undefined} />
                <InfoRow label="เริ่มงานได้" value={app.availableStartDate} />
                <InfoRow label="ทราบข่าวจาก" value={app.howDidYouKnow} />
              </div>

              <SectionHeader icon="📞" title="บุคคลอ้างอิง" />
              <div className="space-y-3">
                {emergencyContacts && emergencyContacts.length > 0 ? emergencyContacts.map((ec, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ec.name || "-"}</p>
                      {ec.relationship && <p className="text-xs text-gray-500">{ec.relationship}</p>}
                    </div>
                    {ec.phone && <p className="text-sm text-brand-red font-medium">{ec.phone}</p>}
                  </div>
                )) : <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>}
              </div>

              {(resumeFileId || idCardFileId) && (
                <>
                  <SectionHeader icon="📎" title="เอกสารแนบ" />
                  <div className="space-y-3">
                    {resumeFileId && (
                      <a href={driveImageUrl(resumeFileId)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors group">
                        <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-brand-red transition-colors">เรซูเม่</p>
                          <p className="text-xs text-gray-400">คลิกเพื่อเปิดไฟล์</p>
                        </div>
                      </a>
                    )}
                    {idCardFileId && (
                      <a href={driveImageUrl(idCardFileId)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors group">
                        <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-brand-red transition-colors">สำเนาบัตรประชาชน</p>
                          <p className="text-xs text-gray-400">คลิกเพื่อเปิดไฟล์</p>
                        </div>
                      </a>
                    )}
                  </div>
                </>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handlePrint} className="btn-secondary flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  พิมพ์ PDF
                </button>
                <button onClick={startEdit} className="btn-primary flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  แก้ไข
                </button>
                <button onClick={() => setConfirmDelete(true)} className="px-6 py-2.5 rounded-lg font-semibold border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  ลบ
                </button>
                <button onClick={onClose} className="btn-ghost">ปิด</button>
              </div>

              {confirmDelete && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 fade-in">
                  <p className="text-sm text-red-700 font-medium mb-3">ยืนยันการลบใบสมัครของ {app.prefixTh}{app.firstNameTh} {app.lastNameTh}?</p>
                  <p className="text-xs text-red-500 mb-4">การลบจะไม่สามารถกู้คืนได้ รวมถึงรูปถ่ายและเรซูเม่</p>
                  <div className="flex gap-3">
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">ยืนยันลบ</button>
                    <button onClick={() => setConfirmDelete(false)} className="btn-ghost text-sm">ยกเลิก</button>
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsClient({ session }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setApps(data);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้ (อาจยังไม่ได้ตั้งค่า Google Drive)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      <InactivityGuard />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 slide-up">
          <h1 className="text-3xl font-bold text-gray-900">ใบสมัครงาน</h1>
          <p className="text-gray-500 mt-1">รายการใบสมัครทั้งหมด {apps.length > 0 ? "(" + apps.length + " รายการ)" : ""}</p>
        </div>

        {error && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        {loading ? (
          <Spinner />
        ) : apps.length === 0 ? (
          <div className="card text-center py-16 text-gray-400 slide-up">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">ยังไม่มีใบสมัคร</p>
          </div>
        ) : (
          <div className="space-y-3 slide-up">
            {apps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelected(app)}
                className="card-hover cursor-pointer flex items-center gap-4"
              >
                <div className="w-11 h-11 bg-brand-light rounded-full flex items-center justify-center shrink-0">
                  <span className="text-brand-red font-bold text-sm">
                    {(app.firstNameTh || "?").charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {app.prefixTh}{app.firstNameTh} {app.lastNameTh}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {app.phone} {app.email ? "· " + app.email : ""}
                  </p>
                </div>
                <div className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  {formatDate(app.createdAt)}
                </div>
                <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <DetailModal
            app={selected}
            onClose={() => setSelected(null)}
            onDelete={(id) => {
              setApps(apps.filter((a) => a.id !== id));
              setSelected(null);
            }}
          />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-brand-red" />
    </div>
  );
}
