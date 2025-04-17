import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const PORT = 32145;
const app = express();

app.use(cors());

const frameworkName = process.argv[2];

if (!frameworkName) {
  console.error("Framework name must be provided via 'npm run start <framework-name>'");
  process.exit(1);
}

const configPath = path.resolve('config.json');
if (!fs.existsSync(configPath)) {
  console.error("Missing config.json");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

if (frameworkName === 'js') {
  config.actions = [ "first-render" ];
}

const { actions, testCases, testsPerCase, outFile, dir: dirs } = config;

let currentDirIndex = 0;
let currentActionIndex = 0;
let currentTestCaseIndex = 0;
let currentTestIndex = 0;
let finished = false;

const results: Record<string, Record<string, Record<number, number[]>>> = {};

app.get('/testcase/next', (req, res) => {
  if (finished) {
    console.log('committed and exit');
    res.status(200).send("{\"finished\":true}");
    server.close();
    process.exit(0);
  }

  const dir = dirs[currentDirIndex];
  const action = actions[currentActionIndex];
  const testCase = testCases[currentTestCaseIndex];
  const testIndex = currentTestIndex;


  const filename = path.join(dir, `test.${testCase}.${testIndex + 1}.json`);
  if (!fs.existsSync(filename)) {
    return res.status(404).send("Test file not found: " + filename);
  }

  const data = JSON.parse(fs.readFileSync(filename, 'utf-8'));
  data.type = action;
  res.json(data);
});

app.get('/testcase/benchmark', (req, res) => {
  const time = parseFloat(req.query.time as string);
  if (isNaN(time)) return res.status(400).send("Invalid time");

  const dir = dirs[currentDirIndex];
  const action = actions[currentActionIndex];
  const testCase = testCases[currentTestCaseIndex];

  if (!results[dir]) results[dir] = {};
  if (!results[dir][action]) results[dir][action] = {};
  if (!results[dir][action][testCase]) results[dir][action][testCase] = [];

  results[dir][action][testCase].push(time);
  currentTestIndex++;

  if (currentTestIndex >= testsPerCase) {
    currentTestIndex = 0;
    currentTestCaseIndex++;
    if (currentTestCaseIndex >= testCases.length) {
      currentTestCaseIndex = 0;
      currentActionIndex++;
      if (currentActionIndex >= actions.length) {
        currentActionIndex = 0;
        currentDirIndex++;
        if (currentDirIndex >= dirs.length) {
          console.log('done');
          finished = true;
          generateReports();
          return res.send("All benchmarks done.");
        }
      }
    }
  }

  res.send("Benchmark result saved");
});

function generateReports() {
  const csvLines: string[] = [`Framework: ${frameworkName}`, ''];
  let html = `
    <html>
    <head>
      <title>Benchmark Report - ${frameworkName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #fafafa; }
        h1, h2, h3 { color: #222; }
        table { border-collapse: collapse; margin-bottom: 40px; width: 100%; box-shadow: 0 0 8px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
        th { background-color: #f9f9f9; }
        tr:nth-child(even) { background-color: #f1f1f1; }
      </style>
    </head>
    <body>
    <h1>Benchmark Report for "${frameworkName}"</h1>
  `;

  for (const dir of dirs) {
    html += `<h2>Dataset: ${dir}</h2>`;
    csvLines.push(`Dataset: ${dir}`);

    for (const action of actions) {
      const data = results[dir]?.[action] || {};
      const header = ["TestCase", ...Array.from({ length: testsPerCase }, (_, i) => `Run ${i + 1}`)];
      csvLines.push(`Action: ${action}`);
      csvLines.push(header.join(";"));

      html += `<h3>Action: ${action}</h3><table><thead><tr>`;
      header.forEach(h => html += `<th>${h}</th>`);
      html += `</tr></thead><tbody>`;

      for (const testCase of testCases) {
        const row = data[testCase] || [];
        csvLines.push([testCase, ...row.map(v => v.toFixed(2).replaceAll('.',','))].join(";"));

        html += `<tr><td>${testCase}</td>`;
        for (let i = 0; i < testsPerCase; i++) {
          html += `<td>${row[i]?.toFixed(2) ?? '-'}</td>`;
        }
        html += `</tr>`;
      }

      csvLines.push('');
      html += `</tbody></table>`;
    }
  }

  html += `</body></html>`;

  console.log('writing to ', path.join('reports', frameworkName + "-" + outFile + ".csv"));
  fs.writeFileSync(path.join('reports', frameworkName + "-" + outFile + ".csv"), csvLines.join("\n"));
  fs.writeFileSync(path.join('reports', frameworkName + "-" + outFile + ".html"), html);

  console.log("CSV and HTML reports saved.");
}

let server = app.listen(PORT, () => {
  console.log(`Benchmark server for ${frameworkName} is running at http://localhost:${PORT}`);
});
