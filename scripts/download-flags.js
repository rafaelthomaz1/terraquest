// Download all country flags from flagcdn.com to public/flags/
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'flags');

const codes = [
  "af","al","dz","ao","ag","ar","am","au","at","az","bs","bh","bd","bb","by",
  "be","bz","bj","bt","bo","ba","bw","br","bn","bg","bf","bi","kh","cm","ca",
  "cv","cf","td","cl","cn","co","km","cg","cd","cr","ci","hr","cu","cy","cz",
  "dk","dj","dm","do","ec","eg","sv","gq","er","ee","sz","et","fj","fi","fr",
  "ga","gm","ge","de","gh","gr","gd","gt","gn","gw","gy","ht","hn","hu","is",
  "in","id","ir","iq","ie","il","it","jm","jp","jo","kz","ke","ki","kp","kr",
  "kw","kg","la","lv","lb","ls","lr","ly","li","lt","lu","mg","mw","my","mv",
  "ml","mt","mh","mr","mu","mx","fm","md","mc","mn","me","ma","mz","mm","na",
  "nr","np","nl","nz","ni","ne","ng","mk","no","om","pk","pw","pa","pg","py",
  "pe","ph","pl","pt","qa","ro","ru","rw","kn","lc","vc","ws","sm","st","sa",
  "sn","rs","sc","sl","sg","sk","si","sb","so","za","es","lk","sd","sr","se",
  "ch","sy","tj","tz","th","tl","tg","to","tt","tn","tr","tm","tv","ug","ua",
  "ae","gb","us","uy","uz","vu","va","ve","vn","ye","zm","zw","ps","ss"
];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let done = 0;
let failed = 0;
const total = codes.length;
const CONCURRENCY = 10;
let idx = 0;

function download(code) {
  return new Promise((resolve) => {
    const dest = path.join(outDir, `${code}.png`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) {
      done++;
      resolve();
      return;
    }
    const url = `https://flagcdn.com/w320/${code}.png`;
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.error(`FAIL ${code}: HTTP ${res.statusCode}`);
        failed++;
        res.resume();
        resolve();
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); done++; resolve(); });
    }).on('error', (err) => {
      console.error(`FAIL ${code}: ${err.message}`);
      failed++;
      resolve();
    });
  });
}

async function run() {
  console.log(`Downloading ${total} flags to ${outDir}...`);
  const queue = [...codes];

  async function worker() {
    while (queue.length > 0) {
      const code = queue.shift();
      await download(code);
      process.stdout.write(`\r  ${done}/${total} downloaded, ${failed} failed`);
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);

  console.log(`\nDone! ${done} downloaded, ${failed} failed.`);
}

run();
