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
    const { adminPassword, action, targetUser, newPassword } = req.body;

    // Security Gate
    if (adminPassword !== 'lapteradmin123') {
      return res.status(401).json({ error: 'Unauthorized: Invalid Administrator Password' });
    }

    if (action === 'list') {
      const apiRes = await callHestia('v-list-users', ['json']);
      if (apiRes.exitCode > 0) {
        return res.status(500).json({ error: 'Failed to list users', details: apiRes.body });
      }
      return res.status(200).json({ success: true, users: JSON.parse(apiRes.body) });
    }

    if (action === 'suspend') {
      if (!targetUser) return res.status(400).json({ error: 'Missing target user' });
      const apiRes = await callHestia('v-suspend-user', [targetUser]);
      if (apiRes.exitCode > 0) {
        return res.status(500).json({ error: 'Failed to suspend user', details: apiRes.body });
      }
      return res.status(200).json({ success: true });
    }

    if (action === 'unsuspend') {
      if (!targetUser) return res.status(400).json({ error: 'Missing target user' });
      const apiRes = await callHestia('v-unsuspend-user', [targetUser]);
      if (apiRes.exitCode > 0) {
        return res.status(500).json({ error: 'Failed to unsuspend user', details: apiRes.body });
      }
      return res.status(200).json({ success: true });
    }

    if (action === 'delete') {
      if (!targetUser) return res.status(400).json({ error: 'Missing target user' });
      if (targetUser === 'lapter') return res.status(400).json({ error: 'Cannot delete admin account' });
      const apiRes = await callHestia('v-delete-user', [targetUser]);
      if (apiRes.exitCode > 0) {
        return res.status(500).json({ error: 'Failed to delete user', details: apiRes.body });
      }
      return res.status(200).json({ success: true });
    }

    if (action === 'password') {
      if (!targetUser || !newPassword) return res.status(400).json({ error: 'Missing parameters' });
      const apiRes = await callHestia('v-change-user-password', [targetUser, newPassword]);
      if (apiRes.exitCode > 0) {
        return res.status(500).json({ error: 'Failed to change password', details: apiRes.body });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action specified' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
