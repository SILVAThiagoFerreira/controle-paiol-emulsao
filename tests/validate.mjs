import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = ['index.html', 'app.js', 'styles.css', 'config.js', 'backend/Code.gs'];

for (const file of required) {
  const stat = await fs.stat(path.join(root, file));
  assert.ok(stat.isFile(), `arquivo ausente: ${file}`);
}

const app = await fs.readFile(path.join(root, 'app.js'), 'utf8');
const css = await fs.readFile(path.join(root, 'styles.css'), 'utf8');
const backend = await fs.readFile(path.join(root, 'backend/Code.gs'), 'utf8');

for (const marker of [
  'updateClosingStockPanel',
  'closing-stock-input',
  'data-full-tank',
  'data-full-value',
  'full-tank-btn',
  'Cheio',
  'Math.min(stock, Number(tank.capacity) || stock)',
]) {
  assert.match(app, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `contrato ausente no app: ${marker}`);
}

assert.match(app, /event\.target\.matches\('\[data-full-tank\]'\)/, 'o clique no botão Cheio precisa ser tratado');
assert.match(app, /field\.dataset\.tank === event\.target\.dataset\.fullTank/, 'o botão Cheio precisa localizar o input do tanque correto');
assert.match(app, /input\.value = Number\(event\.target\.dataset\.fullValue \|\| 0\)\.toFixed\(2\)/, 'o botão Cheio precisa preencher o valor máximo formatado');
assert.match(css, /\.closing-stock-control/, 'o input e o botão Cheio precisam ficar agrupados no layout');
assert.match(css, /\.full-tank-btn/, 'o botão Cheio precisa ter estilo próprio');
assert.match(backend, /Capacidade \(kg\)/, 'a planilha precisa manter capacidade máxima do tanque');

console.log(`validate: ${required.length} arquivos e contrato do botão Cheio OK`);
