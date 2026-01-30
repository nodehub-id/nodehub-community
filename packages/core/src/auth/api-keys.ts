// API key validation and authentication
import { createHash } from 'crypto';
import { db, apiKeys } from '@nodehub/db';
import { eq, and, gt } from 'drizzle-orm';

export async function validateApiKey(key: string): Promise<{ userId: string; keyId: string } | null> {
  // API keys start with "nh_"
  if (!key.startsWith('nh_')) {
    return null;
  }

  const prefix = key.slice(0, 10); // nh_ + 7 chars
  const hash = createHash('sha256').update(key).digest('hex');

  const keyRecord = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.keyPrefix, prefix),
      eq(apiKeys.keyHash, hash),
      eq(apiKeys.isActive, true)
    ),
  });

  if (!keyRecord) {
    return null;
  }

  // Check if key is expired
  if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
    return null;
  }

  // Update last used timestamp
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id));

  return { userId: keyRecord.userId, keyId: keyRecord.id };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): string {
  const randomPart = createHash('sha256')
    .update(Math.random().toString())
    .digest('hex')
    .slice(0, 32);
  return `nh_${randomPart}`;
}

export async function getUserApiKeys(userId: string) {
  return await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    columns: {
      id: true,
      name: true,
      keyPrefix: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export async function countUserApiKeys(userId: string): Promise<number> {
  // Only count active keys (Community Edition limit: 1 active key)
  const keys = await db.query.apiKeys.findMany({
    where: and(
      eq(apiKeys.userId, userId),
      eq(apiKeys.isActive, true)
    ),
  });
  return keys.length;
}

export async function createApiKey(userId: string, name: string) {
  const key = generateApiKey();
  const prefix = key.slice(0, 10);
  const hash = hashApiKey(key);

  await db.insert(apiKeys).values({
    userId,
    name,
    keyHash: hash,
    keyPrefix: prefix,
    isActive: true,
  });

  return key;
}

export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const key = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)),
  });

  if (!key) {
    return false;
  }

  await db.update(apiKeys)
    .set({ isActive: false })
    .where(eq(apiKeys.id, keyId));

  return true;
}
