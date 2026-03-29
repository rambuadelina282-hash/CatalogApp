require('dotenv').config(); // Folosim .env pt parole ascunse pe Internet
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Legătura automată Cloud Supabase - adresa URL si API_KEY scoasă din mediul secret
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==== RUTE API UTILIZATORI & NOTE (PostgreSQL pe Supabase) ====
app.post('/api/register', async (req, res) => {
    const { nume, email, parola, rol } = req.body;
    // Comanda în Cloud spre 'users'
    const { data, error } = await supabase.from('users').insert([{ nume, email, parola, rol }]).select('id').single();
    if (error) return res.status(400).json({ error: "Emailul există deja sau s-a produs o eroare!" }); 
    res.json({ id: data.id, rol: rol });
});

app.post('/api/login', async (req, res) => {
    // Returneaza row direct verificat de API DB:
    const { data, error } = await supabase.from('users').select('id, nume, email, rol')
          .eq('email', req.body.email).eq('parola', req.body.parola).maybeSingle();
    
    if (data) res.json(data); else res.status(401).json({ error: "E-mail sau parolă greșită." });
});

app.get('/api/elevi', async (req, res) => { 
    const { data, error } = await supabase.from('users').select('id, nume, email').eq('rol', 'elev');
    res.json(data ||[]); 
});

app.post('/api/note', async (req, res) => {
    const dataAzi = new Date().toLocaleDateString('ro-RO');
    const { error } = await supabase.from('note').insert([{
        elev_id: req.body.elev_id, profesor_id: req.body.profesor_id, 
        materie: req.body.materie, nota: req.body.nota, 
        observatie: req.body.observatie, data: dataAzi
    }]);
    if(error) res.status(500).json({error: error.message}); else res.json({ success: true });
});

app.get('/api/note/:elev_id', async (req, res) => { 
    const { data, error } = await supabase.from('note').select('*').eq('elev_id', req.params.elev_id).order('id', { ascending: false });
    res.json(data ||[]); 
});

app.delete('/api/note/:id', async (req, res) => { 
    const { error } = await supabase.from('note').delete().eq('id', req.params.id);
    if(error) res.status(500).json({error: error.message}); else res.json({ success: true });
});

app.post('/api/recover', async (req, res) => {
     const { data, error } = await supabase.from('users').select('parola').eq('email', req.body.email).maybeSingle();
     if(data) res.json({ message: `Parola ta este: ${data.parola}` }); else res.status(404).json({ error: "Cont negăsit." });
});

// ==== RUTE API NOI (TEME) ====
app.post('/api/teme', async (req, res) => {
    const dataAzi = new Date().toLocaleDateString('ro-RO');
    const { elev_id, profesor_id, materie, descriere, nota_info } = req.body;
    const { error } = await supabase.from('teme').insert([{
        elev_id, profesor_id, materie, descriere, nota_info, data: dataAzi
    }]);
    if(error) res.status(500).json({error: error.message}); else res.json({ success: true });
});

app.get('/api/teme/:elev_id', async (req, res) => {
    const { data, error } = await supabase.from('teme').select('*').eq('elev_id', req.params.elev_id).order('id', { ascending: false });
    res.json(data ||[]);
});

app.put('/api/teme/:id/done', async (req, res) => {
    const { error } = await supabase.from('teme').update({ rezolvata: 1 }).eq('id', req.params.id);
    if(error) res.status(500).json({error: error.message}); else res.json({ success: true });
});

// NOUUL LAUNCHER. Gata pentru găzduire online
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[🚀 Sistem LANZAT! DB legat.] Aplicația funcționează public - serverul citește portul: ${PORT}`));
