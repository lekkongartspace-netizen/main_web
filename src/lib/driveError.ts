// Turn raw Google OAuth/Drive errors into a clear Thai message for the UI.
// (Kept dependency-free so route handlers can import it without pulling googleapis.)
export function driveErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (/invalid_grant/i.test(raw)) {
    return "เชื่อมต่อ Google Drive ไม่ได้: Refresh Token หมดอายุหรือถูกเพิกถอน — กรุณาออก GOOGLE_REFRESH_TOKEN ใหม่แล้วอัปเดตค่าในระบบ (ดูวิธีใน README หัวข้อ 'ต่ออายุ Google Refresh Token')";
  }
  if (/invalid_client|unauthorized_client/i.test(raw)) {
    return "เชื่อมต่อ Google Drive ไม่ได้: GOOGLE_CLIENT_ID หรือ GOOGLE_CLIENT_SECRET ไม่ถูกต้อง";
  }
  if (/insufficient.*permission|insufficientPermissions|forbidden/i.test(raw)) {
    return "เชื่อมต่อ Google Drive ไม่ได้: บัญชีไม่มีสิทธิ์เข้าถึงโฟลเดอร์ หรือ scope ไม่ครบ (ต้องมี scope drive)";
  }
  return "เชื่อมต่อ Google Drive ไม่ได้: " + raw;
}
