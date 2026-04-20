/**
 * Parse src/api/endpoints.ts to collect endpoint strings plus the metadata
 * needed by the QC runner to decide which entries are safe to probe.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface EndpointInfo {
    group: string;
    name: string;
    path: string;
    isTemplate: boolean;
    placeholders: string[];
    methods: string[];
    qcSkip: boolean;
}

const GROUP_RE = /export const ([A-Z_]+_ENDPOINTS?)\s*=\s*\{([\s\S]*?)\};?/g;
const STATIC_ENTRY_RE = /^\s*([A-Z_0-9]+)\s*:\s*['"`]([^'"`]+)['"`]\s*,?/;
const TEMPLATE_ENTRY_RE = /^\s*([A-Z_0-9]+)\s*:\s*\(([^)]*)\)\s*=>\s*`([^`]+)`/;
const METHOD_RE = /\b(GET|POST|PUT|PATCH|DELETE)\b/gi;

const READ_NAME_PREFIXES = [
    'LIST',
    'DETAIL',
    'SEARCH',
    'BY_',
    'GET',
    'DASHBOARD',
    'REVENUE',
    'SUMMARY',
    'STATUS',
    'VERIFY',
    'SESSIONS',
    'CALENDAR',
    'INBOX',
    'LOCK_STATUS',
    'UNREAD',
    'MESSAGES',
    'ATTACHMENTS',
    'UPCOMING',
    'PENDING',
    'LOGS',
    'ANALYTICS',
    'DOWNLOAD',
    'VIEW',
    'MY_',
    'AUDIT_LOG',
];

function inferMethods(name: string, comment: string): string[] {
    const explicit = Array.from(comment.matchAll(METHOD_RE)).map(match => match[1].toUpperCase());
    if (explicit.length > 0) {
        return Array.from(new Set(explicit));
    }

    if (READ_NAME_PREFIXES.some(prefix => name === prefix || name.startsWith(prefix))) {
        return ['GET'];
    }

    return [];
}

export function scanEndpoints(projectRoot: string): EndpointInfo[] {
    const file = join(projectRoot, 'src', 'api', 'endpoints.ts');
    const src = readFileSync(file, 'utf8');
    const out: EndpointInfo[] = [];

    let match: RegExpExecArray | null;
    while ((match = GROUP_RE.exec(src))) {
        const group = match[1];
        const body = match[2];
        for (const rawLine of body.split('\n')) {
            const commentIndex = rawLine.indexOf('//');
            const comment = commentIndex >= 0 ? rawLine.slice(commentIndex + 2).trim() : '';
            const line = rawLine.replace(/\/\/.*$/, '').trim();
            if (!line) continue;

            const staticMatch = STATIC_ENTRY_RE.exec(line);
            if (staticMatch) {
                out.push({
                    group,
                    name: staticMatch[1],
                    path: staticMatch[2],
                    isTemplate: false,
                    placeholders: [],
                    methods: inferMethods(staticMatch[1], comment),
                    qcSkip: /\bQC_SKIP\b/i.test(comment),
                });
                continue;
            }

            const templateMatch = TEMPLATE_ENTRY_RE.exec(line);
            if (templateMatch) {
                const params = templateMatch[2]
                    .split(',')
                    .map(part => part.trim().split(':')[0].trim())
                    .filter(Boolean);

                out.push({
                    group,
                    name: templateMatch[1],
                    path: templateMatch[3],
                    isTemplate: true,
                    placeholders: params,
                    methods: inferMethods(templateMatch[1], comment),
                    qcSkip: /\bQC_SKIP\b/i.test(comment),
                });
            }
        }
    }

    return out;
}

export function filterAutoTestable(
    endpoints: EndpointInfo[],
    knownIds: Record<string, string>,
): EndpointInfo[] {
    return endpoints.filter(endpoint => {
        if (!endpoint.isTemplate) return true;
        return endpoint.placeholders.every(placeholder => knownIds[placeholder] !== undefined);
    });
}

export function substitutePath(endpoint: EndpointInfo, knownIds: Record<string, string>): string {
    let path = endpoint.path;
    for (const placeholder of endpoint.placeholders) {
        const value = knownIds[placeholder];
        if (value === undefined) continue;
        path = path.replace(new RegExp(`\\$\\{${placeholder}\\}`, 'g'), encodeURIComponent(value));
    }
    return path;
}
