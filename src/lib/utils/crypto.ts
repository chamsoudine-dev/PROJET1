import { randomBytes } from 'crypto';

// Simple crypto fallback compatible with Edge runtime
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sante-niger-static-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  // Simple comparison - in production would use timing-safe comparison
  return computed === hash;
}

export function generateRandomString(length: number): string {
  return randomBytes(length).toString('hex');
}

export function generateNationalId(): string {
  const year = new Date().getFullYear();
  const randomPart = randomBytes(4).toString('hex').toUpperCase();
  return `SN-${year}-${randomPart}`;
}

function base32Encode(buffer: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

export function generateTotpSecret(): string {
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  return base32Encode(arr).toUpperCase();
}
