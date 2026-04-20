/**
 * Stage 1 — Static checks
 *   - tsc --noEmit
 *   - next lint (nếu có)
 * Không chạy `next build` vì tốn 2-3 phút, để orchestrator tuỳ chọn gọi.
 */

import { spawn } from 'child_process';
import { QcStageResult, QcIssue } from './types';

const resolveCommand = (cmd: string): string => {
    if (process.platform === 'win32' && !cmd.endsWith('.cmd')) {
        return `${cmd}.cmd`;
    }
    return cmd;
};

function run(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise(resolve => {
        const proc = spawn(resolveCommand(cmd), args, { shell: process.platform === 'win32' });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', d => (stdout += d.toString()));
        proc.stderr.on('data', d => (stderr += d.toString()));
        proc.on('close', code => resolve({ code: code ?? 1, stdout, stderr }));
        proc.on('error', err => resolve({ code: 1, stdout, stderr: err.message }));
    });
}

// tsc error line: src/foo.tsx(12,34): error TS2345: Argument ...
const TSC_RE = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/;

function parseTscErrors(output: string): QcIssue[] {
    const issues: QcIssue[] = [];
    for (const line of output.split('\n')) {
        const m = TSC_RE.exec(line.trim());
        if (!m) continue;
        issues.push({
            stage: 'static',
            severity: 'error',
            title: `${m[4]}: ${m[5].slice(0, 120)}`,
            file: m[1],
            line: parseInt(m[2], 10),
            detail: m[5],
        });
    }
    return issues;
}

function parseLintOutput(output: string): QcIssue[] {
    const issues: QcIssue[] = [];
    let currentFile = '';
    for (const rawLine of output.split('\n')) {
        const line = rawLine.trimEnd();
        if (!line) continue;
        if (/^\.?\//.test(line) || /^[A-Z]:\\/.test(line)) {
            currentFile = line.trim();
            continue;
        }
        const m = /^\s*(\d+):(\d+)\s+(Error|Warning)\s+(.+?)(\s+[a-z0-9-/@]+)?\s*$/.exec(line);
        if (m && currentFile) {
            issues.push({
                stage: 'static',
                severity: m[3] === 'Error' ? 'error' : 'warning',
                title: m[4].slice(0, 120),
                file: currentFile,
                line: parseInt(m[1], 10),
            });
        }
    }
    return issues;
}

export async function runStaticChecks(opts: { skipLint?: boolean } = {}): Promise<QcStageResult> {
    const startedAt = new Date().toISOString();
    const start = Date.now();
    const issues: QcIssue[] = [];
    let totalChecked = 0;

    // Typecheck
    console.log('[QC Stage 1] Running tsc --noEmit...');
    const tsc = await run('npx', ['tsc', '--noEmit']);
    totalChecked += 1;
    const tscIssues = parseTscErrors(tsc.stdout + '\n' + tsc.stderr);
    issues.push(...tscIssues);
    if (tsc.code !== 0 && tscIssues.length === 0) {
        issues.push({
            stage: 'static',
            severity: 'error',
            title: 'tsc --noEmit thất bại (không parse được error)',
            detail: (tsc.stdout + tsc.stderr).slice(0, 500),
        });
    }

    // Lint
    if (!opts.skipLint) {
        console.log('[QC Stage 1] Running next lint...');
        const lint = await run('npx', ['next', 'lint', '--no-cache']);
        totalChecked += 1;
        issues.push(...parseLintOutput(lint.stdout + '\n' + lint.stderr));
    }

    const finishedAt = new Date().toISOString();
    const errors = issues.filter(i => i.severity === 'error').length;
    return {
        stage: 'static',
        startedAt,
        finishedAt,
        durationMs: Date.now() - start,
        totalChecked,
        passed: totalChecked - (errors > 0 ? 1 : 0),
        failed: errors > 0 ? 1 : 0,
        issues,
    };
}

if (require.main === module) {
    runStaticChecks().then(r => {
        console.log(JSON.stringify(r, null, 2));
        process.exit(r.failed > 0 ? 1 : 0);
    });
}
