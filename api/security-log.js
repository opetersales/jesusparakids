const WINDOW_MS = 60 * 1000;
const MAX_EVENTS_PER_WINDOW = 120;
const buckets = new Map();

module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();
  const bucket = buckets.get(ip) || { count: 0, start: now };
  if (now - bucket.start > WINDOW_MS) {
    bucket.count = 0;
    bucket.start = now;
  }
  bucket.count += 1;
  buckets.set(ip, bucket);

  if (bucket.count > MAX_EVENTS_PER_WINDOW) {
    res.status(429).json({ ok: false });
    return;
  }

  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const ua = req.headers["user-agent"] || "unknown";
  console.warn("[security-log]", { ip, ua, body });
  res.status(204).end();
};
