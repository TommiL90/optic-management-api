import { InMemoryUsersRepository } from '../repositories/in-memory-users-repository';
import { UserService } from '../users.service';

/**
 * Test utilities for User module
 * Provides factories and helpers for consistent test data
 */

export interface TestUserData {
  name: string;
  email: string;
  password: string;
}

export const createTestUserData = (overrides: Partial<TestUserData> = {}): TestUserData => ({
  name: 'John Doe',
  email: 'johndoe@example.com',
  password: '123456',
  ...overrides,
});

export const createTestUserDataArray = (count: number, baseEmail = 'user'): TestUserData[] => {
  return Array.from({ length: count }, (_, index) => 
    createTestUserData({
      name: `User ${index + 1}`,
      email: `${baseEmail}${index + 1}@example.com`,
    })
  );
};

export const setupUserService = () => {
  const usersRepository = new InMemoryUsersRepository();
  const userService = new UserService(usersRepository);
  
  return {
    usersRepository,
    userService,
  };
};

export const createUserInRepository = async (
  userService: UserService, 
  userData: TestUserData
) => {
  return await userService.createUser(userData);
};

export const createMultipleUsers = async (
  userService: UserService,
  usersData: TestUserData[]
) => {
  const createdUsers = [];
  for (const userData of usersData) {
    const user = await userService.createUser(userData);
    createdUsers.push(user);
  }
  return createdUsers;
};

export const expectUserToMatch = (actual: any, expected: TestUserData) => {
  expect(actual.id).toEqual(expect.any(String));
  expect(actual.name).toBe(expected.name);
  expect(actual.email).toBe(expected.email);
  expect(actual.password).toBeUndefined(); // Password should not be returned
  expect(actual.createdAt).toBeInstanceOf(Date);
  expect(actual.updatedAt).toBeInstanceOf(Date);
};

export const expectPaginationToMatch = (
  result: any,
  expectedCount: number,
  expectedPage: number,
  expectedLimit: number,
  expectedPages: number
) => {
  expect(result.data).toHaveLength(Math.min(expectedLimit, expectedCount));
  expect(result.count).toBe(expectedCount);
  expect(result.pages).toBe(expectedPages);
  
  if (expectedPage > 1) {
    expect(result.prevPage).toContain(`page=${expectedPage - 1}`);
  } else {
    expect(result.prevPage).toBeNull();
  }
  
  if (expectedPage < expectedPages) {
    expect(result.nextPage).toContain(`page=${expectedPage + 1}`);
  } else {
    expect(result.nextPage).toBeNull();
  }
};
