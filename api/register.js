const https = require('https');
const { Client } = require('pg');

// Send email via SendGrid HTTP Web API (bypasses all SMTP port blocks)
async function sendWelcomeEmail(userEmail, userName, details) {
  const isEmailOnly = details.serviceType === 'email-only';
  const isDatabase = details.serviceType === 'database' || details.serviceType === 'postgres';

  let subject = `Your Lapter Technologies Account is Ready 🎉`;
  let bodyContent = '';

  if (isDatabase) {
    subject = `🚀 Your PostgreSQL Cloud Database is Ready — Lapter Technologies`;
    bodyContent = `
      <div class="greeting">Hello, ${userName}!</div>
      <div class="intro">Your dedicated <strong>PostgreSQL 18 Cloud Database</strong> has been provisioned on our high-speed NVMe SSD cloud infrastructure. Below are your database connection credentials and instant connection strings.</div>

      <div class="section-title">🔑 Direct Database Credentials</div>
      <div class="cred-box">
        <div class="cred-row"><span class="cred-label">Database Host</span><span class="cred-value">${details.host || '162.35.98.198'}</span></div>
        <div class="cred-row"><span class="cred-label">Port</span><span class="cred-value">${details.port || 5432}</span></div>
        <div class="cred-row"><span class="cred-label">Database Name</span><span class="cred-value">${details.dbName}</span></div>
        <div class="cred-row"><span class="cred-label">Database User</span><span class="cred-value">${details.dbUser}</span></div>
        <div class="cred-row"><span class="cred-label">Password</span><span class="cred-value">${details.password}</span></div>
        <div class="cred-row"><span class="cred-label">Engine</span><span class="cred-value">PostgreSQL 18.x</span></div>
      </div>

      <div class="section-title">⚡ Ready-to-Use Connection String</div>
      <div class="cred-box" style="background: #0f172a; border-color: #334155;">
        <div style="color: #38bdf8; font-family: monospace; font-size: 12px; word-break: break-all; line-height: 1.5;">
          ${details.connectionString}
        </div>
      </div>

      <div class="section-title">🛠️ Framework & ORM Configuration</div>
      <div class="cred-box" style="background: #1e293b; border-color: #334155; color: #cbd5e1; font-size: 12px; font-family: monospace;">
        <p style="margin: 0 0 6px 0; color: #94a3b8;"><strong>.env (Next.js / Node.js / Prisma):</strong></p>
        <div style="color: #4ade80; word-break: break-all; margin-bottom: 12px;">
          DATABASE_URL="${details.connectionString}"
        </div>
        <p style="margin: 0 0 6px 0; color: #94a3b8;"><strong>Prisma schema.prisma:</strong></p>
        <div style="color: #93c5fd; white-space: pre-wrap;">datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}</div>
      </div>

      <div class="section-title">🌐 Web Management Dashboard</div>
      <div class="cred-box">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;">You can explore tables, execute SQL queries, and export data directly in your browser:</p>
        <div class="cred-row"><span class="cred-label">Dashboard URL</span><span class="cred-value"><a href="https://db.laptertech.store" target="_blank" style="color: #008099; text-decoration: none; font-weight: bold;">https://db.laptertech.store</a></span></div>
        <div class="cred-row"><span class="cred-label">Web UI Host</span><span class="cred-value">127.0.0.1</span></div>
        <div class="cred-row"><span class="cred-label">Web UI Port</span><span class="cred-value">5432</span></div>
      </div>

      <center><a href="${details.webDashboard || 'https://db.laptertech.store'}" class="btn">📊 Open Database Dashboard</a></center>
    `;
  } else if (isEmailOnly) {
    subject = `Your Business Email Account is Ready 🎉`;
    bodyContent = `
      <div class="greeting">Hello, ${userName}!</div>
      <div class="intro">Your Business Email account has been successfully provisioned. Below are your login credentials — please save them in a secure place.</div>

      <div class="section-title">🔒 Control Panel Access</div>
      <div class="cred-box">
        <div class="cred-row"><span class="cred-label">Username</span><span class="cred-value">${details.username}</span></div>
        <div class="cred-row"><span class="cred-label">Password</span><span class="cred-value">${details.password}</span></div>
        <div class="cred-row"><span class="cred-label">Domain</span><span class="cred-value">${details.domain}</span></div>
        <div class="cred-row"><span class="cred-label">Plan</span><span class="cred-value">Business Email Only</span></div>
      </div>

      <div class="section-title">📧 Business Email</div>
      <div class="cred-box">
        <div class="cred-row"><span class="cred-label">Email Address</span><span class="cred-value">${details.emailAccount}</span></div>
        <div class="cred-row"><span class="cred-label">Email Password</span><span class="cred-value">${details.emailPassword}</span></div>
        <div class="cred-row"><span class="cred-label">Webmail URL</span><span class="cred-value">${details.webmail}</span></div>
        <div class="cred-row"><span class="cred-label">IMAP Server</span><span class="cred-value">mail.laptertech.store</span></div>
        <div class="cred-row"><span class="cred-label">SMTP Server</span><span class="cred-value">mail.laptertech.store</span></div>
      </div>

      <center><a href="${details.controlPanel}" class="btn">💻 Open Control Panel</a></center>
    `;
  } else {
    // Web Hosting
    subject = `Your Web Hosting Account is Ready 🎉`;
    bodyContent = `
      <div class="greeting">Hello, ${userName}!</div>
      <div class="intro">Your Web Hosting account has been successfully provisioned. Below are your login credentials — please save them in a secure place.</div>

      <div class="section-title">🔒 Control Panel Access</div>
      <div class="cred-box">
        <div class="cred-row"><span class="cred-label">Username</span><span class="cred-value">${details.username}</span></div>
        <div class="cred-row"><span class="cred-label">Password</span><span class="cred-value">${details.password}</span></div>
        <div class="cred-row"><span class="cred-label">Domain</span><span class="cred-value">${details.domain}</span></div>
        <div class="cred-row"><span class="cred-label">Plan</span><span class="cred-value">Web Hosting</span></div>
      </div>

      <div class="section-title">📧 Business Email</div>
      <div class="cred-box">
        <div class="cred-row"><span class="cred-label">Email Address</span><span class="cred-value">${details.emailAccount}</span></div>
        <div class="cred-row"><span class="cred-label">Email Password</span><span class="cred-value">${details.emailPassword}</span></div>
        <div class="cred-row"><span class="cred-label">Webmail URL</span><span class="cred-value">${details.webmail}</span></div>
        <div class="cred-row"><span class="cred-label">IMAP Server</span><span class="cred-value">mail.laptertech.store</span></div>
        <div class="cred-row"><span class="cred-label">SMTP Server</span><span class="cred-value">mail.laptertech.store</span></div>
      </div>

      <center><a href="${details.controlPanel}" class="btn">💻 Open Control Panel</a></center>
    `;
  }

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #008099, #0b2149); padding: 36px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 18px; color: #0b2149; font-weight: 600; margin-bottom: 12px; }
    .intro { color: #64748b; font-size: 14px; line-height: 1.7; margin-bottom: 28px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #008099; margin: 20px 0 10px 0; }
    .cred-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 16px; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .cred-row:last-child { border-bottom: none; padding-bottom: 0; }
    .cred-label { color: #94a3b8; font-weight: 500; }
    .cred-value { color: #0b2149; font-weight: 600; font-family: monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #008099, #0b2149); color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px; }
    .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
  </style></head>
  <body>
  <div class="container">
    <div class="header">
      <h1>&#127881; Welcome to Lapter Technologies!</h1>
      <p>${isDatabase ? 'Your PostgreSQL Cloud Database is Ready' : 'Your Cloud Infrastructure is Active'}</p>
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      <p><strong>Lapter Technologies</strong> &mdash; info@laptertech.store</p>
      <p>If you did not sign up for this account, please contact us immediately.</p>
    </div>
  </div>
  </body></html>
  `;

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not configured, skipping welcome email");
    return { skipped: true };
  }

  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: userEmail, name: userName }] }],
    from: { email: 'info@laptertech.store', name: 'Lapter Technologies' },
    subject: subject,
    content: [{ type: 'text/html', value: htmlContent }]
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`SendGrid error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Helper to provision PostgreSQL Client Database and User
async function provisionPostgresDatabase(dbUser, dbPassword, dbName, clientName, clientEmail) {
  const adminClient = new Client({
    host: process.env.PG_HOST || '162.35.98.198',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_ADMIN_USER || 'client_user',
    password: process.env.PG_ADMIN_PASSWORD || 'vJaMqRDoa2F2XmU7IGNd9zbJ',
    database: process.env.PG_ADMIN_DB || 'client_db',
    connectionTimeoutMillis: 8000,
  });

  await adminClient.connect();
  try {
    const safeUser = dbUser.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const safeDb = dbName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const safePass = dbPassword.replace(/'/g, "''");

    // 1. Create client registrations audit table if not exists
    await adminClient.query(`
      CREATE TABLE IF NOT EXISTS client_registrations (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        db_name VARCHAR(100),
        db_user VARCHAR(100),
        domain VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Role / User
    await adminClient.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${safeUser}') THEN
        CREATE ROLE "${safeUser}" WITH LOGIN PASSWORD '${safePass}';
      ELSE
        ALTER ROLE "${safeUser}" WITH PASSWORD '${safePass}';
      END IF;
    END
    $$;`);

    // 3. Create Database
    const checkDb = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = '${safeDb}'`);
    if (checkDb.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE "${safeDb}" OWNER "${safeUser}";`);
    } else {
      await adminClient.query(`ALTER DATABASE "${safeDb}" OWNER TO "${safeUser}";`);
    }

    // 4. Grant full privileges
    await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE "${safeDb}" TO "${safeUser}";`);

    // 5. Audit log
    await adminClient.query(`
      INSERT INTO client_registrations (client_name, client_email, service_type, db_name, db_user)
      VALUES ($1, $2, $3, $4, $5);
    `, [clientName, clientEmail, 'database', safeDb, safeUser]);

    return {
      success: true,
      dbName: safeDb,
      dbUser: safeUser
    };
  } finally {
    await adminClient.end();
  }
}

function callHestia(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const payload = {
      access_key: process.env.HESTIA_ACCESS_KEY_ID,
      secret_key: process.env.HESTIA_SECRET_ACCESS_KEY,
      cmd: cmd
    };
    
    args.forEach((arg, i) => {
      payload[`arg${i + 1}`] = arg;
    });

    const body = JSON.stringify(payload);
    
    const options = {
      hostname: process.env.HESTIA_HOST,
      port: 8083,
      path: '/api/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const exitCode = res.headers['hestia-exit-code'];
        resolve({
          statusCode: res.statusCode,
          exitCode: exitCode ? parseInt(exitCode, 10) : 0,
          body: data.trim()
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, plan, domain, serviceType, mailboxCount, mailboxStorage, password: userCustomPassword, dbName: userCustomDbName } = req.body;

    if (!name || !email || !plan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const defaultUsername = (emailPrefix.substring(0, 8) + uniqueSuffix).substring(0, 12);

    // Generate secure random password if not provided
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let generatedPassword = '';
    for (let i = 0; i < 14; i++) {
      generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalPassword = (userCustomPassword && userCustomPassword.trim().length >= 8) 
      ? userCustomPassword.trim() 
      : generatedPassword;

    // -------------------------------------------------------------
    // 1. MANAGED POSTGRESQL DATABASE PROVISIONING
    // -------------------------------------------------------------
    if (serviceType === 'database' || serviceType === 'postgres' || (plan && plan.toLowerCase().includes('database')) || (plan && plan.toLowerCase().includes('postgresql'))) {
      const cleanDbBase = userCustomDbName 
        ? userCustomDbName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() 
        : `${defaultUsername}_db`;
      const finalDbName = cleanDbBase.endsWith('_db') ? cleanDbBase : `${cleanDbBase}_db`;
      const finalDbUser = defaultUsername;
      const pgHost = process.env.PG_HOST || '162.35.98.198';
      const pgPort = 5432;

      // Provision on PostgreSQL engine
      await provisionPostgresDatabase(finalDbUser, finalPassword, finalDbName, name, email);

      const connectionString = `postgresql://${finalDbUser}:${finalPassword}@${pgHost}:${pgPort}/${finalDbName}?sslmode=prefer`;

      // Notify admin copy via FormSubmit
      try {
        await fetch("https://formsubmit.co/ajax/84561253b0208cfa5a295d9bee25ff9d", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _subject: `🚀 New Managed PostgreSQL Database Provisioned: ${finalDbName}`,
            name: name,
            email: email,
            plan: plan || 'Managed PostgreSQL 18 Cloud DB',
            dbName: finalDbName,
            dbUser: finalDbUser,
            password: finalPassword,
            host: pgHost,
            port: pgPort,
            connectionString: connectionString
          })
        });
      } catch (e) {}

      const responseDetails = {
        success: true,
        serviceType: 'database',
        plan: plan || 'Managed PostgreSQL 18 Cloud DB',
        username: finalDbUser,
        dbUser: finalDbUser,
        dbName: finalDbName,
        password: finalPassword,
        host: pgHost,
        port: pgPort,
        connectionString: connectionString,
        webDashboard: 'https://db.laptertech.store',
        sslMode: 'prefer'
      };

      try {
        await sendWelcomeEmail(email, name, responseDetails);
      } catch (e) {
        console.error("Welcome email delivery notice:", e);
      }

      return res.status(200).json(responseDetails);
    }

    // -------------------------------------------------------------
    // 2. BUSINESS EMAIL ONLY PROVISIONING
    // -------------------------------------------------------------
    const username = defaultUsername;
    const clientDomain = domain ? domain.trim() : `${username}.laptertech.store`;

    const userRes = await callHestia('v-add-user', [username, finalPassword, email]);
    if (userRes.exitCode > 0) {
      return res.status(500).json({ 
        error: 'Failed to create user account', 
        details: userRes.body 
      });
    }

    if (serviceType === 'email-only') {
      await callHestia('v-add-mail-domain', [username, clientDomain]);
      await callHestia('v-add-mail-account', [username, clientDomain, 'info', finalPassword]);

      const maxMailboxes = mailboxCount ? String(mailboxCount) : '5';
      const quotaInMB = mailboxStorage ? String(parseInt(mailboxStorage, 10) * 1024) : '5120';

      await callHestia('v-change-user-config-value', [username, 'WEB_DOMAINS', '0']);
      await callHestia('v-change-user-config-value', [username, 'DATABASES', '0']);
      await callHestia('v-change-user-config-value', [username, 'MAIL_DOMAINS', '1']);
      await callHestia('v-change-user-config-value', [username, 'MAIL_ACCOUNTS', maxMailboxes]);
      await callHestia('v-change-user-config-value', [username, 'DISK_QUOTA', quotaInMB]);

      try {
        await fetch("https://formsubmit.co/ajax/84561253b0208cfa5a295d9bee25ff9d", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _subject: `New Custom Email Hosting: ${plan}`,
            username: username,
            name: name,
            email: email,
            domain: clientDomain,
            mailboxLimit: maxMailboxes,
            storageQuota: `${mailboxStorage || 5} GB`,
            password: finalPassword
          })
        });
      } catch (e) {}

      const responseDetails = {
        success: true,
        serviceType: 'email-only',
        username: username,
        password: finalPassword,
        domain: clientDomain,
        emailServer: 'mail.laptertech.store',
        emailAccount: `info@${clientDomain}`,
        emailPassword: finalPassword,
        mailboxLimit: maxMailboxes,
        storageQuota: `${mailboxStorage || 5} GB`,
        controlPanel: 'https://mail.laptertech.store:8083',
        webmail: 'https://webmail.laptertech.store'
      };

      try { await sendWelcomeEmail(email, name, responseDetails); } catch (e) { console.error("Email failed:", e); }

      return res.status(200).json(responseDetails);

    } else {
      // -----------------------------------------------------------
      // 3. FULL WEB HOSTING PROVISIONING (Default)
      // -----------------------------------------------------------
      await callHestia('v-add-web-domain', [username, clientDomain]);
      await callHestia('v-add-mail-domain', [username, clientDomain]);
      await callHestia('v-add-mail-account', [username, clientDomain, 'info', finalPassword]);

      const dbNameSuffix = 'db1';
      const dbUserSuffix = 'user1';
      const dbName = `${username}_${dbNameSuffix}`;
      const dbUser = `${username}_${dbUserSuffix}`;
      await callHestia('v-add-database', [username, dbNameSuffix, dbUserSuffix, finalPassword]);

      try {
        await fetch("https://formsubmit.co/ajax/84561253b0208cfa5a295d9bee25ff9d", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _subject: `New Web Hosting Provisioned: ${plan}`,
            username: username,
            name: name,
            email: email,
            plan: plan,
            domain: clientDomain,
            password: finalPassword,
            database: dbName,
            dbUser: dbUser
          })
        });
      } catch (e) {}

      const responseDetails = {
        success: true,
        serviceType: 'web-hosting',
        username: username,
        password: finalPassword,
        domain: clientDomain,
        emailServer: 'mail.laptertech.store',
        emailAccount: `info@${clientDomain}`,
        emailPassword: finalPassword,
        dbName: dbName,
        dbUser: dbUser,
        dbPassword: finalPassword,
        controlPanel: 'https://mail.laptertech.store:8083',
        webmail: 'https://webmail.laptertech.store'
      };

      try { await sendWelcomeEmail(email, name, responseDetails); } catch (e) { console.error("Email failed:", e); }

      return res.status(200).json(responseDetails);
    }

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
