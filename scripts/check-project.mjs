import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const requiredFiles = [
  'index.html',
  'supabase-config.js',
  'assets/app.js',
  'assets/js/state.js',
  'assets/js/data-service.js',
  'assets/js/render-cards.js',
  'assets/js/dialogue-reader.js',
  'assets/js/flashcard.js',
  'assets/js/quiz.js',
  'assets/js/numbers.js',
  'assets/js/dashboard-controller.js',
  'assets/js/events.js'
];
const requiredIds = [
  'loadingState',
  'mainContent',
  'cardGrid',
  'searchInput',
  'flashOverlay',
  'quizOverlay',
  'numOverlay',
  'toastMsg'
];
const expectedScriptOrder = [
  'supabase-config.js',
  'assets/local-dialogues.js',
  'assets/js/state.js',
  'assets/js/data-service.js',
  'assets/js/render-cards.js',
  'assets/js/dialogue-reader.js',
  'assets/js/flashcard.js',
  'assets/js/quiz.js',
  'assets/js/numbers.js',
  'assets/js/dashboard-controller.js',
  'assets/js/events.js',
  'assets/app.js'
];

async function assertRequiredFiles() {
  await Promise.all(requiredFiles.map(file => access(path.join(root, file))));
}

async function assertRequiredDomIds() {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const missingIds = requiredIds.filter(id => !html.includes(`id="${id}"`));
  if (missingIds.length) throw new Error(`index.html 필수 DOM ID 누락: ${missingIds.join(', ')}`);
}

async function assertReferencedDomIds() {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const files = await getJavaScriptFiles(path.join(root, 'assets'));
  const referencedIds = new Set();
  const idPatterns = [
    /\$\(['"]([^'"]+)['"]\)/g,
    /document\.getElementById\(['"]([^'"]+)['"]\)/g
  ];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const pattern of idPatterns) {
      for (const match of source.matchAll(pattern)) referencedIds.add(match[1]);
    }
  }

  const missingIds = [...referencedIds].filter(id => !html.includes(`id="${id}"`));
  if (missingIds.length) throw new Error(`JavaScript가 참조하는 DOM ID 누락: ${missingIds.join(', ')}`);
}

async function assertScriptOrder() {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  let previousIndex = -1;
  for (const script of expectedScriptOrder) {
    const currentIndex = html.indexOf(`src="${script}"`);
    if (currentIndex === -1) throw new Error(`index.html 스크립트 누락: ${script}`);
    if (currentIndex <= previousIndex) throw new Error(`index.html 스크립트 순서 오류: ${script}`);
    previousIndex = currentIndex;
  }
}

async function getJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return getJavaScriptFiles(target);
    return entry.isFile() && entry.name.endsWith('.js') ? [target] : [];
  }));
  return files.flat();
}

async function assertJavaScriptSyntax() {
  const files = await getJavaScriptFiles(path.join(root, 'assets'));
  files.push(path.join(root, 'supabase-config.js'));
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr.trim() || `문법 검사 실패: ${file}`);
  }
}

await assertRequiredFiles();
await assertRequiredDomIds();
await assertReferencedDomIds();
await assertScriptOrder();
await assertJavaScriptSyntax();
console.log('Project checks passed.');
