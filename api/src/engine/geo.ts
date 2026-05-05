import geoip from "geoip-lite";

export function lookupCountry(ip: string): string | null {
  if (!ip) return null;
  const r = geoip.lookup(ip);
  return r?.country ?? null;
}
