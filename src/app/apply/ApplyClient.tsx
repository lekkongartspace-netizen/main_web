"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Toggle from "@/components/Toggle";
import FlatpickrInput from "@/components/FlatpickrInput";
import SaveOverlay from "@/components/SaveOverlay";
import { calcAge } from "@/lib/calcAge";
import InactivityGuard from "@/components/InactivityGuard";

interface Props {
  session: { name: string; role: "admin" | "user" } | null;
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

const NATIONALITIES = [
  "ไทย", "ลาว", "เมียนมา", "กัมพูชา", "เวียดนาม", "จีน", "ญี่ปุ่น", "เกาหลี", "อเมริกัน", "อังกฤษ", "อื่น ๆ",
];

const LANGUAGES = [
  "ไทย", "อังกฤษ", "จีน", "ญี่ปุ่น", "เกาหลี", "ลาว", "พม่า", "เขมร",
];

const EDUCATION_LEVELS = [
  "ต่ำกว่ามัธยมศึกษา", "มัธยมศึกษา / ปวช.", "อนุปริญญา / ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก",
];

const STEPS = [
  "ข้อมูลส่วนตัว",
  "ที่อยู่",
  "การศึกษา",
  "ประสบการณ์ทำงาน",
  "ความสามารถ",
  "บุคคลอ้างอิง",
  "เอกสารแนบ",
  "ตรวจสอบ",
];

export default function ApplyClient({ session }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ label: string; step: number }[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const idCardRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    prefixTh: "นาย",
    firstNameTh: "",
    lastNameTh: "",
    prefixEn: "Mr.",
    firstNameEn: "",
    lastNameEn: "",
    nickname: "",
    nationality: "ไทย",
    idCardNumber: "",
    birthDate: "",
    gender: "ชาย",
    maritalStatus: "โสด",
    militaryStatus: "ได้รับการยกเว้น",
    phone: "",
    email: "",
    lineId: "",
    facebook: "",
    instagram: "",
    tiktok: "",

    addressLine: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",

    languages: ["ไทย"] as string[],
    languageLevels: {} as Record<string, string>,

    educations: [{ level: "ปริญญาตรี", institution: "", field: "", graduationYear: "" }] as Education[],

    workHistories: [] as WorkHistory[],
    hasWorkExperience: false,

    skills: "",
    computerSkills: "",
    itSkills: "",
    aiSkills: "",
    drivingLicense: false,
    vehicleTypes: "",

    workAttitude: "",
    strengthWeakness: "",
    expectedSalary: "",
    availableStartDate: "",
    howDidYouKnow: "",

    emergencyContacts: [{ name: "", relationship: "", phone: "" }] as EmergencyContact[],
  });

  const updateForm = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setIdCardFile(file);
  };

  const addWorkHistory = () => {
    updateForm("workHistories", [
      ...form.workHistories,
      { company: "", position: "", startDate: "", endDate: "", description: "", reasonForLeaving: "" },
    ]);
  };

  const updateWorkHistory = (idx: number, key: string, val: string) => {
    const updated = [...form.workHistories];
    updated[idx] = { ...updated[idx], [key]: val };
    updateForm("workHistories", updated);
  };

  const removeWorkHistory = (idx: number) => {
    updateForm("workHistories", form.workHistories.filter((_, i) => i !== idx));
  };

  const addEducation = () => {
    updateForm("educations", [
      ...form.educations,
      { level: "ปริญญาตรี", institution: "", field: "", graduationYear: "" },
    ]);
  };

  const updateEducation = (idx: number, key: string, val: string) => {
    const updated = [...form.educations];
    updated[idx] = { ...updated[idx], [key]: val };
    updateForm("educations", updated);
  };

  const removeEducation = (idx: number) => {
    updateForm("educations", form.educations.filter((_, i) => i !== idx));
  };

  const addEmergencyContact = () => {
    updateForm("emergencyContacts", [
      ...form.emergencyContacts,
      { name: "", relationship: "", phone: "" },
    ]);
  };

  const updateEmergencyContact = (idx: number, key: string, val: string) => {
    const updated = [...form.emergencyContacts];
    updated[idx] = { ...updated[idx], [key]: val };
    updateForm("emergencyContacts", updated);
  };

  const removeEmergencyContact = (idx: number) => {
    updateForm("emergencyContacts", form.emergencyContacts.filter((_, i) => i !== idx));
  };

  const toggleLanguage = (lang: string) => {
    const langs = form.languages.includes(lang)
      ? form.languages.filter((l) => l !== lang)
      : [...form.languages, lang];
    updateForm("languages", langs);
  };

  const validateBeforeSubmit = (): { label: string; step: number }[] => {
    const errors: { label: string; step: number }[] = [];
    if (!photoFile) errors.push({ label: "รูปถ่าย", step: 0 });
    if (!form.firstNameTh.trim()) errors.push({ label: "ชื่อ (ไทย)", step: 0 });
    if (!form.lastNameTh.trim()) errors.push({ label: "นามสกุล (ไทย)", step: 0 });
    if (!form.phone.trim()) errors.push({ label: "เบอร์โทรศัพท์", step: 0 });
    if (!form.birthDate) errors.push({ label: "วันเกิด", step: 0 });
    if (!form.addressLine.trim()) errors.push({ label: "ที่อยู่", step: 1 });
    if (!form.subDistrict.trim()) errors.push({ label: "แขวง/ตำบล", step: 1 });
    if (!form.district.trim()) errors.push({ label: "เขต/อำเภอ", step: 1 });
    if (!form.province.trim()) errors.push({ label: "จังหวัด", step: 1 });
    if (!form.postalCode.trim()) errors.push({ label: "รหัสไปรษณีย์", step: 1 });
    if (form.educations.some((e) => !e.institution.trim())) errors.push({ label: "สถาบันการศึกษา", step: 2 });
    if (form.emergencyContacts.every((c) => !c.name.trim() || !c.phone.trim())) errors.push({ label: "บุคคลอ้างอิงอย่างน้อย 1 คน", step: 5 });
    if (!idCardFile) errors.push({ label: "สำเนาบัตรประชาชน", step: 6 });
    return errors;
  };

  const goToStep = (s: number) => {
    setStep(s);
    setValidationErrors([]);
  };

  const goNext = () => {
    goToStep(step + 1);
  };

  const goBack = () => {
    goToStep(Math.max(0, step - 1));
  };

  const handleSubmit = async () => {
    const errors = validateBeforeSubmit();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    setSaving(true);
    try {
      const fd = new FormData();

      Object.entries(form).forEach(([key, val]) => {
        if (typeof val === "object") {
          fd.append(key, JSON.stringify(val));
        } else {
          fd.append(key, String(val));
        }
      });

      if (photoFile) fd.append("photo", photoFile);
      if (resumeFile) fd.append("resume", resumeFile);
      if (idCardFile) fd.append("idCard", idCardFile);

      const res = await fetch("/api/applications", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      alert("ไม่สามารถส่งใบสมัครได้: " + msg);
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar session={session} />
        <div className="max-w-lg mx-auto px-4 py-20 text-center slide-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ส่งใบสมัครเรียบร้อยแล้ว</h1>
          <p className="text-gray-500 mb-6">ขอบคุณที่สนใจร่วมงานกับ Matching Wealth</p>
          <a href="/dashboard" className="btn-primary inline-block">กลับหน้าหลัก</a>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 fade-in">
            <div className="flex flex-col items-center mb-6">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 hover:border-brand-red flex items-center justify-center overflow-hidden transition-all duration-200 group"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto group-hover:text-brand-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-gray-400 mt-1 block">รูปถ่าย <span className="text-red-500">*</span></span>
                  </div>
                )}
              </button>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <p className="text-xs text-gray-400 mt-2 text-center">กรุณาใช้รูปหน้าตรง เป็นทางการ เห็นใบหน้าชัดเจน</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">คำนำหน้า (ไทย)</label>
                <select value={form.prefixTh} onChange={(e) => updateForm("prefixTh", e.target.value)} className="input-field">
                  <option>นาย</option><option>นาง</option><option>นางสาว</option>
                </select>
              </div>
              <div>
                <label className="label">ชื่อ (ไทย) <span className="text-red-500">*</span></label>
                <input value={form.firstNameTh} onChange={(e) => updateForm("firstNameTh", e.target.value)} className="input-field" placeholder="ชื่อจริง" />
              </div>
              <div>
                <label className="label">นามสกุล (ไทย) <span className="text-red-500">*</span></label>
                <input value={form.lastNameTh} onChange={(e) => updateForm("lastNameTh", e.target.value)} className="input-field" placeholder="นามสกุล" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Prefix (EN)</label>
                <select value={form.prefixEn} onChange={(e) => updateForm("prefixEn", e.target.value)} className="input-field">
                  <option>Mr.</option><option>Mrs.</option><option>Ms.</option>
                </select>
              </div>
              <div>
                <label className="label">First Name (EN)</label>
                <input value={form.firstNameEn} onChange={(e) => updateForm("firstNameEn", e.target.value)} className="input-field" placeholder="First Name" />
              </div>
              <div>
                <label className="label">Last Name (EN)</label>
                <input value={form.lastNameEn} onChange={(e) => updateForm("lastNameEn", e.target.value)} className="input-field" placeholder="Last Name" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">ชื่อเล่น</label>
                <input value={form.nickname} onChange={(e) => updateForm("nickname", e.target.value)} className="input-field" placeholder="ชื่อเล่น" />
              </div>
              <div>
                <label className="label">สัญชาติ</label>
                <select value={form.nationality} onChange={(e) => updateForm("nationality", e.target.value)} className="input-field">
                  {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">เลขบัตรประจำตัวประชาชน</label>
                <input value={form.idCardNumber} onChange={(e) => updateForm("idCardNumber", e.target.value)} className="input-field" placeholder="x-xxxx-xxxxx-xx-x" maxLength={17} />
              </div>
              <div>
                <label className="label">วันเกิด <span className="text-red-500">*</span></label>
                <FlatpickrInput value={form.birthDate} onChange={(val) => updateForm("birthDate", val)} placeholder="เลือกวันเกิด" />
              </div>
              <div>
                <label className="label">อายุ</label>
                <input value={calcAge(form.birthDate)} readOnly className="input-field bg-gray-50 cursor-not-allowed" placeholder="คำนวณอัตโนมัติ" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">เพศ</label>
                <select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)} className="input-field">
                  <option>ชาย</option><option>หญิง</option><option>อื่น ๆ</option>
                </select>
              </div>
              <div>
                <label className="label">สถานภาพ</label>
                <select value={form.maritalStatus} onChange={(e) => updateForm("maritalStatus", e.target.value)} className="input-field">
                  <option>โสด</option><option>สมรส</option><option>หม้าย</option><option>หย่า</option>
                </select>
              </div>
              <div>
                <label className="label">สถานะทางทหาร</label>
                <select value={form.militaryStatus} onChange={(e) => updateForm("militaryStatus", e.target.value)} className="input-field">
                  <option>ได้รับการยกเว้น</option><option>ผ่านการเกณฑ์ทหาร</option><option>ยังไม่ได้เกณฑ์</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className="input-field" placeholder="0xx-xxx-xxxx" />
              </div>
              <div>
                <label className="label">อีเมล</label>
                <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className="input-field" placeholder="email@example.com" />
              </div>
              <div>
                <label className="label">Line ID</label>
                <input value={form.lineId} onChange={(e) => updateForm("lineId", e.target.value)} className="input-field" placeholder="Line ID" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Facebook</label>
                <input value={form.facebook} onChange={(e) => updateForm("facebook", e.target.value)} className="input-field" placeholder="ชื่อ Facebook หรือลิงก์" />
              </div>
              <div>
                <label className="label">Instagram</label>
                <input value={form.instagram} onChange={(e) => updateForm("instagram", e.target.value)} className="input-field" placeholder="@username" />
              </div>
              <div>
                <label className="label">TikTok</label>
                <input value={form.tiktok} onChange={(e) => updateForm("tiktok", e.target.value)} className="input-field" placeholder="@username" />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4 fade-in">
            <div>
              <label className="label">ที่อยู่ <span className="text-red-500">*</span></label>
              <input value={form.addressLine} onChange={(e) => updateForm("addressLine", e.target.value)} className="input-field" placeholder="บ้านเลขที่ ซอย ถนน" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">แขวง / ตำบล <span className="text-red-500">*</span></label>
                <input value={form.subDistrict} onChange={(e) => updateForm("subDistrict", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">เขต / อำเภอ <span className="text-red-500">*</span></label>
                <input value={form.district} onChange={(e) => updateForm("district", e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">จังหวัด <span className="text-red-500">*</span></label>
                <input value={form.province} onChange={(e) => updateForm("province", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                <input value={form.postalCode} onChange={(e) => updateForm("postalCode", e.target.value)} className="input-field" maxLength={5} />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 fade-in">
            {form.educations.map((edu, idx) => (
              <div key={idx} className="card border border-gray-200 relative">
                {form.educations.length > 1 && (
                  <button type="button" onClick={() => removeEducation(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                <h4 className="text-sm font-semibold text-gray-500 mb-4">การศึกษาที่ {idx + 1}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">ระดับการศึกษา</label>
                    <select value={edu.level} onChange={(e) => updateEducation(idx, "level", e.target.value)} className="input-field">
                      {EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">สถาบัน <span className="text-red-500">*</span></label>
                    <input value={edu.institution} onChange={(e) => updateEducation(idx, "institution", e.target.value)} className="input-field" placeholder="ชื่อสถาบัน" />
                  </div>
                  <div>
                    <label className="label">สาขาวิชา</label>
                    <input value={edu.field} onChange={(e) => updateEducation(idx, "field", e.target.value)} className="input-field" placeholder="สาขา" />
                  </div>
                  <div>
                    <label className="label">ปีที่จบ (พ.ศ.)</label>
                    <input value={edu.graduationYear} onChange={(e) => updateEducation(idx, "graduationYear", e.target.value)} className="input-field" placeholder="25xx" maxLength={4} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addEducation} className="btn-secondary w-full">+ เพิ่มการศึกษา</button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 fade-in">
            <div className="flex items-center gap-4 mb-2">
              <Toggle checked={form.hasWorkExperience} onChange={(val) => updateForm("hasWorkExperience", val)} label="มีประสบการณ์ทำงาน" />
            </div>

            {form.hasWorkExperience && (
              <>
                {form.workHistories.map((wh, idx) => (
                  <div key={idx} className="card border border-gray-200 relative">
                    <button type="button" onClick={() => removeWorkHistory(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h4 className="text-sm font-semibold text-gray-500 mb-4">ประสบการณ์ที่ {idx + 1}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">บริษัท / องค์กร</label>
                        <input value={wh.company} onChange={(e) => updateWorkHistory(idx, "company", e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">ตำแหน่ง</label>
                        <input value={wh.position} onChange={(e) => updateWorkHistory(idx, "position", e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label className="label">วันที่เริ่มงาน</label>
                        <FlatpickrInput value={wh.startDate} onChange={(val) => updateWorkHistory(idx, "startDate", val)} />
                      </div>
                      <div>
                        <label className="label">วันที่สิ้นสุด</label>
                        <FlatpickrInput value={wh.endDate} onChange={(val) => updateWorkHistory(idx, "endDate", val)} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="label">รายละเอียดงาน</label>
                      <textarea value={wh.description} onChange={(e) => updateWorkHistory(idx, "description", e.target.value)} className="input-field" rows={3} placeholder="อธิบายลักษณะงานที่ทำ" />
                    </div>
                    <div className="mt-4">
                      <label className="label">เหตุผลที่เปลี่ยนงาน</label>
                      <input value={wh.reasonForLeaving} onChange={(e) => updateWorkHistory(idx, "reasonForLeaving", e.target.value)} className="input-field" placeholder="เช่น ต้องการความก้าวหน้า, สัญญาหมดอายุ" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addWorkHistory} className="btn-secondary w-full">+ เพิ่มประสบการณ์</button>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 fade-in">
            <div>
              <label className="label">ภาษาที่ใช้ได้</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      form.languages.includes(lang)
                        ? "bg-brand-red text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {form.languages.length > 0 && (
              <div className="space-y-3">
                <label className="label">ระดับความสามารถ</label>
                {form.languages.map((lang) => (
                  <div key={lang} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-16">{lang}</span>
                    <select
                      value={form.languageLevels[lang] || "พอใช้"}
                      onChange={(e) => {
                        const levels = { ...form.languageLevels, [lang]: e.target.value };
                        updateForm("languageLevels", levels);
                      }}
                      className="input-field flex-1"
                    >
                      <option>พื้นฐาน</option><option>พอใช้</option><option>ดี</option><option>ดีมาก</option><option>เชี่ยวชาญ</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="label">ความสามารถพิเศษ</label>
              <textarea value={form.skills} onChange={(e) => updateForm("skills", e.target.value)} className="input-field" rows={3} placeholder="เช่น ทำอาหาร, ช่างไฟ, เชื่อมโลหะ, ขับรถ" />
            </div>
            <div>
              <label className="label">ทักษะคอมพิวเตอร์</label>
              <textarea value={form.computerSkills} onChange={(e) => updateForm("computerSkills", e.target.value)} className="input-field" rows={2} placeholder="เช่น Microsoft Office, AutoCAD, Photoshop" />
            </div>
            <div>
              <label className="label">ทักษะด้าน IT</label>
              <textarea value={form.itSkills} onChange={(e) => updateForm("itSkills", e.target.value)} className="input-field" rows={2} placeholder="เช่น Networking, Server, Database, Web Development" />
            </div>
            <div>
              <label className="label">ทักษะด้าน AI</label>
              <textarea value={form.aiSkills} onChange={(e) => updateForm("aiSkills", e.target.value)} className="input-field" rows={2} placeholder="เช่น ChatGPT, Midjourney, Python ML, Data Analysis" />
            </div>
            <div className="flex items-center gap-4">
              <Toggle checked={form.drivingLicense} onChange={(val) => updateForm("drivingLicense", val)} label="มีใบขับขี่" />
            </div>
            {form.drivingLicense && (
              <div>
                <label className="label">ประเภทยานพาหนะ</label>
                <input value={form.vehicleTypes} onChange={(e) => updateForm("vehicleTypes", e.target.value)} className="input-field" placeholder="เช่น รถยนต์, รถจักรยานยนต์" />
              </div>
            )}
            <div>
              <label className="label">ทัศนคติในการทำงาน</label>
              <textarea value={form.workAttitude} onChange={(e) => updateForm("workAttitude", e.target.value)} className="input-field" rows={3} placeholder="บอกเล่าทัศนคติและแนวคิดในการทำงานของคุณ" />
            </div>
            <div>
              <label className="label">จุดแข็งและจุดอ่อน</label>
              <textarea value={form.strengthWeakness} onChange={(e) => updateForm("strengthWeakness", e.target.value)} className="input-field" rows={3} placeholder="บอกจุดแข็งและจุดอ่อนของคุณ" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">เงินเดือนที่คาดหวัง (บาท)</label>
                <input value={form.expectedSalary} onChange={(e) => updateForm("expectedSalary", e.target.value)} className="input-field" placeholder="เช่น 25,000" />
              </div>
              <div>
                <label className="label">วันที่สามารถเริ่มงานได้</label>
                <FlatpickrInput value={form.availableStartDate} onChange={(val) => updateForm("availableStartDate", val)} placeholder="เลือกวันที่" />
              </div>
            </div>
            <div>
              <label className="label">ทราบข่าวการรับสมัครจากที่ไหน</label>
              <input value={form.howDidYouKnow} onChange={(e) => updateForm("howDidYouKnow", e.target.value)} className="input-field" placeholder="เช่น Facebook, เพื่อนแนะนำ, เว็บไซต์" />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 fade-in">
            {form.emergencyContacts.map((ec, idx) => (
              <div key={idx} className="card border border-gray-200 relative">
                {form.emergencyContacts.length > 1 && (
                  <button type="button" onClick={() => removeEmergencyContact(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                <h4 className="text-sm font-semibold text-gray-500 mb-4">บุคคลอ้างอิงที่ {idx + 1}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                    <input value={ec.name} onChange={(e) => updateEmergencyContact(idx, "name", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">ความสัมพันธ์</label>
                    <input value={ec.relationship} onChange={(e) => updateEmergencyContact(idx, "relationship", e.target.value)} className="input-field" placeholder="เช่น บิดา, มารดา" />
                  </div>
                  <div>
                    <label className="label">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                    <input value={ec.phone} onChange={(e) => updateEmergencyContact(idx, "phone", e.target.value)} className="input-field" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addEmergencyContact} className="btn-secondary w-full">+ เพิ่มบุคคลอ้างอิง</button>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 fade-in">
            <div>
              <label className="label">แนบเรซูเม่ (PDF หรือ Word)</label>
              <div
                onClick={() => resumeRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-red hover:bg-red-50/30 transition-all duration-200"
              >
                {resumeFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{resumeFile.name}</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-500 text-sm">คลิกเพื่ออัพโหลดเรซูเม่</p>
                    <p className="text-gray-400 text-xs mt-1">PDF, DOC, DOCX (สูงสุด 10MB)</p>
                  </>
                )}
              </div>
              <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} className="hidden" />
            </div>

            <div>
              <label className="label">สำเนาบัตรประชาชน <span className="text-red-500">*</span></label>
              <div
                onClick={() => idCardRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-red hover:bg-red-50/30 transition-all duration-200"
              >
                {idCardFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{idCardFile.name}</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    </svg>
                    <p className="text-gray-500 text-sm">คลิกเพื่ออัพโหลดสำเนาบัตรประชาชน</p>
                    <p className="text-gray-400 text-xs mt-1">PDF, JPG, PNG (สูงสุด 10MB)</p>
                  </>
                )}
              </div>
              <input ref={idCardRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleIdCardChange} className="hidden" />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4 fade-in">
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-semibold mb-1">กรุณากรอกข้อมูลให้ครบก่อนส่ง:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => goToStep(err.step)} className="underline hover:text-red-900 transition-colors">
                        {err.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="card bg-brand-light border-brand-red/20">
              <h3 className="font-bold text-brand-red mb-3">ตรวจสอบข้อมูลก่อนส่ง</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-600">ชื่อ:</span> {form.prefixTh}{form.firstNameTh} {form.lastNameTh}</p>
                <p><span className="font-medium text-gray-600">Name:</span> {form.prefixEn} {form.firstNameEn} {form.lastNameEn}</p>
                <p><span className="font-medium text-gray-600">สัญชาติ:</span> {form.nationality}</p>
                <p><span className="font-medium text-gray-600">เบอร์โทร:</span> {form.phone}</p>
                <p><span className="font-medium text-gray-600">อีเมล:</span> {form.email}</p>
                <p><span className="font-medium text-gray-600">ที่อยู่:</span> {form.addressLine} {form.subDistrict} {form.district} {form.province} {form.postalCode}</p>
                <p><span className="font-medium text-gray-600">การศึกษา:</span> {form.educations.length} รายการ</p>
                <p><span className="font-medium text-gray-600">ประสบการณ์:</span> {form.hasWorkExperience ? form.workHistories.length + " รายการ" : "ไม่มี"}</p>
                <p><span className="font-medium text-gray-600">ภาษา:</span> {form.languages.join(", ")}</p>
                <p><span className="font-medium text-gray-600">เงินเดือนที่คาดหวัง:</span> {form.expectedSalary || "-"} บาท</p>
                <p><span className="font-medium text-gray-600">รูปถ่าย:</span> {photoFile ? "แนบแล้ว" : "ไม่ได้แนบ"}</p>
                <p><span className="font-medium text-gray-600">เรซูเม่:</span> {resumeFile ? resumeFile.name : "ไม่ได้แนบ"}</p>
                <p><span className="font-medium text-gray-600">สำเนาบัตรประชาชน:</span> {idCardFile ? idCardFile.name : "ไม่ได้แนบ"}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      {session && <InactivityGuard />}
      {saving && <SaveOverlay message="กำลังส่งใบสมัคร..." />}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 slide-up">
          <h1 className="text-3xl font-bold text-gray-900">สมัครงาน</h1>
          <p className="text-gray-500 mt-1">กรอกข้อมูลให้ครบถ้วนเพื่อสมัครงานกับ Matching Wealth</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {STEPS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToStep(i)}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                  i === step
                    ? "bg-brand-red text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-7 h-7 bg-brand-red text-white rounded-full flex items-center justify-center text-sm font-bold">
              {step + 1}
            </span>
            {STEPS[step]}
          </h2>
          {renderStepContent()}
        </div>

        <div className="flex justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-30"
          >
            ← ย้อนกลับ
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-primary">
              ถัดไป →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} className="btn-primary">
              ส่งใบสมัคร
            </button>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-brand-red" />
    </div>
  );
}
