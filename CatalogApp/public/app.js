let user = null; let selectedGrade = null;
const API = '/api';
const subiecteCatalog =['Limba Română', 'Limba Rusă', 'L. Engleză', 'Matematică', 'Fizică', 'Chimia', 'Biologia', 'Informatică', 'Geografia', 'Istoria'];
let isRegistering = false; let currentTab = 'noteView';

function toggleAuthMode() {
    isRegistering = !isRegistering;
    document.getElementById('nameGroup').style.display = isRegistering ? 'block' : 'none';
    document.getElementById('roleGroup').style.display = isRegistering ? 'block' : 'none';
    document.getElementById('mainBtn').innerText = isRegistering ? 'Înregistrare' : 'Conectare';
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const parola = document.getElementById('password').value;
    if (isRegistering) {
        const nume = document.getElementById('regName').value, rol = document.getElementById('regRole').value;
        const res = await fetch(`${API}/register`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({nume, email, parola, rol}) });
        if(res.ok) { alert("Înregistrat cu succes!"); toggleAuthMode(); } else alert(await res.text());
    } else {
        const res = await fetch(`${API}/login`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, parola}) });
        if(res.ok) { user = await res.json(); initApp(); } else alert("Parolă sau email greșite!");
    }
}

async function recoverPassword() { 
    const em = prompt("Emailul contului:"); 
    if(em){const res = await fetch(`${API}/recover`, {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:em})});
    const txt=await res.json(); alert(txt.message || txt.error);}
}

function logout() { window.location.reload(); }

function initApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appHeader').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('headerTitle').innerText = user.rol === 'profesor' ? 'Platforma Profesorului' : 'Agenda Electronică';
    document.getElementById('headerName').innerText = user.nume;

    if (user.rol === 'profesor') {
        document.getElementById('teacherView').style.display = 'block'; document.getElementById('studentView').style.display = 'none'; initTeacher();
    } else {
        document.getElementById('teacherView').style.display = 'none'; document.getElementById('studentView').style.display = 'block'; initStudent();
    }
}

// ==== LOGICA TABS ====
function switchTab(tabId) {
    currentTab = tabId;
    document.getElementById('btnTabNote').className = tabId === 'noteView' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('btnTabHw').className   = tabId === 'hwView'   ? 'tab-btn active text-orange-600' : 'tab-btn';
    
    document.getElementById('noteViewBlock').style.display = tabId === 'noteView' ? 'block' : 'none';
    document.getElementById('hwViewBlock').style.display   = tabId === 'hwView'   ? 'block' : 'none';
}

// ============== FUNCȚII PROFESOR ==============
async function initTeacher() {
    const opts = subiecteCatalog.map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('tSelectMaterie').innerHTML = opts; document.getElementById('hSelectMaterie').innerHTML = opts;
    
    let gSel = document.getElementById('gradesSelection'); gSel.innerHTML='';
    for(let i=1;i<=10;i++){
        let b = document.createElement('div'); b.className = 'circle-btn'; b.innerText = i;
        b.onclick = () => { document.querySelectorAll('.circle-btn').forEach(el=>el.classList.remove('selected')); b.classList.add('selected'); selectedGrade=i;};
        gSel.appendChild(b);
    }
    const elRes = await fetch(`${API}/elevi`); const elevi = await elRes.json();
    const selHTML = elevi.length>0 ? elevi.map(e => `<option value="${e.id}">${e.nume} (${e.email})</option>`).join('') : '<option value="">Fără elevi în sistem...</option>';
    document.getElementById('tSelectElev').innerHTML = selHTML; document.getElementById('hSelectElev').innerHTML = selHTML;
    
    if(elevi.length > 0) loadSpecifics(elevi[0].id);
}

// Cand alegi alt elev -> incarcam istoricul CU buton de ștergere acum!
async function loadSpecifics(idElev) {
    document.getElementById('tSelectElev').value = idElev; document.getElementById('hSelectElev').value = idElev;
    
    const[reqNote, reqTeme] = await Promise.all([fetch(`${API}/note/${idElev}`), fetch(`${API}/teme/${idElev}`)]);
    const noteEl = await reqNote.json(), temeEl = await reqTeme.json();
    
    let histList = document.getElementById('tHistoryList');
    histList.innerHTML = `<h4 class="text-xs font-bold bg-gray-100 p-2 text-gray-500 mb-2 mt-4 rounded uppercase">Ultimul Istoric Școlar</h4>`;
    
    if(noteEl.length===0 && temeEl.length===0) { histList.innerHTML += `<div class="p-2 text-sm italic">Fără informații pe acest profil.</div>`; return; }

    // Generam rândurile pentru Note - Am adăugat flex-ul pentru butonul SVG Red de Delete
    noteEl.forEach(n => {
        histList.innerHTML += `
        <div class="mb-2 p-2 border border-gray-100 bg-gray-50 rounded text-sm flex justify-between items-center">
            <div>📘 <span class="font-bold">Notat cu ${n.nota}</span> la ${n.materie} <span class="text-xs text-gray-400">(${n.data})</span></div>
            <button onclick="deleteGrade(${n.id}, ${idElev})" class="text-red-500 hover:text-red-700 ml-2" title="Șterge definitiv nota">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </div>`
    });
    
    temeEl.forEach(t => histList.innerHTML += `<div class="mb-2 p-2 border border-orange-100 bg-orange-50 rounded text-sm text-orange-900 flex justify-between"><div>📝 Tema ${t.materie}: ${t.descriere} </div> <div> ${t.rezolvata===1? '✅ Făcută':'⏳ De rezolvat'}</div></div>`);
}

