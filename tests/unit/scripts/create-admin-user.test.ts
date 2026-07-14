/**
 * Administrator creation script tests.
 */

import { describe, expect, it, vi } from 'vitest';
import { createAdminUser } from '../../../scripts/create-admin-user';

describe('createAdminUser', () => {
  it('hashes and persists an administrator', async () => {
    const createUser = vi.fn(async (user) => ({
      ...user,
      id: 'admin-id',
      role: 'user',
    }));
    const updateUser = vi.fn(async (_id, updates) => ({
      id: 'admin-id',
      username: 'operator',
      role: updates.role,
    }));
    const hashPassword = vi.fn(async () => 'hashed-password');

    const result = await createAdminUser(
      {
        username: 'operator',
        email: 'operator@example.com',
        password: 'secret-password',
        firstName: 'Site',
        lastName: 'Operator',
      },
      {
        ready: vi.fn(async () => undefined),
        getUserByUsername: vi.fn(async () => undefined),
        getUserByEmail: vi.fn(async () => undefined),
        createUser,
        updateUser,
        deleteUser: vi.fn(async () => undefined),
        hashPassword,
      }
    );

    expect(hashPassword).toHaveBeenCalledWith('secret-password');
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed-password' })
    );
    expect(updateUser).toHaveBeenCalledWith('admin-id', { role: 'admin' });
    expect(result.role).toBe('admin');
  });

  it('rejects an existing username before hashing or writing', async () => {
    const hashPassword = vi.fn(async () => 'hashed-password');
    const createUser = vi.fn();

    await expect(
      createAdminUser(
        {
          username: 'operator',
          email: 'operator@example.com',
          password: 'secret-password',
          firstName: 'Site',
          lastName: 'Operator',
        },
        {
          ready: vi.fn(async () => undefined),
          getUserByUsername: vi.fn(async () => ({ id: 'existing' })),
          getUserByEmail: vi.fn(async () => undefined),
          createUser,
          updateUser: vi.fn(),
          deleteUser: vi.fn(async () => undefined),
          hashPassword,
        }
      )
    ).rejects.toThrow('Username already exists');

    expect(hashPassword).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });
});
