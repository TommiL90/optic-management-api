import { expect, describe, it, beforeEach, vi } from 'vitest';

import { InMemoryUsersRepository } from '../repositories/in-memory-users-repository';
import { UserService } from '../users.service';
import { NotFoundException } from '@/core/errors/app-errors';

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
let findUserByIdUseCase: UserService;

describe('Find User By Id Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    findUserByIdUseCase = new UserService(usersRepository);
  });

  it('should find a user by id', async () => {
    const createdUser = await findUserByIdUseCase.createUser({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
    });

    const user = await findUserByIdUseCase.findUserById(createdUser.id);

    expect(user.id).toBe(createdUser.id);
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('johndoe@example.com');
    expect((user as any).password).toBeUndefined();
  });

  it('should not find a user with non-existing id', async () => {
    await expect(() =>
      findUserByIdUseCase.findUserById('non-existing-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should not find a user with empty id', async () => {
    await expect(() =>
      findUserByIdUseCase.findUserById(''),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});