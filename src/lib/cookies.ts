// Simple cookie utilities for client-side preferences

const COOKIE_NAME_3D = "bitmap-3d-enabled";

/**
 * Get the 3D preference from cookie
 * Returns true if 3D is enabled, false otherwise (default)
 */
export function get3DPreference(): boolean {
  if (typeof document === "undefined") return false;
  
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME_3D}=([^;]*)`));
  return match ? match[1] === "1" : false;
}

/**
 * Set the 3D preference cookie
 * @param enabled - whether 3D is enabled
 * @param days - cookie expiration in days (default: 365)
 */
export function set3DPreference(enabled: boolean, days = 365): void {
  if (typeof document === "undefined") return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${COOKIE_NAME_3D}=${enabled ? "1" : "0"};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}
