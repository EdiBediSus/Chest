
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);
const views = ["surveyView", "successView", "adminLogin", "statsView"];

function show(id) {
  views.forEach(v => $(v).classList.toggle("hidden", v !== id));
}

let taps = 0, tapTimer;

document.addEventListener("click", e => {
  if (e.target.closest("button,input,textarea,select,label")) return;
  taps++;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => taps = 0, 1800);

  if (taps >= 7) {
    taps = 0;
    $("pinInput").value = "";
    $("pinStatus").textContent = "";
    show("adminLogin");
  }
});

let anonymousUser;

try {
  const credential = await signInAnonymously(auth);
  anonymousUser = credential.user;
} catch (error) {
  console.error(error);
  $("status").textContent = "Nu s-a putut conecta la Firebase. Verifică dacă Anonymous este activat în Authentication.";
  $("submitBtn").disabled = true;
}

$("surveyForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!anonymousUser) return;

  const formElement = e.currentTarget;
  const btn = $("submitBtn"), status = $("status");

  btn.disabled = true;
  btn.textContent = "Se trimit răspunsurile...";
  status.textContent = "";

  const form = new FormData(formElement);

  const payload = {
    age: $("age").value,
    q1: form.get("q1"),
    q2: form.getAll("q2"),
    q3: form.get("q3"),
    q4: form.get("q4"),
    q5: form.get("q5"),
    suggestion: $("suggestion").value.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "foodqr_survey_responses"), payload);
    formElement.reset();
    show("successView");
  } catch (error) {
    console.error(error);
    status.textContent = "Nu am putut salva răspunsurile. Verifică regulile Firestore și încearcă din nou.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Trimite răspunsurile";
  }
});

$("againBtn").onclick = () => show("surveyView");
$("backBtn").onclick = () => show("surveyView");

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function createStats(title, values) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    return `<section class="stat-block"><h3>${escapeHTML(title)}</h3><p>Nu există răspunsuri.</p></section>`;
  }

  const total = entries.reduce((sum, item) => sum + item[1], 0);

  return `
    <section class="stat-block">
      <h3>${escapeHTML(title)}</h3>
      ${entries.map(([label, count]) => {
        const percent = Math.round(count / total * 100);
        return `
          <div class="stat-row">
            <div class="stat-label">
              <span>${escapeHTML(label)}</span>
              <strong>${count} (${percent}%)</strong>
            </div>
            <div class="stat-track">
              <span style="width:${percent}%"></span>
            </div>
          </div>`;
      }).join("")}
    </section>`;
}

function countAnswers(responses, key) {
  const result = {};

  responses.forEach(response => {
    const value = response[key];

    if (Array.isArray(value)) {
      value.forEach(item => {
        const label = String(item || "Fără răspuns");
        result[label] = (result[label] || 0) + 1;
      });
    } else {
      const label = String(value || "Fără răspuns");
      result[label] = (result[label] || 0) + 1;
    }
  });

  return result;
}

async function loadStatistics() {
  const status = $("statsStatus");
  const content = $("statsContent");

  status.textContent = "Se încarcă statisticile...";
  content.innerHTML = "";

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "foodqr_survey_responses"),
        orderBy("createdAt", "desc")
      )
    );

    const responses = snapshot.docs.map(doc => doc.data());
    const total = responses.length;

    content.innerHTML = `
      <section class="stat-block">
        <h3>Total răspunsuri</h3>
        <div style="font-size:36px;font-weight:bold">${total}</div>
      </section>
    `;

    if (total === 0) {
      status.textContent = "Nu există încă răspunsuri.";
      return;
    }

    content.innerHTML += createStats("Vârsta participanților", countAnswers(responses, "age"));
    content.innerHTML += createStats("Întrebarea 1", countAnswers(responses, "q1"));
    content.innerHTML += createStats("Întrebarea 2", countAnswers(responses, "q2"));
    content.innerHTML += createStats("Întrebarea 3", countAnswers(responses, "q3"));
    content.innerHTML += createStats("Întrebarea 4", countAnswers(responses, "q4"));
    content.innerHTML += createStats("Întrebarea 5", countAnswers(responses, "q5"));

    const suggestions = responses
      .map(r => String(r.suggestion || "").trim())
      .filter(Boolean);

    content.innerHTML += `
      <section class="stat-block">
        <h3>Sugestii (${suggestions.length})</h3>
        ${
          suggestions.length
            ? `<ul>${suggestions.map(s => `<li>${escapeHTML(s)}</li>`).join("")}</ul>`
            : "<p>Nu există sugestii.</p>"
        }
      </section>
    `;

    status.textContent = `Au fost încărcate ${total} răspunsuri.`;

  } catch (error) {
    console.error(error);
    status.textContent = "Eroare la încărcarea statisticilor. Verifică regulile Firestore.";
    content.innerHTML = "<p>Firebase nu permite citirea răspunsurilor.</p>";
  }
}

$("pinForm").addEventListener("submit", async e => {
  e.preventDefault();

  if ($("pinInput").value !== "7002") {
    $("pinStatus").textContent = "PIN incorect.";
    return;
  }

  $("pinStatus").textContent = "";
  show("statsView");
  await loadStatistics();
});

$("closeStats").onclick = () => show("surveyView");
