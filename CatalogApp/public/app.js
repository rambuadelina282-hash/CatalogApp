let user = null; let selectedGrade = null;

// FOARTE IMPORTANT PENTRU DEPLOY INTERNET: Conectarea pur si simplu public
const API = '/api';

const subiecteCatalog =['Limba Română', 'Limba Rusă', 'L. Engleză', 'Matematică', 'Fizică', 'Chimia', 'Biologia', 'Informatică', 'Geografia', 'Istoria'];
let isRegistering = false; let currentTab = 'noteView';

function toggleAuthMode() {
    isRegistering = !isRegistering;
    document.getElementById('nameGroup').style.display = isRegistering ? 'block' : 'none';
    document.getElementById('roleGroup').style.display = isRegistering ? 'block' : 'none';
    
    // Vizual
    document.getElementById('authTitle').innerText = isRegistering ? 'Înregistrare' : 'Agenda Electronică';
    document.getElementById('authSubtitle').innerText = isRegistering ? 'Creați un cont nou pentru rețea' : 'Conectați-vă la contul dumneavoastră';
    document.getElementById('mainBtn').innerText = isRegistering ? 'Înregistrare Cont' : 'Conectare';
    document.getElementById('toggleAuth').innerHTML = isRegistering ? 
      'Aveți deja cont? <span class="text-indigo-600 font-semibold cursor-pointer hover:underline">Autentificați-vă</span>' : 
      'Nu aveți cont? <span class="text-indigo-600 font-semibold cursor-pointer hover:underline">Înregistrați-vă aici</span>';
      
    document.getElementById('forgotBtn').style.display = isRegistering ? 'none' : 'block';
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const parola = document.getElementById('password').value;
    
    try {
        if (isRegistering) {
            const nume = document.getElementById('regName').value, rol = document.getElementById('regRole').value;
            const res = await fetch(`${API}/register`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({nume, email, parola, rol}) });
            if(res.ok) { alert("Sunteți pe Sistem!"); toggleAuthMode(); } else { const err = await res.json(); alert(err.error || "Eroare creare cont."); }
        } else {
            const res = await fetch(`${API}/login`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, parola}) });
            if(res.ok) { user = await res.json(); initApp(); } else alert("Parolă sau E-mail incorect introdus.");
        }
    } catch(err) { alert("Eroare de comunicare la lansarea Bazei pe Cloud...");}
}

async function recoverPassword() { 
    const em = prompt("Tastați adresa e-mail a profilului:"); 
    if(em) {
        const res = await fetch(`${API}/recover`, {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:em})});
        const txt=await res.json(); alert(txt.message || txt.error);
    }
}

function logout() { window.location.reload(); }

function initApp() {
    // Trece aplicatia în mod dashboard. Design Nou
    document.getElementById('authContainer').style.display = 'none';
    document.body.style.backgroundColor = "#f4f6f9"; 
    document.getElementById('appWrap').style.display = 'block';
    
    document.getElementById('headerTitle').innerText = user.rol === 'profesor' ? 'Panou Profesor' : 'Agenda Elevului';
    document.getElementById('headerName').innerText = user.nume;

    if (user.rol === 'profesor') {
        document.getElementById('teacherView').style.display = 'block'; 
        initTeacher();
    } else {
        document.getElementById('studentView').style.display = 'block'; 
        initStudent();
    }
}

// ==== GESTIUNE TABS IN NOU DESiGN ====
function switchTab(tabId) {
    currentTab = tabId;
    document.getElementById('btnTabNote').className = tabId === 'noteView' ? 'tab-btn active tracking-tight' : 'tab-btn tracking-tight hover:text-indigo-600';
    document.getElementById('btnTabHw').className   = tabId === 'hwView'   ? 'tab-btn active tracking-tight' : 'tab-btn tracking-tight hover:text-indigo-600';
    
    // Box-ul formular comutat
    document.getElementById('noteViewBlock').style.display = tabId === 'noteView' ? 'block' : 'none';
    document.getElementById('hwViewBlock').style.display   = tabId === 'hwView'   ? 'block' : 'none';
}

