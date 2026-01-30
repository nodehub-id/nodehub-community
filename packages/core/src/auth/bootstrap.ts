// Default admin user bootstrap script
// Creates an admin user from environment variables when no users exist

import { db, users } from '@nodehub/db';
import { hashPassword } from './password';

interface BootstrapConfig {
  adminEmail: string | undefined;
  adminPassword: string | undefined;
}

export async function bootstrapAdmin(config: BootstrapConfig): Promise<{ success: boolean; message: string }> {
  // Check if users already exist
  const existingUsers = await db.query.users.findMany({
    limit: 1,
  });

  if (existingUsers.length > 0) {
    return {
      success: false,
      message: 'Admin bootstrap skipped: Users already exist in database',
    };
  }

  // Check if admin credentials are provided
  if (!config.adminEmail || !config.adminPassword) {
    return {
      success: false,
      message: 'Admin bootstrap skipped: ADMIN_EMAIL and ADMIN_PASSWORD not set',
    };
  }

  try {
    const passwordHash = await hashPassword(config.adminPassword);

    await db.insert(users).values({
      email: config.adminEmail,
      passwordHash,
      name: 'Admin',
    });

    return {
      success: true,
      message: `Default admin user created: ${config.adminEmail}`,
    };
  } catch (error) {
    console.error('Failed to create admin user:', error);
    return {
      success: false,
      message: 'Admin bootstrap failed: Error creating user',
    };
  }
}

// Auto-run bootstrap when this module is imported (for development)
export async function runBootstrap(): Promise<void> {
  const config: BootstrapConfig = {
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
  };

  const result = await bootstrapAdmin(config);
  
  if (result.success) {
    console.log('✓', result.message);
  } else {
    console.log('ℹ', result.message);
  }
}
