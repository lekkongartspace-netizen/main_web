// Per-PIN access control. Each PIN carries a set of these permissions; there is
// no longer an all-or-nothing admin/user role. "managePins" is the effective
// admin capability (only holders may edit PINs / grant permissions).

export type Permission =
  | "managePins"
  | "viewApplications"
  | "viewHandover"
  | "createHandover"
  | "viewClientLinks";

// Display order + Thai labels used by the PIN editor and any permission UI.
export const PERMISSIONS: { key: Permission; label: string; desc: string }[] = [
  { key: "managePins", label: "จัดการ PIN", desc: "เพิ่ม / ลบ / แก้ไข PIN และกำหนดสิทธิ์ผู้ใช้" },
  { key: "viewApplications", label: "ดูใบสมัคร", desc: "ดูและแก้ไขใบสมัครงาน" },
  { key: "viewHandover", label: "ดูเอกสารส่งมอบงาน", desc: "เปิดดู / พิมพ์เอกสารส่งมอบงาน" },
  { key: "createHandover", label: "สร้างเอกสารส่งมอบงาน", desc: "สร้าง / แก้ไข / ลบเอกสารส่งมอบงาน" },
  { key: "viewClientLinks", label: "เห็นลิงก์ตรวจงานของลูกค้า", desc: "คัดลอกลิงก์ตรวจรับงานสำหรับส่งให้ลูกค้า" },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSIONS.map((p) => p.key);

// Session payload carried in the signed cookie and passed to client components.
export interface SessionInfo {
  name: string;
  perms: Permission[];
}

// Legacy PIN entries were saved with a role only. Migrate on read:
// admin → every permission, user → none.
export function permissionsFromLegacyRole(role?: unknown): Permission[] {
  return role === "admin" ? [...ALL_PERMISSIONS] : [];
}

// Keep only recognised permissions, deduped and in canonical display order.
export function sanitizePermissions(input: unknown): Permission[] {
  const set = new Set<Permission>();
  if (Array.isArray(input)) {
    for (const p of input) {
      if (ALL_PERMISSIONS.includes(p as Permission)) set.add(p as Permission);
    }
  }
  return ALL_PERMISSIONS.filter((p) => set.has(p));
}

// Resolve a stored PIN entry (new `permissions` array, or legacy `role`) to its
// effective permission list.
export function resolvePermissions(entry: { permissions?: unknown; role?: unknown }): Permission[] {
  if (Array.isArray(entry.permissions)) return sanitizePermissions(entry.permissions);
  return permissionsFromLegacyRole(entry.role);
}

export function hasPermission(session: SessionInfo | null | undefined, perm: Permission): boolean {
  return !!session && session.perms.includes(perm);
}
