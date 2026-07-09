import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../src/prototypes/iot-platform-home');

const SKIP_FILES = new Set(['ListPagination.tsx', 'TablePlaceholderRows.tsx']);

function walkDir(dir, files = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walkDir(full, files);
        else if (name.endsWith('.tsx')) files.push(full);
    }
    return files;
}

function dedupeImports(content) {
    return content.replace(
        /(import TablePlaceholderRows from '[^']+';\n)(?:import TablePlaceholderRows from '[^']+';\n)+/g,
        '$1',
    );
}

function fixPaginateImport(content) {
    return content.replace(/\{paginateItems,/g, '{ paginateItems,');
}

function ensureImports(content, filePath) {
    const isComponent = filePath.includes(`${path.sep}components${path.sep}`);
    const placeholderImport = isComponent
        ? "import TablePlaceholderRows from './TablePlaceholderRows';"
        : "import TablePlaceholderRows from '../components/TablePlaceholderRows';";

    let next = content;

    if (!next.includes('TablePlaceholderRows')) {
        const listImport = next.match(/^import ListPagination from .+;$/m);
        if (listImport) {
            next = next.replace(listImport[0], `${listImport[0]}\n${placeholderImport}`);
        }
    }

    if (!next.includes('getPagedTableWrapStyle')) {
        const paginateImport = next.match(
            /^import \{([^}]+)\} from '(\.\.\/utils\/listPagination|\.\/utils\/listPagination)';$/m,
        );
        if (paginateImport) {
            const names = paginateImport[1];
            const from = paginateImport[2];
            const additions = [];
            if (!names.includes('getPagedTableWrapStyle')) additions.push('getPagedTableWrapStyle');
            if (!names.includes('DEFAULT_LIST_PAGE_SIZE')) additions.push('DEFAULT_LIST_PAGE_SIZE');
            if (additions.length) {
                next = next.replace(
                    paginateImport[0],
                    `import { ${names.trim()}, ${additions.join(', ')} } from '${from}';`,
                );
            }
        } else {
            const isPage = filePath.includes(`${path.sep}pages${path.sep}`);
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

function upgradeTableWrap(content) {
    return content.replace(
        /<div className="pm-table-wrap([^"]*)"(?![^>]*style=\{getPagedTableWrapStyle)/g,
        (match, extra) => {
            if (extra.includes('pm-table-wrap--paged')) return match;
            return `<div className="pm-table-wrap pm-table-wrap--paged${extra}"`;
        },
    );
}

function addWrapStyles(content) {
    return content.replace(
        /<div className="pm-table-wrap pm-table-wrap--paged([^"]*)"(?![^>]*style=\{getPagedTableWrapStyle)/g,
        (match, extra) => `${match} style={getPagedTableWrapStyle(PAGE_SIZE_PLACEHOLDER)}`,
    );
}

function countHeaderColumns(beforeTbody) {
    const thead = beforeTbody.match(/<thead>[\s\S]*?<\/thead>/);
    if (!thead) return 0;
    return (thead[0].match(/<th\b/g) ?? []).length;
}

function detectPaginationVar(tbodyInner) {
    const match = tbodyInner.match(/(\w+)\.items\.(?:map|length)/);
    return match?.[1] ?? null;
}

