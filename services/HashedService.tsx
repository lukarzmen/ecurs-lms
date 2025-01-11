import crypto from 'crypto';

export function hashDocument(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}