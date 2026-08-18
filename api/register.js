const https = require('https');

// Send email via SendGrid HTTP Web API (bypasses all SMTP port blocks)
async function sendWelcomeEmail(userEmail, userName, details) {
  const isEmailOnly = details.serviceType === 'email-only';

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
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #008099; margin-bottom: 12px; }
    .cred-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .cred-row:last-child { border-bottom: none; padding-bottom: 0; }
    .cred-label { color: #94a3b8; font-weight: 500; }
    .cred-value { color: #0b2149; font-weight: 600; font-family: monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #008099, #0b2149); color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px; }
    .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
  </style></head>
  <body>
  <div class="container">
    <div class="header">
      <h1>&#127881; Welcome to Lapter Technologies!</h1>
      <p>Your hosting account is ready</p>
    </div>
    <div class="body">
      <div class="greeting">Hello, ${userName}!</div>
      <div class="intro">Your ${isEmailOnly ? 'Business Email' : 'Web Hosting'} account has been successfully provisioned. Below are your login credentials — please save them in a secure place.</div>

      <div class="section-title">&#128274; Control Panel Access</div>
      <div class="cred-box">
        <div class="cred-row"><span class="cred-label">Username</span><span class="cred-value">${details.username}</span></div>
        <div class="cred-row"><span class="cred-label">Password</span><span class="cred-value">${details.password}</span></div>
        <div class="cred-row"><span class="cred-label">Domain</span><span class="cred-value">${details.domain}</span></div>
        <div class="cred-row"><span class="cred-label">Plan</span><span class="cred-value">${isEmailOnly ? 'Business Email Only' : 'Web Hosting'}</span></div>
      </div>

      <div class="section-title">&#128231; Business Email</div>
      <div class="cred-box">
        <div class="cred-row"><span class="cred-label">Email Address</span><span class="cred-value">${details.emailAccount}</span></div>
        <div class="cred-row"><span class="cred-label">Email Password</span><span class="cred-value">${details.emailPassword}</span></div>
        <div class="cred-row"><span class="cred-label">Webmail URL</span><span class="cred-value">${details.webmail}</span></div>
        <div class="cred-row"><span class="cred-label">IMAP Server</span><span class="cred-value">mail.laptertech.store</span></div>
        <div class="cred-row"><span class="cred-label">SMTP Server</span><span class="cred-value">mail.laptertech.store</span></div>
      </div>

      <center><a href="${details.controlPanel}" class="btn">&#128187; Open Control Panel</a></center>
    </div>
    <div class="footer">
      <p><strong>Lapter Technologies</strong> &mdash; info@laptertech.store</p>
      <p>If you did not sign up for this account, please contact us immediately.</p>
    </div>
  </div>
  </body></html>
  `;

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: userEmail, name: userName }] }],
    from: { email: 'info@laptertech.store', name: 'Lapter Technologies' },
    subject: `Your Lapter Technologies Account is Ready 🎉`,
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

function callHestia(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const payload = {
      access_key: process.env.HESTIA_ACCESS_KEY_ID || "zaShGnEOGtUkf1nR7ouT",
      secret_key: process.env.HESTIA_SECRET_ACCESS_KEY || "sDvEzLSzQjEbuTXAIXtbYXSdaK-_vOQvJAh46bfg",
      cmd: cmd
    };
    
    args.forEach((arg, i) => {
      payload[`arg${i + 1}`] = arg;
    });

    const body = JSON.stringify(payload);
    
    const options = {
      hostname: '162.35.98.198',
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
    const { name, email, plan, domain, serviceType, mailboxCount, mailboxStorage } = req.body;

    if (!name || !email || !plan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Create a unique username
    const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = (emailPrefix.substring(0, 8) + uniqueSuffix).substring(0, 12);

    // 2. Generate a secure random password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 3. Create HestiaCP User account
    const userRes = await callHestia('v-add-user', [username, password, email]);
    if (userRes.exitCode > 0) {
      return res.status(500).json({ 
        error: 'Failed to create user account', 
        details: userRes.body 
      });
    }

    const clientDomain = domain ? domain.trim() : `${username}.laptertech.store`;

    if (serviceType === 'email-only') {
      // Setup Standalone Email Hosting
      await callHestia('v-add-mail-domain', [username, clientDomain]);
      await callHestia('v-add-mail-account', [username, clientDomain, 'info', password]);

      // Enforce custom limits for Standalone Email Hosting
      const maxMailboxes = mailboxCount ? String(mailboxCount) : '5';
      const quotaInMB = mailboxStorage ? String(parseInt(mailboxStorage, 10) * 1024) : '5120'; // Default 5GB

      await callHestia('v-change-user-config-value', [username, 'WEB_DOMAINS', '0']);
      await callHestia('v-change-user-config-value', [username, 'DATABASES', '0']);
      await callHestia('v-change-user-config-value', [username, 'MAIL_DOMAINS', '1']);
      await callHestia('v-change-user-config-value', [username, 'MAIL_ACCOUNTS', maxMailboxes]);
      await callHestia('v-change-user-config-value', [username, 'DISK_QUOTA', quotaInMB]);

      // Send copy of credentials to admin
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
                password: password
            })
        });
      } catch (e) {}

      const responseDetails = {
        success: true,
        serviceType: 'email-only',
        username: username,
        password: password,
        domain: clientDomain,
        emailServer: 'mail.laptertech.store',
        emailAccount: `info@${clientDomain}`,
        emailPassword: password,
        mailboxLimit: maxMailboxes,
        storageQuota: `${mailboxStorage || 5} GB`,
        controlPanel: 'https://mail.laptertech.store:8083',
        webmail: 'http://mail.laptertech.store/webmail/'
      };

      try { await sendWelcomeEmail(email, name, responseDetails); } catch (e) { console.error("Email failed:", e); }

      return res.status(200).json(responseDetails);

    } else {
      // Setup Full Web Hosting (Default)
      await callHestia('v-add-web-domain', [username, clientDomain]);
      await callHestia('v-add-mail-domain', [username, clientDomain]);
      await callHestia('v-add-mail-account', [username, clientDomain, 'info', password]);

      const dbNameSuffix = 'db1';
      const dbUserSuffix = 'user1';
      const dbName = `${username}_${dbNameSuffix}`;
      const dbUser = `${username}_${dbUserSuffix}`;
      await callHestia('v-add-database', [username, dbNameSuffix, dbUserSuffix, password]);

      // Send copy of credentials to admin
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
                password: password,
                database: dbName,
                dbUser: dbUser
            })
        });
      } catch (e) {}

      const responseDetails = {
        success: true,
        serviceType: 'web-hosting',
        username: username,
        password: password,
        domain: clientDomain,
        emailServer: 'mail.laptertech.store',
        emailAccount: `info@${clientDomain}`,
        emailPassword: password,
        dbName: dbName,
        dbUser: dbUser,
        dbPassword: password,
        controlPanel: 'https://mail.laptertech.store:8083',
        webmail: 'http://mail.laptertech.store/webmail/'
      };

      try { await sendWelcomeEmail(email, name, responseDetails); } catch (e) { console.error("Email failed:", e); }

      return res.status(200).json(responseDetails);
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
