const https = require('https');
const nodemailer = require('nodemailer');

async function sendWelcomeEmail(userEmail, details) {
  const transporter = nodemailer.createTransport({
    host: 'mail.laptertech.store',
    port: 465,
    secure: true,
    auth: {
      user: 'info@laptertech.store',
      pass: 'LapterMail2026!'
    }
  });

  const htmlContent = `
    <h2>Welcome to Lapter Technologies Hosting!</h2>
    <p>Your account has been successfully provisioned. Here are your login details:</p>
    <ul>
      <li><strong>Username:</strong> ${details.username}</li>
      <li><strong>Password:</strong> ${details.password}</li>
      <li><strong>Domain:</strong> ${details.domain}</li>
      <li><strong>Control Panel:</strong> <a href="${details.controlPanel}">${details.controlPanel}</a></li>
      <li><strong>Webmail:</strong> <a href="${details.webmail}">${details.webmail}</a></li>
    </ul>
    <p>Please keep these credentials safe.</p>
    <p>Best Regards,<br>The Lapter Technologies Team</p>
  `;

  await transporter.sendMail({
    from: '"Lapter Technologies" <info@laptertech.store>',
    to: userEmail,
    subject: 'Your Lapter Technologies Account Details',
    html: htmlContent
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
        controlPanel: 'https://laptertech.store:8083',
        webmail: 'http://laptertech.store/webmail/'
      };

      try { await sendWelcomeEmail(email, responseDetails); } catch (e) { console.error("Email failed:", e); }

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
        controlPanel: 'https://laptertech.store:8083',
        webmail: 'http://laptertech.store/webmail/'
      };

      try { await sendWelcomeEmail(email, responseDetails); } catch (e) { console.error("Email failed:", e); }

      return res.status(200).json(responseDetails);
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
