let user = null; let selectedGrade = null;
const API = '/api'; 

const subiecteCatalog =['Limba Română', 'Limba Rusă', 'L. Engleză', 'Matematică', 'Fizică', 'Chimia', 'Biologia', 'Informatică', 'Geografia', 'Istoria'];
let isRegistering = false; let currentTab = 'noteView';

// ============= PARTEA SECURIATĂ / ROBUSTĂ A LEGĂRII BUTTONILOR ========== //
document.addEventListener('DOMContentLoaded', () => {
    // Înscriere Form Login-ul Fix (Rezolvă orice oprire prin buton Submit native Browser!)
    const formElement = document.getElementById('authForm');
    if (formElement) formElement.addEventListener('submit', handleAuth);
    
    // Înscriere Toggler Curat dintre Ecranele Inregistrare si Autentificare 
    const btToggler = document.getElementById('toggleAuthBtn');
    if (btToggler) btToggler.addEventListener('click', toggleAuthMode);
});

// Switch Visualul Intre conturi pe Paragraf  !
function toggleAuthMode() {
    isRegistering = !isRegistering;
    document.getElementById('nameGroup').style.display = isRegistering ? 'block' : 'none';
    document.getElementById('roleGroup').style.display = isRegistering ? 'block' : 'none';
    
    document.getElementById('authTitle').innerText = isRegistering ? 'Înregistrare' : 'Agenda Electronică';
    document.getElementById('authSubtitle').innerText = isRegistering ? 'Creați un cont nou pe rețea' : 'Conectați-vă la contul dumneavoastră';
    document.getElementById('mainBtn').innerText = isRegistering ? 'Înregistrare Cont' : 'Conectare';
    
    document.getElementById('promptText').innerText = isRegistering ? 'Aveți deja cont? ' : 'Nu aveți cont? ';
    document.getElementById('toggleAuthBtn').innerText = isRegistering ? 'Autentificați-vă' : 'Înregistrați-vă aici';
      
    document.getElementById('forgotBtn').style.display = isRegistering ? 'none' : 'block';
}

// Inima Actiunilor Conectării (Se incărca + Nu primește refresh prostesc!)
async function handleAuth(e) {
    e.preventDefault(); // Foarte specific! Opreste efectul prostiv ca linku-urile să deraieze platforma!
    
    const theButton = document.getElementById('mainBtn');
    theButton.innerText = "Se încarcă, rugăm stați...";
    theButton.disabled = true;

    const email = document.getElementById('email').value.trim();
    const parola = document.getElementById('password').value.trim();
    
    try {
        if (isRegistering) {
            const nume = document.getElementById('regName').value.trim();
            const rol = document.getElementById('regRole').value;
            
            // Failsafe ca oponent
            if(!nume) { alert("Completați Numele Complet Obligatoriu!"); unlockButton(); return; }

            const res = await fetch(`${API}/register`, { 
                method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({nume, email, parola, rol}) 
            });
            if(res.ok) { 
                alert("✨ Succes complet. Cont valid! Acum ne întoarcem pt a te putea Loga direct cu adresa proaspătă creată!"); 
                toggleAuthMode(); // Revin inapoi vizual in Conectare sa confirme el Emailul bagat! 
                unlockButton();
            } else { 
                const err = await res.json(); alert(err.error || "Atenție: Cont Refuzat sau Creat Déja (Exista un utilizator similar)."); unlockButton(); 
            }
        } else {
            const res = await fetch(`${API}/login`, { 
                method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email, parola}) 
            });
            if(res.ok) { 
                user = await res.json(); initApp(); // Lăsăm Buton Blocat în loading CĂ MUNCIM DEJA LA PAGINĂ
            } else { alert("✖️ Credențială sau o adresă inexact introdusă! Verificati va rugam textul introdus de D-Voastră!"); unlockButton(); }
        }
    } catch(err) { 
        alert("Eroare de net spre Platforma RENDER/Server Baze date de Supabase..."); unlockButton(); 
    }
    
    // Auto Refacerea culorii cand este ceva necorespunzator ca sa aiba chef utilizatorii.
    function unlockButton() {
        theButton.disabled = false;
        theButton.innerText = isRegistering ? 'Înregistrare Cont' : 'Conectare';
    }
}


// ============== START PROGRAM PLATFORMÃ =============

async function recoverPassword() { 
    const em = prompt("Tastați adresa de e-mail curentă platformei:"); 
    if(em) {
        const res = await fetch(`${API}/recover`, {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:em})});
        const txt=await res.json(); alert(txt.message || txt.error);
    }
}
function logout() { window.location.reload(); }

function initApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.body.style.backgroundColor = "#f4f6f9"; 
    document.getElementById('appWrap').style.display = 'block';
    
    document.getElementById('headerTitle').innerText = user.rol === 'profesor' ? 'Panou Profesor' : 'Agenda Elevului';
    document.getElementById('headerName').innerText = user.nume;

    if (user.rol === 'profesor') {
        document.getElementById('teacherView').style.display = 'block'; initTeacher();
    } else {
        document.getElementById('studentView').style.display = 'block'; initStudent();
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    document.getElementById('btnTabNote').className = tabId === 'noteView' ? 'tab-btn active tracking-tight' : 'tab-btn tracking-tight hover:text-indigo-600';
    document.getElementById('btnTabHw').className   = tabId === 'hwView'   ? 'tab-btn active tracking-tight' : 'tab-btn tracking-tight hover:text-indigo-600';
    
    document.getElementById('noteViewBlock').style.display = tabId === 'noteView' ? 'block' : 'none';
    document.getElementById('hwViewBlock').style.display   = tabId === 'hwView'   ? 'block' : 'none';
}

async function initTeacher() {
    const opts = subiecteCatalog.map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('tSelectMaterie').innerHTML = opts; 
    document.getElementById('hSelectMaterie').innerHTML = opts;
    
    let gSel = document.getElementById('gradesSelection'); gSel.innerHTML='';
    for(let i=1;i<=10;i++){
        let b = document.createElement('div'); b.className = 'circle-btn'; b.innerText = i;
        b.onclick = () => { document.querySelectorAll('.circle-btn').forEach(el=>el.classList.remove('selected')); b.classList.add('selected'); selectedGrade=i;};
        gSel.appendChild(b);
    }
    
    const elRes = await fetch(`${API}/elevi`); const elevi = await elRes.json();
    const selHTML = elevi.length>0 ? elevi.map(e => `<option value="${e.id}">${e.nume} (${e.email})</option>`).join('') : '<option value="">...Nu aveti conturi elevi active pt sistem inca</option>';
    document.getElementById('tSelectElev').innerHTML = selHTML; document.getElementById('hSelectElev').innerHTML = selHTML;
    
    if(elevi.length > 0) loadSpecifics(elevi[0].id);
}

async function loadSpecifics(idElev) {
    document.getElementById('tSelectElev').value = idElev; document.getElementById('hSelectElev').value = idElev;
    const[reqNote, reqTeme] = await Promise.all([fetch(`${API}/note/${idElev}`), fetch(`${API}/teme/${idElev}`)]);
    const noteEl = await reqNote.json(), temeEl = await reqTeme.json();
    let listUI = document.getElementById('tHistoryList'); listUI.innerHTML = '';
    if(noteEl.length===0 && temeEl.length===0) { listUI.innerHTML = `<div class="text-sm italic p-6 bg-gray-50 border rounded-lg text-gray-400">0 informații regăsite</div>`; return; }

    noteEl.forEach(n => {
        listUI.innerHTML += `<div class="mb-4 bg-white border border-gray-100 shadow-[0_2px_4px_rgb(0,0,0,0.02)] rounded-[0.6rem] p-5"> <div class="flex justify-between"> <div> <h4 class="font-bold text-slate-800 text-[15px] flex items-center"> <span class="text-indigo-600 font-bold mr-2 text-xl">${n.nota}</span> ${n.materie} </h4> <p class="text-[12px] font-semibold text-slate-400 mt-0.5 ml-0.5">${n.data}</p> ${n.observatie ? `<p class="mt-2 text-[13px] italic text-slate-600 border-l-[3px] border-indigo-200 pl-3">„${n.observatie}”</p>` : ''} </div> <button onclick="deleteGrade(${n.id}, ${idElev})" class="text-gray-300 hover:text-red-500 mt-1 self-start ml-2" title="Ștergere definitivă documentată"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> </button> </div> </div>`;
    });
    temeEl.forEach(t => {
        let isDone = t.rezolvata===1;
        listUI.innerHTML += `<div class="mb-3 border-2 border-dashed ${isDone? 'bg-green-50 border-green-200':'bg-orange-50 border-orange-200'} rounded-[0.6rem] p-4 text-sm relative"> <div class="absolute top-2 right-2 text-2xl">${isDone? '✔️' : '⌛'}</div> <p class="font-bold mb-1 tracking-tight text-gray-800">Cerință ${t.materie}: </p> <p class="font-medium text-gray-700 w-[80%]">${t.descriere}</p> </div>`;
    });
}

async function saveGrade() {
    if(!selectedGrade) return alert("Selectează te rugăm numărul acordării bursei rotunde!");
    const d = {elev_id: document.getElementById('tSelectElev').value, profesor_id: user.id, materie: document.getElementById('tSelectMaterie').value, nota: selectedGrade, observatie: document.getElementById('tObs').value };
    await fetch(`${API}/note`, {method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(d)});
    document.getElementById('tObs').value = ''; selectedGrade=null;
    document.querySelectorAll('.circle-btn').forEach(b => b.classList.remove('selected'));
    loadSpecifics(d.elev_id);
}
async function saveHomework() {
    const desc = document.getElementById('hDescriere').value;
    if(!desc) return alert("Textul Exercițiilor ce devin Obligatorii lipsește - Scrie Sarcina Curentă pt Sistem!");
    const d
