import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);
const views = ["surveyView","successView","adminLogin","statsView"];
function show(id){ views.forEach(v => $(v).classList.toggle("hidden",v!==id)); }
let taps = 0, tapTimer;
document.addEventListener("click", e => {
  if (e.target.closest("button,input,textarea,select,label")) return;
  taps++;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(()=>taps=0,1800);
  if(taps>=7){ taps=0; $("pinInput").value=""; $("pinStatus").textContent=""; show("adminLogin"); }
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
  if(!anonymousUser) return;
  const btn=$("submitBtn"), status=$("status");
  btn.disabled=true; btn.textContent="Se trimit răspunsurile..."; status.textContent="";
  const form=new FormData(e.currentTarget);
  const payload={
    age:$("age").value,
    q1:form.get("q1"),
    q2:form.getAll("q2"),
    q3:form.get("q3"),
    q4:form.get("q4"),
    q5:form.get("q5"),
    suggestion:$("suggestion").value.trim(),
    createdAt:new Date().toISOString()
  };
  try{
    await addDoc(collection(db,"foodqr_survey_responses"),payload);
    e.currentTarget.reset(); show("successView");
  }catch(error){
    console.error(error);
    status.textContent="Nu am putut salva răspunsurile. Verifică regulile Firestore și încearcă din nou.";
  }finally{btn.disabled=false;btn.textContent="Trimite răspunsurile";}
});

$("againBtn").onclick=()=>show("surveyView");
$("backBtn").onclick=()=>show("surveyView");
$("pinForm").addEventListener("submit", async e=>{
  e.preventDefault();
  if($("pinInput").value!=="7002"){ $("pinStatus").textContent="PIN incorect."; return; }
  $("pinStatus").textContent="";
  $("statsStatus").textContent="Zona de statistici necesită configurarea accesului administrator securizat.";
  $("statsContent").innerHTML="<p>Nu am activat încă citirea răspunsurilor din browser, pentru a nu expune datele tuturor vizitatorilor. PIN-ul introdus în codul public nu poate proteja singur statisticile.</p><p>Următorul pas este conectarea unui endpoint securizat pentru administrator.</p>";
  show("statsView");
});
$("closeStats").onclick=()=>show("surveyView");
