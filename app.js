const API = "/api";
let token = localStorage.getItem("saa_token") || "";
let records = [];
const $ = (id) => document.getElementById(id);
const authSection = $("authSection"), dashboard = $("dashboard");

function message(id, text, isError=false) {
  const el = $(id); el.textContent = text; el.classList.toggle("error", isError);
}
async function api(url, options={}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(API + url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function showTab(tab) {
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  $("loginForm").classList.toggle("hidden", tab !== "login");
  $("registerForm").classList.toggle("hidden", tab !== "register");
  message("authMessage", "");
}
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

$("registerForm").addEventListener("submit", async e => {
  e.preventDefault(); message("authMessage", "Creating account...");
  try {
    const data = await api("/register", { method:"POST", body:JSON.stringify({name:$("regName").value,email:$("regEmail").value,password:$("regPassword").value}) });
    message("authMessage", data.message); $("registerForm").reset(); showTab("login");
    message("authMessage", data.message);
  } catch(err) { message("authMessage", err.message, true); }
});
$("loginForm").addEventListener("submit", async e => {
  e.preventDefault(); message("authMessage", "Logging in...");
  try {
    const data = await api("/login", { method:"POST", body:JSON.stringify({email:$("loginEmail").value,password:$("loginPassword").value}) });
    token = data.token; localStorage.setItem("saa_token", token); await loadDashboard();
  } catch(err) { message("authMessage", err.message, true); }
});
$("logoutBtn").addEventListener("click", logout);
function logout() {
  token = ""; records = []; localStorage.removeItem("saa_token");
  dashboard.classList.add("hidden"); authSection.classList.remove("hidden"); $("logoutBtn").classList.add("hidden");
  $("detailPanel").classList.add("hidden"); showTab("login");
}
async function loadDashboard() {
  try {
    const [me, attendance] = await Promise.all([api("/me"), api("/attendance")]);
    $("userName").textContent = me.user.name.split(" ")[0];
    records = attendance.records; authSection.classList.add("hidden"); dashboard.classList.remove("hidden"); $("logoutBtn").classList.remove("hidden");
    $("today").textContent = new Date().toLocaleDateString(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    $("attendanceDate").value = new Date().toISOString().slice(0,10);
    renderRecords();
  } catch(err) { logout(); message("authMessage", err.message, true); }
}
function renderRecords() {
  const present = records.filter(r => r.status === "Present").length;
  const absent = records.length - present;
  $("totalCount").textContent = records.length; $("presentCount").textContent = present; $("absentCount").textContent = absent;
  $("rateCount").textContent = records.length ? Math.round(present / records.length * 100) + "%" : "0%";
  const term = $("searchInput").value.toLowerCase();
  const filtered = records.filter(r => [r.studentName,r.studentId,r.subject].join(" ").toLowerCase().includes(term));
  $("recordsBody").innerHTML = filtered.length ? filtered.map(r => `
    <tr><td><b>${escapeHtml(r.studentName)}</b><br><small>${escapeHtml(r.studentId)}</small></td>
    <td>${escapeHtml(r.subject)}</td><td>${new Date(r.date).toLocaleDateString()}</td>
    <td><span class="status ${r.status.toLowerCase()}">${r.status}</span></td>
    <td><button class="view-link" data-id="${r._id}">View</button></td></tr>`).join("") : '<tr><td colspan="5" class="empty">No matching attendance records.</td></tr>';
  document.querySelectorAll(".view-link").forEach(b => b.addEventListener("click", () => showDetails(b.dataset.id)));
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
$("searchInput").addEventListener("input", renderRecords);
$("attendanceForm").addEventListener("submit", async e => {
  e.preventDefault(); message("recordMessage", "Saving...");
  const payload = {studentName:$("studentName").value,studentId:$("studentId").value,subject:$("subject").value,date:$("attendanceDate").value,status:$("status").value,notes:$("notes").value};
  try {
    await api("/attendance", {method:"POST",body:JSON.stringify(payload)});
    $("attendanceForm").reset(); $("attendanceDate").value = new Date().toISOString().slice(0,10);
    message("recordMessage", "Attendance saved successfully."); const data = await api("/attendance"); records = data.records; renderRecords();
  } catch(err) { message("recordMessage", err.message, true); }
});
async function showDetails(id) {
  try {
    const data = await api("/attendance/" + encodeURIComponent(id)); const r = data.record;
    $("detailContent").innerHTML = `<div class="detail-grid">
      <div class="detail-item"><small>Student name</small><strong>${escapeHtml(r.studentName)}</strong></div>
      <div class="detail-item"><small>Student ID</small><strong>${escapeHtml(r.studentId)}</strong></div>
      <div class="detail-item"><small>Subject</small><strong>${escapeHtml(r.subject)}</strong></div>
      <div class="detail-item"><small>Date</small><strong>${new Date(r.date).toLocaleDateString()}</strong></div>
      <div class="detail-item"><small>Status</small><strong>${escapeHtml(r.status)}</strong></div>
      <div class="detail-item"><small>Notes</small><strong>${escapeHtml(r.notes || "—")}</strong></div>
    </div>`;
    $("detailPanel").classList.remove("hidden"); $("detailPanel").scrollIntoView({behavior:"smooth"});
  } catch(err) { alert(err.message); }
}
$("closeDetail").addEventListener("click", () => $("detailPanel").classList.add("hidden"));
if (token) loadDashboard();
