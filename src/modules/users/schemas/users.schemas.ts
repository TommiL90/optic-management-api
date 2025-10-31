import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid().describe('User unique identifier'),
  name: z.string().describe('User full name'),
  email: z.string().email().describe('User email address'),
  createdAt: z.string().datetime().describe('User creation timestamp'),
  updatedAt: z.string().datetime().describe('User last update timestamp'),
});

export const paginationSchema = z.object({
  page: z.number().describe('Current page number'),
  limit: z.number().describe('Number of items per page'),
  total: z.number().describe('Total number of items'),
  pages: z.number().describe('Total number of pages'),
  hasNext: z.boolean().describe('Whether there is a next page'),
  hasPrev: z.boolean().describe('Whether there is a previous page'),
  nextPage: z.string().nullable().describe('URL for the next page'),
  prevPage: z.string().nullable().describe('URL for the previous page'),
});

export const usersResponseSchema = z.object({
  users: z.array(userSchema),
  pagination: paginationSchema,
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('User full name'),
  email: z.string().email('Invalid email format').describe('User email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').describe('User password (minimum 6 characters)'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional().describe('User full name'),
  email: z.string().email('Invalid email format').optional().describe('User email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().describe('User password (minimum 6 characters)'),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format').describe('User unique identifier'),
});

export const queryPaginationSchema = z.object({
  page: z.coerce.number().min(1).catch(1).describe('Page number (starts at 1)'),
  limit: z.coerce.number().min(1).max(100).catch(10).describe('Number of items per page (max 100)'),
});

export const createUserResponseSchema = z.object({
  id: z.string().uuid().describe('User unique identifier'),
  name: z.string().describe('User full name'),
  email: z.string().email().describe('User email address'),
  createdAt: z.string().datetime().describe('User creation timestamp'),
  updatedAt: z.string().datetime().describe('User last update timestamp'),
});

export const getUserByIdResponseSchema = userSchema;

export const updateUserResponseSchema = userSchema;

export const errorResponseSchema = z.object({
  error: z.object({
    statusCode: z.number().describe('HTTP status code'),
    code: z.string().describe('Error code'),
    message: z.string().describe('Error message'),
    timestamp: z.string().describe('Error timestamp'),
    path: z.string().describe('Request path'),
    details: z.any().optional().describe('Additional error details'),
    stack: z.array(z.string()).optional().describe('Error stack trace'),
  }),
});

export const noContentResponseSchema = z.null().describe('No content');

export type UserResponse = z.infer<typeof userSchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type PaginationInfo = z.infer<typeof paginationSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type QueryPagination = z.infer<typeof queryPaginationSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Domain types inferred from Zod schemas (single source of truth)
 */
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserWithoutPassword = Omit<UserResponse, 'password' | 'createdAt' | 'updatedAt'> & {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface PaginatedUsers {
  nextPage: string | null;
  prevPage: string | null;
  count: number;
  pages: number;
  data: UserWithoutPassword[];
}

export interface FetchUsers {
  count: number;
  data: UserWithoutPassword[];
}
