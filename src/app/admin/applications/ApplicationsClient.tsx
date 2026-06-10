"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import InactivityGuard from "@/components/InactivityGuard";

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

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("th-TH", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
}

function driveFileUrl(fileId: string) {
  return "https://drive.google.com/file/d/" + fileId + "/view";
}

function driveImageUrl(fileId: string) {
  return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w400";
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

function DetailModal({ app, onClose, onUpdate, onDelete }: {
  app: Application;
  onClose: () => void;
  onUpdate: (updated: Application) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

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

  const startEdit = () => {
    const editable: Record<string, string> = {};
    const keys = [
      "prefixTh","firstNameTh","lastNameTh","prefixEn","firstNameEn","lastNameEn",
      "nickname","nationality","idCardNumber","birthDate","gender","maritalStatus",
      "militaryStatus","phone","email","lineId","addressLine","subDistrict","district",
      "province","postalCode","skills","computerSkills","vehicleTypes","workAttitude",
      "strengthWeakness","expectedSalary","availableStartDate","howDidYouKnow",
    ];
    keys.forEach((k) => { editable[k] = (app[k] as string) || ""; });
    setForm(editable);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { ...app };
      Object.entries(form).forEach(([k, v]) => { body[k] = v; });
      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const updated = { ...app, ...form };
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + (err instanceof Error ? err.message : ""));
    } finally {
      setSaving(false);
    }
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

  const editField = (key: string, label: string) => (
    <div key={key}>
      <label className="text-xs text-gray-500">{label}</label>
      <input value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-field text-sm mt-0.5" />
    </div>
  );

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
            <h2 className="text-lg font-bold">{editing ? "แก้ไขใบสมัคร" : "รายละเอียดใบสมัคร"}</h2>
            <p className="text-red-100 text-sm">{formatDate(app.createdAt || app.submittedAt || "")}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          {!editing ? (
            <>
              {photoFileId && (
                <div className="flex justify-center mb-4">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-brand-light shadow-md">
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
                <InfoRow label="เพศ" value={app.gender} />
                <InfoRow label="สถานภาพ" value={app.maritalStatus} />
                <InfoRow label="สถานะทางทหาร" value={app.militaryStatus} />
                <InfoRow label="เบอร์โทรศัพท์" value={app.phone} />
                <InfoRow label="อีเมล" value={app.email} />
                <InfoRow label="Line ID" value={app.lineId} />
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

              {resumeFileId && (
                <>
                  <SectionHeader icon="📎" title="เอกสารแนบ" />
                  <a href={driveFileUrl(resumeFileId)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors group">
                    <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-red transition-colors">เรซูเม่</p>
                      <p className="text-xs text-gray-400">คลิกเพื่อเปิดใน Google Drive</p>
                    </div>
                  </a>
                </>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
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
            </>
          ) : (
            <>
              <SectionHeader icon="👤" title="ข้อมูลส่วนตัว" />
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {editField("prefixTh", "คำนำหน้า")}
                  {editField("firstNameTh", "ชื่อ (ไทย)")}
                  {editField("lastNameTh", "นามสกุล (ไทย)")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {editField("prefixEn", "Prefix")}
                  {editField("firstNameEn", "First Name")}
                  {editField("lastNameEn", "Last Name")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editField("nickname", "ชื่อเล่น")}
                  {editField("nationality", "สัญชาติ")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editField("idCardNumber", "เลขบัตรประชาชน")}
                  {editField("birthDate", "วันเกิด")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {editField("gender", "เพศ")}
                  {editField("maritalStatus", "สถานภาพ")}
                  {editField("militaryStatus", "สถานะทางทหาร")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {editField("phone", "เบอร์โทรศัพท์")}
                  {editField("email", "อีเมล")}
                  {editField("lineId", "Line ID")}
                </div>
              </div>

              <SectionHeader icon="🏠" title="ที่อยู่" />
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {editField("addressLine", "ที่อยู่")}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editField("subDistrict", "แขวง/ตำบล")}
                  {editField("district", "เขต/อำเภอ")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editField("province", "จังหวัด")}
                  {editField("postalCode", "รหัสไปรษณีย์")}
                </div>
              </div>

              <SectionHeader icon="⭐" title="ความสามารถและอื่น ๆ" />
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {editField("skills", "ความสามารถพิเศษ")}
                {editField("computerSkills", "ทักษะคอมพิวเตอร์")}
                {editField("vehicleTypes", "ประเภทยานพาหนะ")}
                {editField("workAttitude", "ทัศนคติในการทำงาน")}
                {editField("strengthWeakness", "จุดแข็งและจุดอ่อน")}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editField("expectedSalary", "เงินเดือนที่คาดหวัง")}
                  {editField("availableStartDate", "เริ่มงานได้")}
                </div>
                {editField("howDidYouKnow", "ทราบข่าวจาก")}
              </div>

              <div className="mt-8 flex gap-3 justify-center">
                <button onClick={handleSave} className="btn-primary">บันทึก</button>
                <button onClick={() => setEditing(false)} className="btn-ghost">ยกเลิก</button>
              </div>
            </>
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
            onUpdate={(updated) => {
              setApps(apps.map((a) => a.id === updated.id ? updated : a));
              setSelected(updated);
            }}
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