// ============== LOGICA PANOU PROFESOR =============
async function initTeacher() {
    // Generez dropdown-urile selectii ca in trecut 
    const opts = subiecteCatalog.map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('tSelectMaterie').innerHTML = opts; 
    document.getElementById('hSelectMaterie').innerHTML = opts;
    
    // Generez bulele gri-roz moderne ptr Note
    let gSel = document.getElementById('gradesSelection'); gSel.innerHTML='';
    for(let i=1;i<=10;i++){
        let b = document.createElement('div'); b.className = 'circle-btn'; b.innerText = i;
        b.onclick = () => { document.querySelectorAll('.circle-btn').forEach(el=>el.classList.remove('selected')); b.classList.add('selected'); selectedGrade=i;};
        gSel.appendChild(b);
    }
    
    const elRes = await fetch(`${API}/elevi`); const elevi = await elRes.json();
    const selHTML = elevi.length>0 ? elevi.map(e => `<option value="${e.id}">${e.nume} (${e.email})</option>`).join('') : '<option value="">...Nu aveti conturi elevi online</option>';
    document.getElementById('tSelectElev').innerHTML = selHTML; 
    document.getElementById('hSelectElev').innerHTML = selHTML;
    
    if(elevi.length > 0) loadSpecifics(elevi[0].id);
}

// Adună de pe Cloud-ul Supabase info ptr Box-ul cel Curat "Notele elevului selectat"
async function loadSpecifics(idElev) {
    document.getElementById('tSelectElev').value = idElev; document.getElementById('hSelectElev').value = idElev;
    
    const[reqNote, reqTeme] = await Promise.all([fetch(`${API}/note/${idElev}`), fetch(`${API}/teme/${idElev}`)]);
    const noteEl = await reqNote.json(), temeEl = await reqTeme.json();
    
    let listUI = document.getElementById('tHistoryList');
    listUI.innerHTML = '';
    
    if(noteEl.length===0 && temeEl.length===0) { listUI.innerHTML = `<div class="text-sm italic p-6 bg-gray-50 border rounded-lg text-gray-400">Momentan 0 informatii de afișat</div>`; return; }

    // Generam randuri in vizual Note
    noteEl.forEach(n => {
        listUI.innerHTML += `
        <div class="mb-4 bg-white border border-gray-100 shadow-[0_2px_4px_rgb(0,0,0,0.02)] rounded-[0.6rem] p-5">
            <div class="flex justify-between">
                <div>
                   <h4 class="font-bold text-slate-800 text-[15px] flex items-center">
                     <span class="text-indigo-600 font-bold mr-2 text-xl">${n.nota}</span> ${n.materie}
                   </h4>
                   <p class="text-[12px] font-semibold text-slate-400 mt-0.5 ml-0.5">${n.data}</p>
                   ${n.observatie ? `<p class="mt-2 text-[13px] italic text-slate-600 border-l-[3px] border-indigo-200 pl-3">„${n.observatie}”</p>` : ''}
                </div>
                <button onclick="deleteGrade(${n.id}, ${idElev})" class="text-gray-300 hover:text-red-500 mt-1 self-start ml-2" title="Șterge definit">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </div>`;
    });

    // Vizual pt Teme Arhivate / Curente adaugat separat! 
    temeEl.forEach(t => {
        let isDone = t.rezolvata===1;
        listUI.innerHTML += `
         <div class="mb-3 border-2 border-dashed ${isDone? 'bg-green-50 border-green-200':'bg-orange-50 border-orange-200'} rounded-[0.6rem] p-4 text-sm relative">
           <div class="absolute top-2 right-2 text-2xl">${isDone? '✔️' : '⌛'}</div>
           <p class="font-bold mb-1 tracking-tight text-gray-800">Cerință ${t.materie}: </p>
           <p class="font-medium text-gray-700 w-[80%]">${t.descriere}</p>
         </div>`;
    });
}

async function saveGrade() {
    if(!selectedGrade) return alert("Bifați un rotund-bula pt acordare medie!");
    const d = {elev_id: document.getElementById('tSelectElev').value, profesor_id: user.id, materie: document.getElementById('tSelectMaterie').value, nota: selectedGrade, observatie: document.getElementById('tObs').value };
    await fetch(`${API}/note`, {method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(d)});
    document.getElementById('tObs').value = ''; selectedGrade=null;
    document.querySelectorAll('.circle-btn').forEach(b => b.classList.remove('selected'));
    loadSpecifics(d.elev_id);
}

