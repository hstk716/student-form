import { db, collection, addDoc } from "./config.js";

const questions = document.querySelectorAll(".question");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
const progress = document.getElementById("progress");
let currentStep = 0;

// --- TRACKING VARS ---
let userLocation = null;
let userIP = "Fetching...";
let deviceType = navigator.userAgent; 
let batteryLevel = "Unknown"; 
let connectionType = "Unknown"; 

// 1. NETWORK INFO (WiFi/4G)
if (navigator.connection) {
    const conn = navigator.connection;
    connectionType = `${conn.effectiveType || ''} ${conn.type || ''}`.trim().toUpperCase();
}

// 2. AUTO-SAVE (DRAFT MODE) - Runs every 5 seconds
setInterval(() => {
    const formData = {};
    document.querySelectorAll("input").forEach(input => {
        formData[input.id] = input.value;
    });
    localStorage.setItem("draft_form", JSON.stringify(formData));
}, 5000);

// 3. RESTORE DRAFT ON LOAD
window.addEventListener('DOMContentLoaded', () => {
    const saved = JSON.parse(localStorage.getItem("draft_form"));
    if (saved) {
        document.querySelectorAll("input").forEach(input => {
            if (saved[input.id]) input.value = saved[input.id];
        });
    }
});

// 4. IP FETCH
fetch('https://ipapi.co/json/')
  .then(res => res.json())
  .then(data => {
    userIP = `${data.ip} (${data.city})`;
  })
  .catch(err => userIP = "Failed IP");

// 5. BATTERY
if(navigator.getBattery) {
    navigator.getBattery().then(b => batteryLevel = Math.round(b.level * 100) + "%");
}

// 6. LOCATION REQUEST
function requestLoc() {
    if (!navigator.geolocation) { userLocation = "Not Supported"; return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { 
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }; 
        if(document.getElementById("locMsg")) document.getElementById("locMsg").style.display = "none";
      },
      (err) => { 
        userLocation = "Denied"; 
        if(document.getElementById("locMsg")) document.getElementById("locMsg").style.display = "block";
      },
      { enableHighAccuracy: true }
    );
}
requestLoc();

updateUI();

// SECURITY: Disable Right Click
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', (e) => {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'u')) {
    e.preventDefault(); return false;
  }
  if (e.key === "Enter") { e.preventDefault(); nextBtn.click(); }
});

function showQuestion(index) {
  questions.forEach(q => { q.classList.remove("active"); q.style.display = "none"; });
  const currentQ = questions[index];
  currentQ.style.display = "block";
  setTimeout(() => currentQ.classList.add("active"), 10);
  const input = currentQ.querySelector("input");
  if(input) input.focus();
}

function updateUI() {
  progress.style.width = `${((currentStep + 1) / questions.length) * 100}%`;
  backBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";
  nextBtn.innerHTML = (currentStep === questions.length - 1) ? "Start 🚀" : "Next ➔";
}

nextBtn.addEventListener("click", async () => {
  const currentQ = questions[currentStep];
  const input = currentQ.querySelector("input");
  if (!input.value.trim()) { input.style.border = "2px solid #ff4444"; setTimeout(() => input.style.border = "2px solid transparent", 500); return; }

  if (input.id === "contact" && !/^\d{10}$/.test(input.value)) { alert("Phone needs 10 digits"); return; }
  if (input.id === "section") { 
      const val = input.value.toUpperCase(); 
      if (!['A','B','C','D','E'].includes(val)) { alert("Section A-E only"); return; } 
      input.value = val; 
  }
  if (input.id === "age") { 
      const age = parseInt(input.value); 
      if (age < 2 || age > 19) { alert("Age 2-19 only"); return; } 
  }

  // FORCE LOCATION CHECK
  if (currentStep === questions.length - 1) {
    if(!userLocation || userLocation === "Denied") {
        alert("⚠️ LOCATION REQUIRED\n\nPlease check your browser address bar (Lock icon) and allow Location.");
        requestLoc();
        return;
    }
    nextBtn.textContent = "Loading...";
    await saveDataAndRedirect();
    return;
  }
  currentStep++; showQuestion(currentStep); updateUI();
});

backBtn.addEventListener("click", () => { if (currentStep > 0) { currentStep--; showQuestion(currentStep); updateUI(); } });

async function saveDataAndRedirect() {
  const countryCode = document.getElementById("countryCode").value;
  const rawPhone = document.getElementById("contact").value;
  
  const data = {
    parentName: document.getElementById("parentName").value,
    email: document.getElementById("email").value,
    contact: `${countryCode} ${rawPhone}`,
    studentName: document.getElementById("studentName").value,
    grade: document.getElementById("grade").value,
    section: document.getElementById("section").value,
    age: parseInt(document.getElementById("age").value),
    date: new Date().toLocaleDateString(),
    timestamp: Date.now(),
    
    // TRACKING DATA
    location: userLocation,
    ipAddress: userIP,
    deviceInfo: deviceType,
    battery: batteryLevel,
    connection: connectionType
  };

  try {
    const docRef = await addDoc(collection(db, "students"), data);
    localStorage.setItem("current_student_id", docRef.id);
    localStorage.setItem("student_data", JSON.stringify(data));
    
    // CLEAR DRAFT ON SUCCESS
    localStorage.removeItem("draft_form");

    if (data.age > 10) window.location.href = "story.html";
    else window.location.href = "drawing.html";
  } catch (e) {
    alert("Error: " + e.message); nextBtn.textContent = "Try Again";
  }
}

document.getElementById("themeToggle").onclick = () => document.body.classList.toggle("light");

document.getElementById("adminBtn").onclick = () => {
  const u = prompt("Username:");
  if(btoa(u) === "YnZtZ2xvYmFscGVydW5ndWRp") {
    const p = prompt("Password:");
    if(btoa(p) === "OTAyMTA=") window.location.href = "admin.html";
    else alert("Access Denied");
  } else if (u) alert("Access Denied");
};