const API_BASE = (window.RAIL_API_BASE || "").replace(/\/$/, "");
const $ = (id) => document.getElementById(id);
const input = $("trainNo");
const button = $("trackBtn");
const message = $("message");
const result = $("result");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = `message${isError ? " error" : ""}`;
}
function hideMessage() { message.className = "message hidden"; }
function pick(obj, paths, fallback = "—") {
  for (const path of paths) {
    const value = path.split(".").reduce((a, k) => a && a[k], obj);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}
function stationName(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.name || value.stationName || value.code || "—";
  return "—";
}
async function trackTrain() {
  const number = input.value.trim();
  if (!/^\d{4,6}$/.test(number)) {
    result.classList.add("hidden");
    showMessage("Please enter a valid 4–6 digit train number.", true);
    input.focus();
    return;
  }
  hideMessage();
  result.classList.add("hidden");
  button.disabled = true;
  button.textContent = "Checking…";
  try {
    const response = await fetch(`${API_BASE}/api/trains/${encodeURIComponent(number)}/live`);
    const payload = await response.json();
    if (!response.ok || payload.success === false) throw new Error(payload.error || "Live status could not be fetched.");
    const d = payload.data || payload;
    const trainName = pick(d, ["trainName", "name", "train.name"], `Train ${number}`);
    const status = pick(d, ["status", "state", "runningStatus"], "Status unavailable");
    const delay = pick(d, ["delayMinutes", "delay", "lateBy"], null);
    const current = pick(d, ["currentLocation.stationName", "currentStation.name", "currentStation", "currentLocation.name"], "Not reported");
    const previous = pick(d, ["previousStation.name", "previousStation", "lastStation.name", "lastStation"], current);
    const next = pick(d, ["nextStation.name", "nextStation", "nextHaltingStation.name", "nextHaltingStation"], "Not reported");
    const updated = pick(d, ["lastUpdatedAt", "updatedAt", "meta.timestamp"], "Not provided");
    $("trainTitle").textContent = `${number} – ${trainName}`;
    $("runStatus").textContent = String(status).replaceAll("-", " ");
    $("delay").textContent = delay === null ? "Not reported" : (typeof delay === "number" ? `${delay} min` : String(delay));
    $("updated").textContent = updated === "Not provided" ? updated : new Date(updated).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" });
    $("previousStation").textContent = stationName(previous);
    $("nextStation").textContent = stationName(next);
    $("statusChip").textContent = String(status).toUpperCase();
    $("sourceNote").textContent = `Current reported location: ${stationName(current)}. Data source: ${payload.meta?.source || "provider"}. Confirm important changes with official railway enquiries.`;
    result.classList.remove("hidden");
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again.", true);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Track train <span>→</span>';
  }
}
button.addEventListener("click", trackTrain);
input.addEventListener("keydown", e => { if (e.key === "Enter") trackTrain(); });
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}