async function saveHomework() {
    const desc = document.getElementById('hDescriere').value;
    if(!desc) return alert("Pardon... Introdu texte valide pentru acasa!");
    const d = {elev_id: document.getElementById('hSelectElev').value, profesor_id: user.id, materie: document.getElementById('hSelectMaterie').value, descriere: desc, nota_info: document.getElementById('hPunctaj').value};
    await fetch(`${API}/teme`, {method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(d)});
    document.getElementById('hDescriere').value = ''; document.getElementById('hPunctaj').value=''; loadSpecifics(d.elev_id);
}

async function deleteGrade(id_nota, id_elev) {
    if(confirm('Recurgeți la ștergerea notei pe acest an? Mediat va reacționa automat!')) {
        await fetch(`${API}/note/${id_nota}`, { method:'DELETE' });
        loadSpecifics(id_elev); 
    }
}


// ============== LOGICA PENTRU CURIOSITATEA ELEVILOR =============
async function initStudent() {
    const [rNote, rTeme] = await Promise.all([fetch(`${API}/note/${user.id}`), fetch(`${API}/teme/${user.id}`)]);
    const noteEl = await rNote.json(), temeEl = await rTeme.json();
    
    // B. Alerte ptr TEME ACASA NETECHINuite (1 Card pe sarcină pe panou SUS!) 
    const alerts = document.getElementById('hwContainerAlert'); 
    const lstT = document.getElementById('hwActiveList');
    const nedownloaded = temeEl.filter(t => t.rezolvata === 0);
    
    if (nedownloaded.length > 0) {
        alerts.style.display = 'block';
        lstT.innerHTML = nedownloaded.map(t => `
            <div class="bg-gradient-to-tr from-white to-[#F9FAFF] border border-indigo-100 rounded-[1.2rem] p-5 shadow-sm relative">
                <span class="bg-indigo-50 text-indigo-700 font-bold text-xs uppercase px-2.5 py-1 rounded">Materie ${t.materie}</span>
                <p class="mt-4 font-semibold text-sm tracking-tight text-gray-800 leading-relaxed">${t.descriere}</p>
                ${t.nota_info ? `<p class="mt-2 text-xs italic text-orange-600 bg-orange-50 font-medium inline-block px-2 rounded p-1 mb-2">⭐ Obs/Puncte: ${t.nota_info}</p>` : ''}
                <div class="mt-4 border-t pt-3 border-gray-100 text-right">
                    <button onclick="finishHw(${t.id})" class="text-sm px-5 py-2.5 rounded bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-colors shadow shadow-gray-400/40">Am bifat Cerința Acasă ✓</button>
                </div>
            </div>`).join('');
    } else { alerts.style.display = 'none'; lstT.innerHTML=''; }

    // C. CARD-uri Subiecte Fix Cu Medie Purple Si Casuțe ca Nici-o NOTA 
    const mainGrid = document.getElementById('studentSubjectsGrid');
    mainGrid.innerHTML = subiecteCatalog.map(materie => {
        // extragem lista fix din baza pentru ramura pe rand 
        const dbNoteBox = noteEl.filter(n => n.materie === materie).reverse(); 
        
        // Punctajul matematic
        let badgeTXT = 'Medie: -'; 
        if(dbNoteBox.length>0) badgeTXT = `Medie: ` + (dbNoteBox.reduce((a, b) => a + b.nota, 0) / dbNoteBox.length).toFixed(2);
        
        let bulUI = `<p class="italic text-gray-300 font-medium w-full text-center mt-3 mb-2 text-sm tracking-wide">Nicio notă</p>`; // Default UI gol (Cum apar alea vide)
        if(dbNoteBox.length > 0) {
            bulUI = dbNoteBox.map(n => 
                `<div title="${n.observatie || 'Lipsește observație prof.'}" onclick="if('${n.observatie}') alert('✍️ Observație Prf:\\n\\n ${n.observatie}')" class="cursor-pointer ${n.observatie ? 'grade-bubble has-obs':'grade-bubble'}">
                    ${n.nota} 
                    ${n.observatie ? '<div class="obs-dot"></div>':''} 
                 </div>`
            ).join('');
        }

        // Forma returnare bloc
        return `
         <div class="bg-white rounded-2xl shadow-sm shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-gray-100 p-5 min-h-[145px] flex flex-col justify-between hover:-translate-y-[2px] transition-transform cursor-default">
            
            <div class="flex justify-between items-start mb-6 border-b border-gray-50
