import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../src/prototypes/iot-platform-home');

const SKIP_FILES = new Set([
    'DataMonitorPage.tsx',
    'ListPagination.tsx',
    'TablePlaceholderRows.tsx',
]);

function walkDir(dir, files = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walkDir(full, files);
        else if (name.endsWith('.tsx')) files.push(full);
    }
    return files;
}

function getPageSizeVar(content) {
    const match = content.match(/const \[(\w+),\s*set\w+\] = useState\((?:DEFAULT_LIST_PAGE_SIZE|'10'|'20')\)/);
    return match?.[1] ?? null;
}

function countHeaderColumns(tableBlock) {
    const thead = tableBlock.match(/<thead>[\s\S]*?<\/thead>/);
    if (!thead) return 0;
    return (thead[0].match(/<th\b/g) ?? []).length;
}

function ensureImports(content) {
    let next = content;
    if (!next.includes('TablePlaceholderRows')) {
        const listImport = next.match(/^import ListPagination from .+;$/m);
        if (listImport) {
            next = next.replace(
                listImport[0],
                `${listImport[0]}\nimport TablePlaceholderRows from '../components/TablePlaceholderRows';`.replace(
                    '../components/',
                    listImport[0].includes("'../components/") ? '../components/' : './',
                ),
            );
            if (listImport[0].includes("'../components/")) {
                next = next.replace(
                    listImport[0],
                    `${listImport[0]}\nimport TablePlaceholderRows from '../components/TablePlaceholderRows';`,
                );
            } else if (listImport[0].includes("'./")) {
                next = next.replace(
                    listImport[0],
                    `${listImport[0]}\nimport TablePlaceholderRows from './TablePlaceholderRows';`,
                );
            }
        }
    }

    if (!next.includes('getPagedTableWrapStyle')) {
        const paginateImport = next.match(/^import \{([^}]+)\} from '(\.\.\/utils\/listPagination|\.\/utils\/listPagination)';$/m);
        if (paginateImport) {
            const names = paginateImport[1];
            const from = paginateImport[2];
            const additions = [];
            if (!names.includes('getPagedTableWrapStyle')) additions.push('getPagedTableWrapStyle');
            if (!names.includes('DEFAULT_LIST_PAGE_SIZE')) additions.push('DEFAULT_LIST_PAGE_SIZE');
            if (additions.length) {
                next = next.replace(
                    paginateImport[0],
                    `import {${names.trim()}, ${additions.join(', ')} } from '${from}';`,
                );
            }
        } else if (next.includes("from '../utils/listPagination'") || next.includes("from './utils/listPagination'")) {
            // skip
        } else {
            const isPage = next.includes('/pages/');
            const importLine = isPage
                ? "import { DEFAULT_LIST_PAGE_SIZE, getPagedTableWrapStyle, paginateItems } from '../utils/listPagination';"
                : "import { DEFAULT_LIST_PAGE_SIZE, getPagedTableWrapStyle, paginateItems } from '../utils/listPagination';";
            const listImport = next.match(/^import ListPagination from .+;$/m);
            if (listImport) {
                next = next.replace(listImport[0], `${listImport[0]}\n${importLine}`);
            }
        }
    }

    return next;
}

function fixImportPaths(content, filePath) {
    const isComponent = filePath.includes(`${path.sep}components${path.sep}`);
    let next = content;
    if (isComponent) {
        next = next.replace(
            "import TablePlaceholderRows from '../components/TablePlaceholderRows';",
            "import TablePlaceholderRows from './TablePlaceholderRows';",
        );
    }
    return next;
}

function upgradeTableWrap(content, pageSizeVar) {
    return content.replace(
        /<div className="pm-table-wrap([^"]*)">/g,
        (match, extra) => {
            if (extra.includes('pm-table-wrap--paged')) return match;
            return `<div className="pm-table-wrap pm-table-wrap--paged${extra}" style={getPagedTableWrapStyle(${pageSizeVar})}>`;
        },
    );
}

function injectPlaceholders(content, pageSizeVar, colSpan) {
    if (content.includes('TablePlaceholderRows')) {
        return content;
    }

    const emptyPattern = /\{pagination\.items\.length === 0 \? \(\s*<tr>[\s\S]*?<\/tr>\s*\) :/;
    if (emptyPattern.test(content)) {
        return content.replace(
            /\{pagination\.items\.length === 0 \? \(\s*<tr>([\s\S]*?)<\/tr>\s*\) :/,
            `{pagination.items.length === 0 ? (
                                                <>
                                                    <tr>$1</tr>
                                                    <TablePlaceholderRows itemCount={1} pageSize={${pageSizeVar}} colSpan={${colSpan}} />
                                                </>
                                            ) :`,
        ).replace(
            /(\{pagination\.items\.map\([\s\S]*?\)\})\s*\)\}/,
            `$1
                                                <TablePlaceholderRows itemCount={pagination.items.length} pageSize={${pageSizeVar}} colSpan={${colSpan}} />
                                            </>
                                        )}`,
        );
    }

    if (!content.includes('pagination.items.map')) return content;

    return content.replace(
        /(\{pagination\.items\.map\([\s\S]*?\)\})\s*(?=<\/tbody>)/,
        `<>
                                                $1
                                                <TablePlaceholderRows itemCount={pagination.items.length} pageSize={${pageSizeVar}} colSpan={${colSpan}} />
                                            </>`,
    );
}

function processFile(filePath) {
    const base = path.basename(filePath);
    if (SKIP_FILES.has(base)) return false;

    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('ListPagination') || !content.includes('pagination.items.map')) {
        return false;
    }

    const pageSizeVar = getPageSizeVar(content);
    if (!pageSizeVar) return false;

    const tableMatch = content.match(/<table className="pm-table[\s\S]*?<\/table>/);
    if (!tableMatch) return false;

    const colSpan = countHeaderColumns(tableMatch[0]);
    if (!colSpan) return false;

    const original = content;
    content = ensureImports(content);
    content = fixImportPaths(content, filePath);
    content = upgradeTableWrap(content, pageSizeVar);
    content = injectPlaceholders(content, pageSizeVar, colSpan);

    if (content === original) return false;
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

const updated = walkDir(ROOT).filter(processFile);
console.log(`Updated ${updated.length} files`);
updated.forEach((f) => console.log(`  ${path.relative(ROOT, f)}`));
