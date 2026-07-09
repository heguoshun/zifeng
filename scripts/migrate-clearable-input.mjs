import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../src/prototypes/iot-platform-home');

const SKIP_FILES = new Set([
    'ClearableInput.tsx',
    'ElSelect.tsx',
    'ElMultiSelect.tsx',
    'ElDatePicker.tsx',
    'ElDateTimePicker.tsx',
    'ElDateRangePicker.tsx',
    'ElTreeSelect.tsx',
    'SpaceImageUpload.tsx',
]);

const SKIP_TYPE_RE = /type\s*=\s*["'](checkbox|radio|file|hidden|range|color|button|submit|reset)["']/i;

function walkDir(dir, files = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            walkDir(full, files);
        } else if (name.endsWith('.tsx')) {
            files.push(full);
        }
    }
    return files;
}

function shouldSkipInput(attrs) {
    if (SKIP_TYPE_RE.test(attrs)) return true;
    if (/(?:^|\s)readOnly(?:\s|\/|$)/m.test(attrs)) return true;
    if (/\breadOnly\s*=\s*\{?\s*true\s*\}?/.test(attrs)) return true;
    return false;
}

function getImportPath(filePath) {
    if (filePath.includes(`${path.sep}pages${path.sep}`)) {
        return '../components/ClearableInput';
    }
    if (filePath.includes(`${path.sep}components${path.sep}`)) {
        return './ClearableInput';
    }
    return './components/ClearableInput';
}

function processFile(filePath) {
    const base = path.basename(filePath);
    if (SKIP_FILES.has(base)) return false;

    let content = fs.readFileSync(filePath, 'utf8');
    if (!/<input\b/i.test(content)) return false;

    let changed = false;
    const inputTagRe = /<input\b([\s\S]*?)(\/?)>/gi;

    content = content.replace(inputTagRe, (match, attrs, selfClose) => {
        if (shouldSkipInput(attrs)) return match;
        changed = true;
        return `<ClearableInput${attrs}${selfClose}>`;
    });

    content = content.replace(/<\/input>/gi, '');

    if (!changed) return false;

    if (!/import\s+ClearableInput\b/.test(content)) {
        const importPath = getImportPath(filePath);
        const importLine = `import ClearableInput from '${importPath}';`;
        const importMatches = [...content.matchAll(/^import .+;$/gm)];
        if (importMatches.length > 0) {
            const last = importMatches[importMatches.length - 1];
            const insertAt = last.index + last[0].length;
            content = `${content.slice(0, insertAt)}\n${importLine}${content.slice(insertAt)}`;
        } else {
            content = `${importLine}\n${content}`;
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

const files = walkDir(ROOT);
const updated = files.filter(processFile);
console.log(`Updated ${updated.length} files:`);
updated.forEach((f) => console.log(`  ${path.relative(ROOT, f)}`));
