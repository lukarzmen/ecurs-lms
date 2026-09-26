// Minimal admin gate for internal platform configuration (e.g. commission rate).
// Configure via ADMIN_EMAILS env var: comma-separated list of Clerk account emails.
// There is no dedicated admin role in the DB yet - this is intentionally simple and
// can be swapped for a real Role/permission check later without changing call sites.
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allowList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowList.includes(email.trim().toLowerCase());
}
