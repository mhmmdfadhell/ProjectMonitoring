const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
  let dbHost = 'localhost';
  let dbUser = 'root';
  let dbPass = '';
  let dbName = 'monitoring_db';
  
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const lines = env.split('\n');
    lines.forEach(l => {
      const [k, v] = l.split('=');
      if(k==='DB_HOST') dbHost = v.trim();
      if(k==='DB_USER') dbUser = v.trim();
      if(k==='DB_PASSWORD') dbPass = v.trim();
      if(k==='DB_NAME') dbName = v.trim();
    });
  } catch (e) { }

  const pool = mysql.createPool({ 
    host: dbHost, 
    user: dbUser, 
    password: dbPass, 
    database: dbName 
  });
  
  const generateId = () => 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  
  const p1 = {
    id: generateId(),
    month: 'Desember',
    year: 2025,
    client: 'NUV - Aigen',
    client_norm: 'NUV - Aigen',
    project: 'BI API Managemnt',
    pic: 'Alwi',
    value: 43320000,
    bast: 'DONE',
    no_invoice: 'INV-AGT-2025-12-85',
    no_kontrak: '',
    invoice_submit: '2025-12-15',
    paid_date: '2026-01-28',
    status: 'Paid',
    status_updated_at: '2026-01-28'
  };

  const p2 = {
    id: generateId(),
    month: 'Desember',
    year: 2025,
    client: 'NUV - Aigen',
    client_norm: 'NUV - Aigen',
    project: 'BI Bifast',
    pic: 'Alwi',
    value: 43320960,
    bast: 'DONE',
    no_invoice: 'INV-AGT-2025-12-86',
    no_kontrak: '',
    invoice_submit: '2025-12-15',
    paid_date: '2026-01-28',
    status: 'Paid',
    status_updated_at: '2026-01-28'
  };

  const sql = "INSERT INTO projects (id, month, year, client, client_norm, project, pic, value, bast, no_invoice, no_kontrak, invoice_submit, paid_date, status, status_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  for (const projectData of [p1, p2]) {
    await pool.execute(sql, [
        projectData.id, projectData.month, projectData.year, projectData.client, projectData.client_norm,
        projectData.project, projectData.pic, projectData.value, projectData.bast, projectData.no_invoice,
        projectData.no_kontrak, projectData.invoice_submit, projectData.paid_date, projectData.status, projectData.status_updated_at
      ]
    );
  }
  console.log('Inserted into MySQL successfully');
  process.exit(0);
}
run();
