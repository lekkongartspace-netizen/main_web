"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Toggle from "@/components/Toggle";
import FlatpickrInput from "@/components/FlatpickrInput";
import SaveOverlay from "@/components/SaveOverlay";
import { calcAge } from "@/lib/calcAge";
import { validateFile, MAX_TOTAL_BYTES, MAX_TOTAL_MB } from "@/lib/uploadLimits";

interface Props {
  session: { name: string; role: "admin" | "user" };
}

interface WorkHistory {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  reasonForLeaving: string;
}

interface Education {
  level: string;
  institution: string;
  field: string;
  graduationYear: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

const NATIONALITIES = ["ไทย","ลาว","เมียนมา","กัมพูชา","เวียดนาม","จีน","ญี่ปุ่น","เกาหลี","อเมริกัน","อังกฤษ","อื่น ๆ"];
const LANGUAGES = ["ไทย","อังกฤษ","จีน","ญี่ปุ่น","เกาหลี","ลาว","พม่า","เขมร"];
const EDUCATION_LEVELS = ["ต่ำกว่ามัธยมศึกษา","มัธยมศึกษา / ปวช.","อนุปริญญา / ปวส.","ปริญญาตรี","ปริญญาโท","ปริญญาเอก"];

const STEPS = ["ข้อมูลส่วนตัว","ที่อยู่","การศึกษา","ประสบการณ์ทำงาน","ความสามารถ","บุคคลอ้างอิง","เอกสารแนบ"];

function parseJson(val: unknown): unknown {
  if (typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
}

export default function EditClient({ session }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [appId, setAppId] = useState("");
  const [existingFiles, setExistingFiles] = useState<Record<string, string>>({});
  const photoRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const idCardRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    prefixTh: "นาย", firstNameTh: "", lastNameTh: "", prefixEn: "Mr.", firstNameEn: "", lastNameEn: "",
    nickname: "", nationality: "ไทย", idCardNumber: "", birthDate: "", gender: "ชาย",
    maritalStatus: "โสด", militaryStatus: "ได้รับการยกเว้น", phone: "", email: "", lineId: "",
    facebook: "", instagram: "", tiktok: "",
    addressLine: "", subDistrict: "", district: "", province: "", postalCode: "",
    languages: ["ไทย"] as string[], languageLevels: {} as Record<string, string>,
    educations: [{ level: "ปริญญาตรี", institution: "", field: "", graduationYear: "" }] as Education[],
    workHistories: [] as WorkHistory[], hasWorkExperience: false,
    skills: "", computerSkills: "", itSkills: "", aiSkills: "", drivingLicense: false, vehicleTypes: "",
    workAttitude: "", strengthWeakness: "", expectedSalary: "", availableStartDate: "", howDidYouKnow: "",
    emergencyContacts: [{ name: "", relationship: "", phone: "" }] as EmergencyContact[],
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("editApp");
      if (!raw) { router.push("/admin/applications"); return; }
      const app = JSON.parse(raw);
      setAppId(app.id || "");
      setExistingFiles(app.files || {});

      if (app.files?.photo) {
        setPhotoPreview("/api/files?id=" + app.files.photo);
      }

      const langs = parseJson(app.languages) as string[] || ["ไทย"];
      const langLevels = parseJson(app.languageLevels) as Record<string, string> || {};
      const edus = parseJson(app.educations) as Education[] || [{ level: "ปริญญาตรี", institution: "", field: "", graduationYear: "" }];
      const works = parseJson(app.workHistories) as WorkHistory[] || [];
      const ecs = parseJson(app.emergencyContacts) as EmergencyContact[] || [{ name: "", relationship: "", phone: "" }];

      setForm({
        prefixTh: app.prefixTh || "นาย", firstNameTh: app.firstNameTh || "", lastNameTh: app.lastNameTh || "",
        prefixEn: app.prefixEn || "Mr.", firstNameEn: app.firstNameEn || "", lastNameEn: app.lastNameEn || "",
        nickname: app.nickname || "", nationality: app.nationality || "ไทย", idCardNumber: app.idCardNumber || "",
        birthDate: app.birthDate || "", gender: app.gender || "ชาย", maritalStatus: app.maritalStatus || "โสด",
        militaryStatus: app.militaryStatus || "ได้รับการยกเว้น", phone: app.phone || "", email: app.email || "",
        lineId: app.lineId || "", facebook: app.facebook || "", instagram: app.instagram || "", tiktok: app.tiktok || "",
        addressLine: app.addressLine || "", subDistrict: app.subDistrict || "", district: app.district || "",
        province: app.province || "", postalCode: app.postalCode || "",
        languages: langs, languageLevels: langLevels, educations: edus, workHistories: works,
        hasWorkExperience: app.hasWorkExperience === "true" || works.length > 0,
        skills: app.skills || "", computerSkills: app.computerSkills || "", itSkills: app.itSkills || "",
        aiSkills: app.aiSkills || "", drivingLicense: app.drivingLicense === "true",
        vehicleTypes: app.vehicleTypes || "", workAttitude: app.workAttitude || "",
        strengthWeakness: app.strengthWeakness || "", expectedSalary: app.expectedSalary || "",
        availableStartDate: app.availableStartDate || "", howDidYouKnow: app.howDidYouKnow || "",
        emergencyContacts: ecs,
      });
      setLoaded(true);
    } catch { router.push("/admin/applications"); }
  }, [router]);

  const updateForm = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const goToStep = (s: number) => setStep(s);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, "photo");
    if (err) { alert(err); e.target.value = ""; return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addEducation = () => updateForm("educations", [...form.educations, { level: "ปริญญาตรี", institution: "", field: "", graduationYear: "" }]);
  const updateEducation = (idx: number, key: string, val: string) => { const u = [...form.educations]; u[idx] = { ...u[idx], [key]: val }; updateForm("educations", u); };
  const removeEducation = (idx: number) => updateForm("educations", form.educations.filter((_, i) => i !== idx));

  const addWorkHistory = () => updateForm("workHistories", [...form.workHistories, { company: "", position: "", startDate: "", endDate: "", description: "", reasonForLeaving: "" }]);
  const updateWorkHistory = (idx: number, key: string, val: string) => { const u = [...form.workHistories]; u[idx] = { ...u[idx], [key]: val }; updateForm("workHistories", u); };
  const removeWorkHistory = (idx: number) => updateForm("workHistories", form.workHistories.filter((_, i) => i !== idx));

  const addEmergencyContact = () => updateForm("emergencyContacts", [...form.emergencyContacts, { name: "", relationship: "", phone: "" }]);
  const updateEmergencyContact = (idx: number, key: string, val: string) => { const u = [...form.emergencyContacts]; u[idx] = { ...u[idx], [key]: val }; updateForm("emergencyContacts", u); };
  const removeEmergencyContact = (idx: number) => updateForm("emergencyContacts", form.emergencyContacts.filter((_, i) => i !== idx));

  const toggleLanguage = (lang: string) => {
    const langs = form.languages.includes(lang) ? form.languages.filter((l) => l !== lang) : [...form.languages, lang];
    updateForm("languages", langs);
  };

  const handleSave = async () => {
    const totalBytes = (photoFile?.size || 0) + (resumeFile?.size || 0) + (idCardFile?.size || 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      alert("ไฟล์ใหม่ที่อัปโหลดรวมกันใหญ่เกิน " + MAX_TOTAL_MB + "MB กรุณาบีบอัดก่อน");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("id", appId);
      Object.entries(form).forEach(([key, val]) => {
        fd.append(key, typeof val === "object" ? JSON.stringify(val) : String(val));
      });
      if (photoFile) fd.append("photo", photoFile);
      if (resumeFile) fd.append("resume", resumeFile);
      if (idCardFile) fd.append("idCard", idCardFile);
      fd.append("existingFiles", JSON.stringify(existingFiles));

      const res = await fetch("/api/applications", { method: "PUT", body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      sessionStorage.removeItem("editApp");
      router.push("/admin/applications");
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + (err instanceof Error ? err.message : ""));
    } finally { setSaving(false); }
  };

  if (!loaded) return <div className="min-h-screen bg-gray-50"><Navbar session={session} /><div className="flex justify-center py-20"><div className="h-8 w-8 border-3 border-gray-200 border-t-brand-red rounded-full" style={{ animation: "spin 0.7s linear infinite", borderWidth: "3px" }} /></div></div>;

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-6 fade-in">
          <div className="flex flex-col items-center mb-6">
            <button type="button" onClick={() => photoRef.current?.click()} className="w-28 h-28 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 hover:border-brand-red flex items-center justify-center overflow-hidden transition-all duration-200 group">
              {photoPreview ? <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" /> : (
                <div className="text-center"><svg className="w-8 h-8 text-gray-400 mx-auto group-hover:text-brand-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="text-xs text-gray-400 mt-1 block">รูปถ่าย</span></div>
              )}
            </button>
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            <p className="text-xs text-gray-400 mt-2 text-center">กรุณาใช้รูปหน้าตรง เป็นทางการ เห็นใบหน้าชัดเจน</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">คำนำหน้า</label><select value={form.prefixTh} onChange={(e) => updateForm("prefixTh", e.target.value)} className="input-field"><option>นาย</option><option>นาง</option><option>นางสาว</option></select></div>
            <div><label className="label">ชื่อ (ไทย)</label><input value={form.firstNameTh} onChange={(e) => updateForm("firstNameTh", e.target.value)} className="input-field" /></div>
            <div><label className="label">นามสกุล (ไทย)</label><input value={form.lastNameTh} onChange={(e) => updateForm("lastNameTh", e.target.value)} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">Prefix</label><select value={form.prefixEn} onChange={(e) => updateForm("prefixEn", e.target.value)} className="input-field"><option>Mr.</option><option>Mrs.</option><option>Ms.</option></select></div>
            <div><label className="label">First Name</label><input value={form.firstNameEn} onChange={(e) => updateForm("firstNameEn", e.target.value)} className="input-field" /></div>
            <div><label className="label">Last Name</label><input value={form.lastNameEn} onChange={(e) => updateForm("lastNameEn", e.target.value)} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">ชื่อเล่น</label><input value={form.nickname} onChange={(e) => updateForm("nickname", e.target.value)} className="input-field" /></div>
            <div><label className="label">สัญชาติ</label><select value={form.nationality} onChange={(e) => updateForm("nationality", e.target.value)} className="input-field">{NATIONALITIES.map((n) => <option key={n}>{n}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">เลขบัตรประชาชน</label><input value={form.idCardNumber} onChange={(e) => updateForm("idCardNumber", e.target.value)} className="input-field" maxLength={17} /></div>
            <div><label className="label">วันเกิด</label><FlatpickrInput value={form.birthDate} onChange={(val) => updateForm("birthDate", val)} /></div>
            <div><label className="label">อายุ</label><input value={calcAge(form.birthDate)} readOnly className="input-field bg-gray-50 cursor-not-allowed" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">เพศ</label><select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)} className="input-field"><option>ชาย</option><option>หญิง</option><option>อื่น ๆ</option></select></div>
            <div><label className="label">สถานภาพ</label><select value={form.maritalStatus} onChange={(e) => updateForm("maritalStatus", e.target.value)} className="input-field"><option>โสด</option><option>สมรส</option><option>หม้าย</option><option>หย่า</option></select></div>
            <div><label className="label">สถานะทางทหาร</label><select value={form.militaryStatus} onChange={(e) => updateForm("militaryStatus", e.target.value)} className="input-field"><option>ได้รับการยกเว้น</option><option>ผ่านการเกณฑ์ทหาร</option><option>ยังไม่ได้เกณฑ์</option></select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">เบอร์โทรศัพท์</label><input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className="input-field" /></div>
            <div><label className="label">อีเมล</label><input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className="input-field" /></div>
            <div><label className="label">Line ID</label><input value={form.lineId} onChange={(e) => updateForm("lineId", e.target.value)} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">Facebook</label><input value={form.facebook} onChange={(e) => updateForm("facebook", e.target.value)} className="input-field" /></div>
            <div><label className="label">Instagram</label><input value={form.instagram} onChange={(e) => updateForm("instagram", e.target.value)} className="input-field" /></div>
            <div><label className="label">TikTok</label><input value={form.tiktok} onChange={(e) => updateForm("tiktok", e.target.value)} className="input-field" /></div>
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4 fade-in">
          <div><label className="label">ที่อยู่</label><input value={form.addressLine} onChange={(e) => updateForm("addressLine", e.target.value)} className="input-field" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">แขวง/ตำบล</label><input value={form.subDistrict} onChange={(e) => updateForm("subDistrict", e.target.value)} className="input-field" /></div>
            <div><label className="label">เขต/อำเภอ</label><input value={form.district} onChange={(e) => updateForm("district", e.target.value)} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">จังหวัด</label><input value={form.province} onChange={(e) => updateForm("province", e.target.value)} className="input-field" /></div>
            <div><label className="label">รหัสไปรษณีย์</label><input value={form.postalCode} onChange={(e) => updateForm("postalCode", e.target.value)} className="input-field" maxLength={5} /></div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6 fade-in">
          {form.educations.map((edu, idx) => (
            <div key={idx} className="card border border-gray-200 relative">
              {form.educations.length > 1 && <button type="button" onClick={() => removeEducation(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
              <h4 className="text-sm font-semibold text-gray-500 mb-4">การศึกษาที่ {idx + 1}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">ระดับ</label><select value={edu.level} onChange={(e) => updateEducation(idx, "level", e.target.value)} className="input-field">{EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
                <div><label className="label">สถาบัน</label><input value={edu.institution} onChange={(e) => updateEducation(idx, "institution", e.target.value)} className="input-field" /></div>
                <div><label className="label">สาขา</label><input value={edu.field} onChange={(e) => updateEducation(idx, "field", e.target.value)} className="input-field" /></div>
                <div><label className="label">ปีที่จบ (พ.ศ.)</label><input value={edu.graduationYear} onChange={(e) => updateEducation(idx, "graduationYear", e.target.value)} className="input-field" maxLength={4} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addEducation} className="btn-secondary w-full">+ เพิ่มการศึกษา</button>
        </div>
      );
      case 3: return (
        <div className="space-y-6 fade-in">
          <Toggle checked={form.hasWorkExperience} onChange={(val) => updateForm("hasWorkExperience", val)} label="มีประสบการณ์ทำงาน" />
          {form.hasWorkExperience && (
            <>
              {form.workHistories.map((wh, idx) => (
                <div key={idx} className="card border border-gray-200 relative">
                  <button type="button" onClick={() => removeWorkHistory(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  <h4 className="text-sm font-semibold text-gray-500 mb-4">ประสบการณ์ที่ {idx + 1}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="label">บริษัท</label><input value={wh.company} onChange={(e) => updateWorkHistory(idx, "company", e.target.value)} className="input-field" /></div>
                    <div><label className="label">ตำแหน่ง</label><input value={wh.position} onChange={(e) => updateWorkHistory(idx, "position", e.target.value)} className="input-field" /></div>
                    <div><label className="label">วันที่เริ่ม</label><FlatpickrInput value={wh.startDate} onChange={(val) => updateWorkHistory(idx, "startDate", val)} /></div>
                    <div><label className="label">วันที่สิ้นสุด</label><FlatpickrInput value={wh.endDate} onChange={(val) => updateWorkHistory(idx, "endDate", val)} /></div>
                  </div>
                  <div className="mt-4"><label className="label">รายละเอียดงาน</label><textarea value={wh.description} onChange={(e) => updateWorkHistory(idx, "description", e.target.value)} className="input-field" rows={3} /></div>
                  <div className="mt-4"><label className="label">เหตุผลที่เปลี่ยนงาน</label><input value={wh.reasonForLeaving || ""} onChange={(e) => updateWorkHistory(idx, "reasonForLeaving", e.target.value)} className="input-field" /></div>
                </div>
              ))}
              <button type="button" onClick={addWorkHistory} className="btn-secondary w-full">+ เพิ่มประสบการณ์</button>
            </>
          )}
        </div>
      );
      case 4: return (
        <div className="space-y-6 fade-in">
          <div>
            <label className="label">ภาษาที่ใช้ได้</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {LANGUAGES.map((lang) => (<button key={lang} type="button" onClick={() => toggleLanguage(lang)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.languages.includes(lang) ? "bg-brand-red text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{lang}</button>))}
            </div>
          </div>
          {form.languages.length > 0 && (
            <div className="space-y-3">
              <label className="label">ระดับความสามารถ</label>
              {form.languages.map((lang) => (
                <div key={lang} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-16">{lang}</span>
                  <select value={form.languageLevels[lang] || "พอใช้"} onChange={(e) => updateForm("languageLevels", { ...form.languageLevels, [lang]: e.target.value })} className="input-field flex-1"><option>พื้นฐาน</option><option>พอใช้</option><option>ดี</option><option>ดีมาก</option><option>เชี่ยวชาญ</option></select>
                </div>
              ))}
            </div>
          )}
          <div><label className="label">ความสามารถพิเศษ</label><textarea value={form.skills} onChange={(e) => updateForm("skills", e.target.value)} className="input-field" rows={3} /></div>
          <div><label className="label">ทักษะคอมพิวเตอร์</label><textarea value={form.computerSkills} onChange={(e) => updateForm("computerSkills", e.target.value)} className="input-field" rows={2} /></div>
          <div><label className="label">ทักษะด้าน IT</label><textarea value={form.itSkills} onChange={(e) => updateForm("itSkills", e.target.value)} className="input-field" rows={2} /></div>
          <div><label className="label">ทักษะด้าน AI</label><textarea value={form.aiSkills} onChange={(e) => updateForm("aiSkills", e.target.value)} className="input-field" rows={2} /></div>
          <Toggle checked={form.drivingLicense} onChange={(val) => updateForm("drivingLicense", val)} label="มีใบขับขี่" />
          {form.drivingLicense && <div><label className="label">ประเภทยานพาหนะ</label><input value={form.vehicleTypes} onChange={(e) => updateForm("vehicleTypes", e.target.value)} className="input-field" /></div>}
          <div><label className="label">ทัศนคติในการทำงาน</label><textarea value={form.workAttitude} onChange={(e) => updateForm("workAttitude", e.target.value)} className="input-field" rows={3} /></div>
          <div><label className="label">จุดแข็งและจุดอ่อน</label><textarea value={form.strengthWeakness} onChange={(e) => updateForm("strengthWeakness", e.target.value)} className="input-field" rows={3} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">เงินเดือนที่คาดหวัง (บาท)</label><input value={form.expectedSalary} onChange={(e) => updateForm("expectedSalary", e.target.value)} className="input-field" /></div>
            <div><label className="label">วันที่เริ่มงานได้</label><FlatpickrInput value={form.availableStartDate} onChange={(val) => updateForm("availableStartDate", val)} /></div>
          </div>
          <div><label className="label">ทราบข่าวจาก</label><input value={form.howDidYouKnow} onChange={(e) => updateForm("howDidYouKnow", e.target.value)} className="input-field" /></div>
        </div>
      );
      case 5: return (
        <div className="space-y-6 fade-in">
          {form.emergencyContacts.map((ec, idx) => (
            <div key={idx} className="card border border-gray-200 relative">
              {form.emergencyContacts.length > 1 && <button type="button" onClick={() => removeEmergencyContact(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
              <h4 className="text-sm font-semibold text-gray-500 mb-4">บุคคลอ้างอิงที่ {idx + 1}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="label">ชื่อ-นามสกุล</label><input value={ec.name} onChange={(e) => updateEmergencyContact(idx, "name", e.target.value)} className="input-field" /></div>
                <div><label className="label">ความสัมพันธ์</label><input value={ec.relationship} onChange={(e) => updateEmergencyContact(idx, "relationship", e.target.value)} className="input-field" /></div>
                <div><label className="label">เบอร์โทรศัพท์</label><input value={ec.phone} onChange={(e) => updateEmergencyContact(idx, "phone", e.target.value)} className="input-field" /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addEmergencyContact} className="btn-secondary w-full">+ เพิ่มบุคคลอ้างอิง</button>
        </div>
      );
      case 6: return (
        <div className="space-y-6 fade-in">
          <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">ไฟล์เดิมจะถูกเก็บไว้ อัพโหลดใหม่เฉพาะไฟล์ที่ต้องการเปลี่ยน</div>
          <div>
            <label className="label">เปลี่ยนเรซูเม่</label>
            <div onClick={() => resumeRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-red transition-all">
              {resumeFile ? <span className="text-gray-700 font-medium">{resumeFile.name}</span> : <p className="text-gray-500 text-sm">{existingFiles.resume ? "เรซูเม่เดิมมีอยู่แล้ว — คลิกเพื่อเปลี่ยน" : "คลิกเพื่ออัพโหลด"}</p>}
            </div>
            <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const err = validateFile(f, "resume"); if (err) { alert(err); e.target.value = ""; return; } setResumeFile(f); }} className="hidden" />
          </div>
          <div>
            <label className="label">เปลี่ยนสำเนาบัตรประชาชน</label>
            <div onClick={() => idCardRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-red transition-all">
              {idCardFile ? <span className="text-gray-700 font-medium">{idCardFile.name}</span> : <p className="text-gray-500 text-sm">{existingFiles.idCard ? "สำเนาเดิมมีอยู่แล้ว — คลิกเพื่อเปลี่ยน" : "คลิกเพื่ออัพโหลด"}</p>}
            </div>
            <input ref={idCardRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const err = validateFile(f, "idCard"); if (err) { alert(err); e.target.value = ""; return; } setIdCardFile(f); }} className="hidden" />
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      {saving && <SaveOverlay message="กำลังบันทึก..." />}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 slide-up">
          <h1 className="text-3xl font-bold text-gray-900">แก้ไขใบสมัคร</h1>
          <p className="text-gray-500 mt-1">{form.prefixTh}{form.firstNameTh} {form.lastNameTh}</p>
        </div>
        <div className="mb-8">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {STEPS.map((s, i) => (
              <button key={i} type="button" onClick={() => goToStep(i)} className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${i === step ? "bg-brand-red text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-7 h-7 bg-brand-red text-white rounded-full flex items-center justify-center text-sm font-bold">{step + 1}</span>
            {STEPS[step]}
          </h2>
          {renderStep()}
        </div>
        <div className="flex justify-between gap-4">
          <a href="/admin/applications" className="btn-ghost">← กลับ</a>
          <div className="flex gap-3">
            {step > 0 && <button type="button" onClick={() => goToStep(step - 1)} className="btn-ghost">ย้อนกลับ</button>}
            {step < STEPS.length - 1 && <button type="button" onClick={() => goToStep(step + 1)} className="btn-secondary text-sm">ถัดไป →</button>}
            <button type="button" onClick={handleSave} className="btn-primary">บันทึกการแก้ไข</button>
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-brand-red" />
    </div>
  );
}
