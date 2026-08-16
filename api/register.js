const https = require('https');

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
    const { name, email, plan, domain } = req.body;

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

    // 3. Create User account
    const userRes = await callHestia('v-add-user', [username, password, email]);
    if (userRes.exitCode > 0) {
      return res.status(500).json({ 
        error: 'Failed to create user account', 
        details: userRes.body 
      });
    }

    const clientDomain = domain ? domain.trim() : `${username}.laptertech.store`;

    // 4. Create Web Domain & Mail Domain
    await callHestia('v-add-web-domain', [username, clientDomain]);
    await callHestia('v-add-mail-domain', [username, clientDomain]);

    // 5. Create default email mailbox (info@)
    await callHestia('v-add-mail-account', [username, clientDomain, 'info', password]);

    // 6. Create MySQL Database
    const dbNameSuffix = 'db1';
    const dbUserSuffix = 'user1';
    const dbName = `${username}_${dbNameSuffix}`;
    const dbUser = `${username}_${dbUserSuffix}`;
    await callHestia('v-add-database', [username, dbNameSuffix, dbUserSuffix, password]);

    // Send copy of credentials to the admin email using FormSubmit.co
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      
      await fetch("https://formsubmit.co/ajax/84561253b0208cfa5a295d9bee25ff9d", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              _subject: `New Hosting Account Provisioned: ${plan}`,
              username: username,
              name: name,
              email: email,
              plan: plan,
              domain: clientDomain,
              password: password,
              database: dbName,
              dbUser: dbUser
          }),
          signal: id.signal
      });
      clearTimeout(id);
    } catch (e) {
      // Ignore notification failures
    }

    return res.status(200).json({
      success: true,
      username: username,
      password: password,
      domain: clientDomain,
      emailServer: 'mail.laptertech.store',
      emailAccount: `info@${clientDomain}`,
      emailPassword: password,
      dbName: dbName,
      dbUser: dbUser,
      dbPassword: password,
      controlPanel: 'https://162.35.98.198:8083',
      webmail: 'https://162.35.98.198:8083/webmail/'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
