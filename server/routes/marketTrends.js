const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const scriptPath = path.resolve(__dirname, '..', '..', 'ml-model', 'future-price', 'predict_future.py');
const scriptDir = path.dirname(scriptPath);
const configuredPython = process.env.PYTHON_PATH;
const windowsPython = 'C:\\Users\\Pradeep Naganur\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
const pythonExecutable = configuredPython || (fs.existsSync(windowsPython) ? windowsPython : 'python');

const runModel = (args, res) => {
  const py = spawn(pythonExecutable, [scriptPath, ...args], { cwd: scriptDir });
  let out = '';
  let err = '';
  let responded = false;

  py.stdout.on('data', data => { out += data.toString(); });
  py.stderr.on('data', data => { err += data.toString(); });
  py.on('error', error => {
    responded = true;
    res.status(500).json({ error: 'python_unavailable', detail: error.message });
  });
  py.on('close', code => {
    if (responded) return;
    try {
      const parsed = JSON.parse(out);
      if (code !== 0 || parsed.error) return res.status(404).json(parsed);
      return res.json(parsed);
    } catch (error) {
      return res.status(500).json({ error: 'parse_failed', detail: err || out || error.message });
    }
  });
};

router.get('/options', (req, res) => runModel(['--options'], res));
router.get('/:locality', (req, res) => runModel([req.params.locality, '--json'], res));

module.exports = router;