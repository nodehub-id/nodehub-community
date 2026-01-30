import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateRandomPassword } from './password';
import { 
  hashApiKey, 
  generateApiKey,
  validateApiKey 
} from './api-keys';

describe('Password utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password of specified length', () => {
      const length = 16;
      const password = generateRandomPassword(length);
      
      expect(password.length).toBe(length);
    });

    it('should generate different passwords', () => {
      const password1 = generateRandomPassword();
      const password2 = generateRandomPassword();
      
      expect(password1).not.toBe(password2);
    });
  });
});

describe('API Key utilities', () => {
  describe('hashApiKey', () => {
    it('should hash an API key', () => {
      const key = 'nh_testkey123';
      const hash = hashApiKey(key);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 hex
      expect(hash).not.toBe(key);
    });

    it('should produce consistent hash', () => {
      const key = 'nh_testkey123';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateApiKey', () => {
    it('should generate key with nh_ prefix', () => {
      const key = generateApiKey();
      
      expect(key.startsWith('nh_')).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      
      expect(key1).not.toBe(key2);
    });
  });
});
