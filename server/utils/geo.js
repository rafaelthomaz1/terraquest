import geoip from 'geoip-lite';

export function getClientIp(req) {
  return req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
}

export function lookupGeo(ip) {
  const geo = geoip.lookup(ip);
  if (!geo) return { country: null, city: null };
  return { country: geo.country || null, city: geo.city || null };
}