async function saveGrade() {
    if(!selectedGrade) return alert("Bifați o notă pentru catalog!");
    const d = {elev_id: document.getElementById('tSelectElev').value, profesor_id: user.id, materie: document.getElementById('tSelectMaterie').value, nota: selectedGrade, observatie: document.getElementById('tObs').value };
    await fetch(`${API}/note`, {method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(d)});
    document.getElementById('tObs').value = ''; loadSpecifics(d.elev_id);
}

async function saveHomework() {
    const desc = document.getElementById('hDescriere').value;
    if(!desc) return alert("Tema trebuie să aibă o descriere pt a știi elevul ce să lucreze!");
    const d = {elev_id: document.getElementById('hSelectElev').value, profesor_id: user.id, materie: document.getElementById('hSelectMaterie').value, descriere: desc, nota_info: document.getElementById('hPunctaj').value};
    await fetch(`${API}/teme`, {method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(d)});
    document.getElementById('hDescriere').value = ''; document.getElementById('hPunctaj').value=''; loadSpecifics(d.elev_id);
    alert('Tema pentru acasă trimisă cu succes către dispozitivul Elevului!');
}

// 💥 NOUL ADĂUGAT: Apelarea serverului pentru ștergerea notei
async function deleteGrade(id_nota, id_elev) {
    if(confirm('Sigur dorești să ștergi această notă definitiv din catalog? Aceasta acțiune va afecta mediile!')) {
        await fetch(`${API}/note/${id_nota}`, { method:'DELETE' });
        loadSpecifics(id_elev); // se reîncarcă istoricul actualizat
    }
}


// ============== FUNCȚII ELEV ==============
async function initStudent() {
    const [rNote, rTeme] = await Promise.all([fetch(`${API}/note/${user.id}`), fetch(`${API}/teme/${user.id}`)]);
    const noteEl = await rNote.json(), temeEl = await rTeme.json();
    
    const cutieAlerte = document.getElementById('hwContainerAlert'); const gridTeme = document.getElementById('hwActiveList');
    const temeNerezolvate = temeEl.filter(t => t.rezolvata === 0);
    
    if (temeNerezolvate.length > 0) {
        cutieAlerte.style.display = 'block';
        gridTeme.innerHTML = temeNerezolvate.map(t => `
            <div class="bg-orange-50 border-2 border-orange-200 p-4 rounded-xl flex flex-col relative overflow-hidden">
                <span class="bg-orange-200 text-orange-800 px-2 py-1 text-xs rounded-br-lg font-bold absolute top-0 left-0">${t.materie}</span>
                <p class="mt-6 mb-2 text-sm font-semibold">${t.descriere}</p>
                ${t.nota_info ? `<span class="italic text-xs text-orange-700 block mb-4 border-l-2 pl-2 border-orange-300">INFO Proful: ${t.nota_info}</span>` : ''}
                
                <button onclick="finishHw(${t.id})" class="mt-auto self-end bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-4 py-2 rounded-lg flex items-center shadow shadow-green-200 transition-colors">
                  Am realizat tema ☑️
                </button>
            </div>
        `).join('');
    } else cutieAlerte.style.display = 'none';

    const gridNote = document.getElementById('studentSubjectsGrid');
    gridNote.innerHTML = subiecteCatalog.map(materie => {
        const obsCat = noteEl.filter(n => n.materie === materie).reverse(); let medieT='-';
        if(obsCat.length>0) medieT = (obsCat.reduce((a, b) => a + b.nota, 0) / obsCat.length).toFixed(2);
        const listBul = obsCat.map(n => `<div class="${n.observatie?'grade-box has-note':'grade-box'}" title="${n.observatie?n.observatie:'fara detalii'}" onclick="if('${n.observatie}') alert('Proful a zis:\\n${n.observatie}')">${n.nota}${n.observatie?`<div class="red-dot"></div>`:''}</div>`).join('');
        
        return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-[140px]">
            <div class="flex justify-between items-center mb-4 border-b pb-1"><h4 class="font-bold text-sm">${materie}</h4><span class="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-indigo-600 border border-gray-200">Media: ${medieT}</span></div>
            <div class="flex gap-2 flex-wrap">${listBul||'<i class="text-xs text-gray-300 mt-2">lipsă aprecieri.</i>'}</div>
        </div>`;
    }).join('');
}

async function finishHw(id_temă) {
    if(!confirm("Bravo! Transmit profesorului că ți-ai învățat sau ai făcut exercițiul la temă?")) return;
    await fetch(`${API}/teme/${id_temă}/done`, {method: 'PUT'});
    initStudent(); 
}
