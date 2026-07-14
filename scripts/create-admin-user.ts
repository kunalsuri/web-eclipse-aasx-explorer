/**
 * Create a local administrator through the application's storage abstraction.
 *
 * Required environment variables:
 * ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
 * Optional: ADMIN_FIRST_NAME, ADMIN_LAST_NAME
 */

import path from 'path';
import { pathToFileURL } from 'url';
import { z } from 'zod';

const adminInputSchema = z.object({
  username: z.string().trim().min(3).max(50),
  email: z.string().trim().email(),
  password: z.string().min(6),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
});

export type CreateAdminInput = z.infer<typeof adminInputSchema>;

type StoredUser = {
  id: string;
  role?: string;
  [key: string]: unknown;
};

export interface AdminCreationDependencies {
  ready(): Promise<void>;
  getUserByUsername(username: string): Promise<unknown>;
  getUserByEmail(email: string): Promise<unknown>;
  createUser(user: CreateAdminInput): Promise<StoredUser>;
  updateUser(id: string, updates: { role: 'admin' }): Promise<StoredUser | undefined>;
  deleteUser(id: string): Promise<void>;
  hashPassword(password: string): Promise<string>;
}

export async function createAdminUser(
  rawInput: CreateAdminInput,
  dependencies: AdminCreationDependencies
): Promise<StoredUser> {
  const input = adminInputSchema.parse(rawInput);

  await dependencies.ready();

  if (await dependencies.getUserByUsername(input.username)) {
    throw new Error(`Username already exists: ${input.username}`);
  }
  if (await dependencies.getUserByEmail(input.email)) {
    throw new Error(`Email already exists: ${input.email}`);
  }

  const password = await dependencies.hashPassword(input.password);
  const created = await dependencies.createUser({ ...input, password });

  try {
    const administrator = await dependencies.updateUser(created.id, { role: 'admin' });
    if (!administrator) {
      throw new Error('Created user could not be promoted to administrator');
    }
    return administrator;
  } catch (error) {
    await dependencies.deleteUser(created.id);
    throw error;
  }
}

function inputFromEnvironment(): CreateAdminInput {
  const missing = ['ADMIN_USERNAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'].filter(
    (name) => !process.env[name]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(', ')}. Set ADMIN_USERNAME, ADMIN_EMAIL, and ` +
        'ADMIN_PASSWORD before running npm run create-admin.'
    );
  }

  return {
    username: process.env.ADMIN_USERNAME!,
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'User',
  };
}

async function main(): Promise<void> {
  const [{ storage }, { hashPassword }] = await Promise.all([
    import('../server/storage'),
    import('../server/auth/jwt-utils'),
  ]);

  const administrator = await createAdminUser(inputFromEnvironment(), {
    ready: () => storage.ready(),
    getUserByUsername: (username) => storage.getUserByUsername(username),
    getUserByEmail: (email) => storage.getUserByEmail(email),
    createUser: (user) => storage.createUser(user),
    updateUser: (id, updates) => storage.updateUser(id, updates),
    deleteUser: (id) => storage.deleteUser(id),
    hashPassword,
  });

  console.log(`Created administrator ${String(administrator.username)} (${administrator.id}).`);
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;

if (invokedPath === import.meta.url) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unable to create administrator: ${message}`);
    process.exitCode = 1;
  });
}
