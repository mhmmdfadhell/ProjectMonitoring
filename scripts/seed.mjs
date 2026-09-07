import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "monitoring_db",
  });

  console.log("Connected to MySQL database.");

  // Make sure tables exist
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(64) PRIMARY KEY,
      month VARCHAR(32) NOT NULL,
      year INT NOT NULL,
      client VARCHAR(255) NOT NULL,
      client_norm VARCHAR(255) NOT NULL,
      project TEXT NOT NULL,
      pic VARCHAR(100) NOT NULL,
      value BIGINT NOT NULL DEFAULT 0,
      bast VARCHAR(50) NOT NULL DEFAULT '',
      no_invoice VARCHAR(100) NULL,
      no_kontrak VARCHAR(100) NULL,
      invoice_submit VARCHAR(50) NULL,
      paid_date VARCHAR(50) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'In Progress',
      status_updated_at VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS cashin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      month VARCHAR(32) NOT NULL,
      year INT NOT NULL,
      project TEXT NOT NULL,
      income DECIMAL(15, 2) NOT NULL DEFAULT 0,
      trf_date VARCHAR(50) NULL
    );
  `);

  const dataFilePath = path.join(process.cwd(), "data", "monitoring.json");
  const rawData = fs.readFileSync(dataFilePath, "utf8");
  const data = JSON.parse(rawData);

  console.log(`Seeding ${data.projects.length} projects...`);
  for (const p of data.projects) {
    await connection.execute(
      `INSERT INTO projects (id, month, year, client, client_norm, project, pic, value, bast, no_invoice, no_kontrak, invoice_submit, paid_date, status, status_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        month = VALUES(month),
        year = VALUES(year),
        client = VALUES(client),
        client_norm = VALUES(client_norm),
        project = VALUES(project),
        pic = VALUES(pic),
        value = VALUES(value),
        bast = VALUES(bast),
        no_invoice = VALUES(no_invoice),
        no_kontrak = VALUES(no_kontrak),
        invoice_submit = VALUES(invoice_submit),
        paid_date = VALUES(paid_date),
        status = VALUES(status),
        status_updated_at = VALUES(status_updated_at)
      `,
      [
        p.id,
        p.month,
        p.year,
        p.client || "",
        p.client_norm || "",
        p.project || "",
        p.pic || "",
        p.value || 0,
        p.bast || "",
        p.no_invoice || null,
        p.no_kontrak || null,
        p.invoice_submit || null,
        p.paid_date || null,
        p.status || "In Progress",
        p.status_updated_at || null,
      ]
    );
  }

  console.log(`Seeding ${data.cashin.length} cashin records...`);
  // Clear and re-populate cashin to avoid duplicates
  await connection.execute(`DELETE FROM cashin`);
  for (const c of data.cashin) {
    await connection.execute(
      `INSERT INTO cashin (month, year, project, income, trf_date)
       VALUES (?, ?, ?, ?, ?)`,
      [c.month, c.year, c.project || "", c.income || 0, c.trf_date || null]
    );
  }

  console.log("Database seeded successfully!");
  await connection.end();
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
