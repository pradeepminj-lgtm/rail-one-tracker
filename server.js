const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.RAILRADAR_API_KEY;
const API_BASE = "https://api.railradar.in/v1";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use("/api/", rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.use(express.static("public"));

function validTrainNumber(value) {
  return /^\d{4,6}$/.test(String(value || ""));
}
function validStationCode(value) {
  return /^[A-Z0-9]{2,6}$/i.test(String(value || ""));
}
async function railRequest(path) {
  if (!API_KEY) {
    const error = new Error("Live data is not connected yet. Add your RailRadar API key to the server environment.");
    error.status = 503;
    throw error;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
    signal: AbortSignal.timeout(12000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const error = new Error(body?.error?.message || `Rail data provider returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}
function asyncRoute(handler) {
  return (req, res) => handler(req, res).catch(err => {
    res.status(err.status || 502).json({ success: false, error: err.message || "Unable to fetch railway data" });
  });
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, providerConfigured: Boolean(API_KEY), app: "Rail One Tracker" });
});

app.get("/api/trains/:number/live", asyncRoute(async (req, res) => {
  if (!validTrainNumber(req.params.number)) return res.status(400).json({ success: false, error: "Enter a valid train number." });
  const date = req.query.date;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ success: false, error: "Date must be YYYY-MM-DD." });
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  res.json(await railRequest(`/trains/${req.params.number}/live${suffix}`));
}));

app.get("/api/trains/:number", asyncRoute(async (req, res) => {
  if (!validTrainNumber(req.params.number)) return res.status(400).json({ success: false, error: "Enter a valid train number." });
  res.json(await railRequest(`/trains/${req.params.number}`));
}));

app.get("/api/trains/between/:from/:to", asyncRoute(async (req, res) => {
  if (!validStationCode(req.params.from) || !validStationCode(req.params.to)) return res.status(400).json({ success: false, error: "Enter valid station codes." });
  res.json(await railRequest(`/trains/between/${req.params.from.toUpperCase()}/${req.params.to.toUpperCase()}`));
}));

app.get("/api/stations/:code/trains", asyncRoute(async (req, res) => {
  if (!validStationCode(req.params.code)) return res.status(400).json({ success: false, error: "Enter a valid station code." });
  res.json(await railRequest(`/stations/${req.params.code.toUpperCase()}/trains`));
}));

app.use((req, res) => res.sendFile(require("path").join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Rail One Tracker server running on port ${PORT}`));
