'use strict';

const childProcess = require('child_process');

function normalizePath(value) {
    return String(value || '').trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function runGit(root, args) {
    return childProcess.execFileSync('git', args, {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });
}

function parsePathList(output) {
    return String(output || '')
        .split(/\r?\n/)
        .map(normalizePath)
        .filter(Boolean);
}

function getChangedFiles(root, baseRef) {
    const files = new Set();
    const addPaths = output => parsePathList(output).forEach(file => files.add(file));

    addPaths(runGit(root, ['diff', '--name-only']));
    addPaths(runGit(root, ['diff', '--cached', '--name-only']));
    addPaths(runGit(root, ['ls-files', '--others', '--exclude-standard']));

    if (baseRef) {
        addPaths(runGit(root, ['diff', '--name-only', `${baseRef}...HEAD`]));
    }

    return [...files].sort();
}

function findingTouchesChangedFile(finding, changedFiles) {
    const findingFile = normalizePath(finding.file);
    if (!findingFile) return false;

    return changedFiles.some((changedFile) => {
        const normalizedChangedFile = normalizePath(changedFile);
        return findingFile === normalizedChangedFile ||
            findingFile.startsWith(`${normalizedChangedFile},`) ||
            findingFile.includes(`, ${normalizedChangedFile}`) ||
            (findingFile.endsWith('/') && normalizedChangedFile.startsWith(findingFile));
    });
}

module.exports = {
    findingTouchesChangedFile,
    getChangedFiles,
    normalizePath,
    parsePathList
};
