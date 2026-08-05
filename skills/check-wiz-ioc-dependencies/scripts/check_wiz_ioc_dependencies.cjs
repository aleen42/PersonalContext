#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');

const args = process.argv.slice(2);
const getArg = name => {
    const index = args.indexOf(name);
    return index === -1 ? '' : args[index + 1] || '';
};

const DEFAULT_IOC_URL = 'https://raw.githubusercontent.com/wiz-sec-public/wiz-research-iocs/main/reports/keyv-packages.csv';

const root = path.resolve(getArg('--root') || process.cwd());
let csvPath = getArg('--csv');
let csvSource = csvPath ? path.resolve(csvPath) : DEFAULT_IOC_URL;
const requestedUrl = getArg('--url');
const jsonOnly = args.includes('--json');

const normalizeUrl = url => url
    .replace('https://github.com/wiz-sec-public/wiz-research-iocs/blob/main/reports/keyv-packages.csv', DEFAULT_IOC_URL);

const fetchCsv = url => {
    const normalizedUrl = normalizeUrl(url);
    const target = path.join(os.tmpdir(), `wiz-ioc-${Date.now()}.csv`);
    try {
        execFileSync('curl', ['-fsSL', normalizedUrl, '-o', target], {stdio : 'pipe'});
    } catch (e) {
        const stderr = e.stderr ? String(e.stderr).trim() : e.message;
        console.error(`Failed to fetch IOC CSV from ${normalizedUrl}`);
        if (stderr) console.error(stderr);
        process.exit(2);
    }
    csvSource = normalizedUrl;
    return target;
};

if (requestedUrl) {
    csvPath = fetchCsv(requestedUrl);
} else if (!csvPath) {
    csvPath = fetchCsv(DEFAULT_IOC_URL);
} else {
    csvPath = path.resolve(csvPath);
}

if (!csvPath || !fs.existsSync(csvPath)) {
    console.error('Usage: check_wiz_ioc_dependencies.cjs [--url <ioc.csv-url> | --csv <ioc.csv>] [--root <repo>] [--json]');
    process.exit(2);
}

const parseCsvLine = line => {
    const out = [];
    let value = '';
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (quoted && line[i + 1] === '"') {
                value += '"';
                i++;
            } else {
                quoted = !quoted;
            }
        } else if (ch === ',' && !quoted) {
            out.push(value);
            value = '';
        } else {
            value += ch;
        }
    }

    out.push(value);
    return out;
};

// noinspection SpellCheckingInspection
const loadIocs = file => {
    // noinspection SpellCheckingInspection
    const lines = fs.readFileSync(file, 'utf8')
        .replace(/^\uFEFF/, '')
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
    const map = new Map();

    for (const line of lines.slice(1)) {
        const [name, versions = ''] = parseCsvLine(line);
        if (!name) continue;
        map.set(name, new Set(versions.split(',').map(s => s.trim()).filter(Boolean)));
    }

    return map;
};

// noinspection SpellCheckingInspection
const iocs = loadIocs(csvPath);
const packageJsonDirs = [];
const nodeModulesDirs = [];
const lockFiles = [];

const isInsideNodeModules = target => target.split(path.sep).includes('node_modules');
// noinspection SpellCheckingInspection
const shouldSkipDir = dir => ['.git', '.codegraph', '.idea'].includes(path.basename(dir));

const walkMeta = dir => {
    let entries;
    try {
        entries = fs.readdirSync(dir, {withFileTypes : true});
    } catch (e) {
        return;
    }

    if (!isInsideNodeModules(dir) && entries.some(entry => entry.isFile() && entry.name === 'package.json')) {
        packageJsonDirs.push(dir);
    }

    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isFile() && ['npm-shrinkwrap.json', 'package-lock.json'].includes(entry.name) && !isInsideNodeModules(full)) {
            lockFiles.push(full);
        }
    }

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const full = path.join(dir, entry.name);
        if (shouldSkipDir(full)) continue;
        if (entry.name === 'node_modules') {
            nodeModulesDirs.push(full);
            continue;
        }
        walkMeta(full);
    }
};

const installedMatches = [];
const visitedInstalled = new Set();

const scanPackageDir = packageDir => {
    const packageJson = path.join(packageDir, 'package.json');
    if (!fs.existsSync(packageJson)) return;

    let pkg;
    try {
        pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    } catch (e) {
        return;
    }

    const name = pkg.name;
    const version = pkg.version;
    if (!name || !version || !iocs.has(name) || !iocs.get(name).has(version)) return;

    const key = `${name}@${version}:${packageDir}`;
    if (visitedInstalled.has(key)) return;
    visitedInstalled.add(key);
    installedMatches.push({name, version, path : path.relative(root, packageDir)});
};

