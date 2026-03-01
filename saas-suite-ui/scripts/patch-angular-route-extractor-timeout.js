#!/usr/bin/env node
/**
 * Reaplica o aumento de timeout na extração de rotas do @angular/build (SSR).
 * Após `pnpm install`, o arquivo em node_modules volta ao original (30s) e o build
 * do shop pode falhar com "Routes extraction was aborted. TimeoutError".
 * Este script ajusta para 600s (10 min). Execute após instalar dependências se o
 * build do shop falhar por timeout.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '../node_modules/@angular/build/src/utils/server-rendering/routes-extractor-worker.js'
);

if (!fs.existsSync(file)) {
  console.warn('patch-angular-route-extractor-timeout: arquivo não encontrado, pulando.');
  process.exit(0);
}

let content = fs.readFileSync(file, 'utf8');
const target = 'signal: AbortSignal.timeout(600_000),';
if (content.includes(target)) {
  console.log('patch-angular-route-extractor-timeout: patch já aplicado.');
  process.exit(0);
}
const match = content.match(/signal: AbortSignal\.timeout\(\d+_?\d*\),/);
if (!match) {
  console.warn('patch-angular-route-extractor-timeout: versão do @angular/build diferente, pulando.');
  process.exit(0);
}
content = content.replace(match[0], target);
fs.writeFileSync(file, content);
console.log('patch-angular-route-extractor-timeout: timeout da extração de rotas ajustado para 600s.');
