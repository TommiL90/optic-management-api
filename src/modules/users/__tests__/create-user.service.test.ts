import { compare } from 'bcryptjs';
import { expect, describe, it, beforeEach, vi } from 'vitest';

import { InMemoryUsersRepository } from '../repositories/in-memory-users-repository';
import { UserService } from '../users.service';
import { ConflictException } from '@/core/errors/app-errors';

// Mock the Logger to be framework-agnostic
vi.mock('@/core/utils/logger.util', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    businessLogic: vi.fn(),
    databaseQuery: vi.fn(),
    initialize: vi.fn(),
  }
}));

let usersRepository: InMemoryUsersRepository;
let createUserUseCase: UserService;

describe('Create User Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new UserService(usersRepository);
  });

  it('should create a new user', async () => {
    const user = await createUserUseCase.createUser({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
    });

    expect(user.id).toEqual(expect.any(String));
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('johndoe@example.com');
    expect((user as any).password).toBeUndefined();
  });

  it('should hash user password upon creation', async () => {
    const user = await createUserUseCase.createUser({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
    });

    const userWithPassword = await usersRepository.findByEmailForAuth(user.email);
    const isPasswordCorrectlyHashed = await compare(
      '123456',
      userWithPassword!.password,
    );

    expect(isPasswordCorrectlyHashed).toBe(true);
  });

  it('should not be able to create a user with the same email twice', async () => {
    const email = 'johndoe@example.com';

    await createUserUseCase.createUser({
      name: 'John Doe',
      email,
      password: '123456',
    });

    await expect(() =>
      createUserUseCase.createUser({
        name: 'Jane Doe',
        email,
        password: '654321',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should not create user with invalid email', async () => {
    await expect(() =>
      createUserUseCase.createUser({
        name: 'John Doe',
        email: 'invalid-email',
        password: '123456',
      }),
    ).rejects.toThrow();
  });

  it('should not create user with weak password', async () => {
    await expect(() =>
      createUserUseCase.createUser({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: '123',
   
      }),
    ).rejects.toThrow();
  });

  it('should not create user with empty name', async () => {
    await expect(() =>
      createUserUseCase.createUser({
        name: '',
        email: 'johndoe@example.com',
        password: '123456',
      }),
    ).rejects.toThrow();
  });
});