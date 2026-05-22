const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.resolve(__dirname, '..', '..', 'ml-model', 'predict.py');

router.get('/options', (req, res) => {
  const py = spawn('python', [scriptPath, '--options']);
  let out = '';
  let err = '';
  py.stdout.on('data', d => out += d.toString());
  py.stderr.on('data', d => err += d.toString());
  py.on('close', code => {
    if (code !== 0) return res.status(500).json({ error: 'python_error', detail: err || out });
    try {
      const parsed = JSON.parse(out);
      return res.json(parsed);
    } catch (e) {
      return res.status(500).json({ error: 'parse_failed', detail: e.message });
    }
  });
});

router.post('/', (req, res) => {
  const payload = req.body || {};
  const py = spawn('python', [scriptPath]);
  let out = '';
  let err = '';

  py.stdout.on('data', d => out += d.toString());
  py.stderr.on('data', d => err += d.toString());

  py.on('close', code => {
    if (code !== 0) return res.status(500).json({ error: 'python_error', detail: err || out });
    try {
      const parsed = JSON.parse(out);
      if (parsed.error) return res.status(500).json(parsed);
      return res.json(parsed);
    } catch (e) {
      return res.status(500).json({ error: 'parse_failed', detail: e.message });
    }
  });

  // send JSON payload to python stdin
  try {
    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  } catch (e) {
    return res.status(500).json({ error: 'stdin_failed', detail: e.message });
  }
});

module.exports = router;