const walkNodeModules = dir => {
    let entries;
    try {
        entries = fs.readdirSync(dir, {withFileTypes : true});
    } catch (e) {
        return;
    }

    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === '.bin') continue;
        const full = path.join(dir, entry.name);
        if (entry.name.startsWith('@')) {
            let scopedEntries;
            try {
                scopedEntries = fs.readdirSync(full, {withFileTypes : true});
            } catch (e) {
                continue;
            }
            for (const scopedEntry of scopedEntries) {
                if (!scopedEntry.isDirectory()) continue;
                const scopedFull = path.join(full, scopedEntry.name);
                scanPackageDir(scopedFull);
                const nested = path.join(scopedFull, 'node_modules');
                if (fs.existsSync(nested)) walkNodeModules(nested);
            }
        } else {
            scanPackageDir(full);
            const nested = path.join(full, 'node_modules');
            if (fs.existsSync(nested)) walkNodeModules(nested);
        }
    }
};

const inferNameFromLockPath = packagePath => {
    if (!packagePath.startsWith('node_modules/')) return '';
    const parts = packagePath.split('/');
    return parts[1] && parts[1].startsWith('@') ? `${parts[1]}/${parts[2]}` : parts[1] || '';
};

const lockMatches = [];

const walkLockDependencies = (deps, lockFile, prefix = '') => {
    if (!deps) return;
    for (const [name, dep] of Object.entries(deps)) {
        if (dep && dep.version && iocs.get(name)?.has(dep.version)) {
            lockMatches.push({
                name,
                version : dep.version,
                lock    : path.relative(root, lockFile),
                path    : prefix ? `${prefix}>${name}` : name,
            });
        }
        walkLockDependencies(dep && dep.dependencies, lockFile, prefix ? `${prefix}>${name}` : name);
    }
};

const scanLockFile = lockFile => {
    let lock;
    try {
        lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    } catch (e) {
        return;
    }

    for (const [packagePath, pkg] of Object.entries(lock.packages || {})) {
        if (!pkg || !pkg.version) continue;
        const name = pkg.name || inferNameFromLockPath(packagePath);
        if (!name || !iocs.has(name) || !iocs.get(name).has(pkg.version)) continue;
        lockMatches.push({
            name,
            version : pkg.version,
            lock    : path.relative(root, lockFile),
            path    : packagePath || '.',
        });
    }

    walkLockDependencies(lock.dependencies, lockFile);
};

const declarationHits = [];
const dependencySections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const parseNpmAlias = spec => /^npm:((?:@[^/]+\/)?[^@]+)@/.exec(spec || '')?.[1] || '';

const scanPackageDeclaration = file => {
    let pkg;
    try {
        pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return;
    }

    for (const section of dependencySections) {
        const deps = pkg[section] || {};
        for (const [dep, spec] of Object.entries(deps)) {
            const actual = parseNpmAlias(spec) || dep;
            if (!iocs.has(actual)) continue;
            declarationHits.push({
                file : path.relative(root, file),
                section,
                dep,
                actual,
                spec,
            });
        }
    }
};

walkMeta(root);
for (const dir of nodeModulesDirs) walkNodeModules(dir);
for (const lockFile of lockFiles) scanLockFile(lockFile);
for (const dir of packageJsonDirs) scanPackageDeclaration(path.join(dir, 'package.json'));

const sortByName = (a, b) => `${a.name || a.actual}@${a.version || a.spec}`
    .localeCompare(`${b.name || b.actual}@${b.version || b.spec}`);
const result = {
    root,
    csv                 : csvSource,
    iocPackages         : iocs.size,
    packageJsonDirCount : packageJsonDirs.length,
    nodeModulesDirCount : nodeModulesDirs.length,
    lockFileCount       : lockFiles.length,
    packageJsonDirs     : packageJsonDirs.map(d => path.relative(root, d)).sort(),
    nodeModulesDirs     : nodeModulesDirs.map(d => path.relative(root, d)).sort(),
    lockFiles           : lockFiles.map(f => path.relative(root, f)).sort(),
    installedMatches    : installedMatches.sort(sortByName),
    lockMatches         : lockMatches.sort(sortByName),
    declarationHits     : declarationHits.sort(sortByName),
};

if (jsonOnly) {
    console.log(JSON.stringify(result, null, 4));
} else {
    console.log(`IOC CSV: ${result.csv}`);
    console.log(`IOC packages: ${result.iocPackages}`);
    console.log(`package.json dirs: ${result.packageJsonDirCount}`);
    console.log(`node_modules dirs: ${result.nodeModulesDirCount}`);
    // noinspection SpellCheckingInspection
    console.log(`lockfiles: ${result.lockFileCount}`);
    console.log('');

    const printSection = (title, rows) => {
        console.log(`${title}: ${rows.length}`);
        for (const row of rows) console.log(JSON.stringify(row));
        console.log('');
    };

    printSection('installedMatches', result.installedMatches);
    printSection('lockMatches', result.lockMatches);
    printSection('declarationHits', result.declarationHits);
}

process.exit(installedMatches.length || lockMatches.length ? 1 : 0);