function detectPageSizeVar(content, tbodyIndex) {
    const before = content.slice(Math.max(0, tbodyIndex - 2500), tbodyIndex);
    const styleMatch = before.match(/getPagedTableWrapStyle\((\w+)\)/);
    if (styleMatch) return styleMatch[1];

    const after = content.slice(tbodyIndex, tbodyIndex + 3000);
    const listPagMatch = after.match(/<ListPagination[\s\S]*?pageSize=\{(\w+)\}/);
    if (listPagMatch) return listPagMatch[1];

    const stateMatch = content.match(/const \[(\w+),\s*set\w+\] = useState\(['"]?\d+['"]?\)/);
    return stateMatch?.[1] ?? 'pageSize';
}

function injectPlaceholders(content) {
    let result = '';
    let lastIndex = 0;
    const tbodyRegex = /<tbody>([\s\S]*?)<\/tbody>/g;
    let match;

    while ((match = tbodyRegex.exec(content)) !== null) {
        result += content.slice(lastIndex, match.index);
        const tbodyInner = match[1];
        const paginationVar = detectPaginationVar(tbodyInner);

        if (!paginationVar || tbodyInner.includes('TablePlaceholderRows')) {
            result += match[0];
            lastIndex = tbodyRegex.lastIndex;
            continue;
        }

        const beforeTbody = content.slice(Math.max(0, match.index - 2000), match.index);
        const colSpan = countHeaderColumns(beforeTbody);
        if (!colSpan) {
            result += match[0];
            lastIndex = tbodyRegex.lastIndex;
            continue;
        }

        const pageSizeVar = detectPageSizeVar(content, match.index);
        const indentMatch = tbodyInner.match(/\n(\s+)\S/);
        const indent = indentMatch?.[1] ?? '                                ';

        const injection = `\n${indent}<TablePlaceholderRows itemCount={${paginationVar}.items.length || 1} pageSize={${pageSizeVar}} colSpan={${colSpan}} />`;

        result += `<tbody>${tbodyInner.replace(/\s*$/, injection)}\n${indent.slice(4)}</tbody>`;
        lastIndex = tbodyRegex.lastIndex;
    }

    result += content.slice(lastIndex);
    return result;
}

function fixWrapPageSizeFromListPagination(content) {
    return content.replace(
        /(<div className="pm-table-wrap pm-table-wrap--paged[^"]*" style=\{getPagedTableWrapStyle\()(\w+)(\)\}>[\s\S]*?<tbody>[\s\S]*?)(\w+)\.items\.(?:map|length)/g,
        (full, start, wrapSize, middle, itemsVar) => {
            const afterTable = full;
            const listPag = content.slice(
                content.indexOf(afterTable.slice(0, 80)),
                content.indexOf(afterTable.slice(0, 80)) + afterTable.length + 500,
            );
            const pageSizeInList = listPag.match(/pageSize=\{(\w+)\}/)?.[1];
            if (pageSizeInList && pageSizeInList !== wrapSize) {
                return `${start}${pageSizeInList}${middle}${itemsVar}.items.`;
            }
            return full;
        },
    );
}

function processFile(filePath) {
    const base = path.basename(filePath);
    if (SKIP_FILES.has(base)) return false;

    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('ListPagination')) return false;
    if (!content.includes('.items.map') && !content.includes('.items.length')) return false;

    const original = content;
    content = dedupeImports(content);
    content = fixPaginateImport(content);
    content = ensureImports(content, filePath);
    content = upgradeTableWrap(content);

    // Add style to wraps that got --paged class but no style yet
    content = content.replace(
        /<div className="pm-table-wrap pm-table-wrap--paged([^"]*)"(?![^>]*style=)/g,
        (match, extra, offset) => {
            const following = content.slice(offset, offset + 4000);
            const tbodyIdx = following.indexOf('<tbody>');
            if (tbodyIdx === -1) return match;
            const pageSizeVar = detectPageSizeVar(content, offset + tbodyIdx);
            return `<div className="pm-table-wrap pm-table-wrap--paged${extra}" style={getPagedTableWrapStyle(${pageSizeVar})}`;
        },
    );

    content = injectPlaceholders(content);

    // Fix device table using wrong pageSize in DeviceGroupPage-like cases
    content = content.replace(
        /getPagedTableWrapStyle\(pageSize\)\}>([\s\S]*?)devicePagination\.items/g,
        'getPagedTableWrapStyle(devicePageSize)}>$1devicePagination.items',
    );

    if (content === original) return false;
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

const updated = walkDir(ROOT).filter(processFile);
console.log(`Fixed ${updated.length} files`);
updated.forEach((f) => console.log(`  ${path.relative(ROOT, f)}`));
