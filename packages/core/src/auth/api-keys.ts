// API key validation and authentication - Phase 2
import { createHash } from 'crypto';

export async function validateApiKey(key: string): Promise<{ userId: string; keyId: string } | null> {
  // Will be implemented in Phase 2
  return null;
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
