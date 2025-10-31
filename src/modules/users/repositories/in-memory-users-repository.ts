
import { User } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { IUserRepository } from './users.repository.interface'
import { CreateUser, UpdateUser, FetchUsers, UserWithoutPassword } from '../schemas/users.schemas'

export class InMemoryUsersRepository implements IUserRepository {
  public items: User[] = []

  async findById(id: string): Promise<UserWithoutPassword | null> {
    const user = this.items.find((item) => item.id === id)

    if (!user) {
      return null
    }

    const { password, ...userWithoutPassword } = user
    return { ...userWithoutPassword, createdAt: new Date(user.createdAt), updatedAt: new Date(user.updatedAt) }
  }

  async findByEmail(email: string): Promise<UserWithoutPassword | null> {
    const user = this.items.find((item) => item.email === email)

    if (!user) {
      return null
    }

    const { password, ...userWithoutPassword } = user
    return { ...userWithoutPassword, createdAt: new Date(user.createdAt), updatedAt: new Date(user.updatedAt) }
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    const user = this.items.find((item) => item.email === email)

    if (!user) {
      return null
    }

    return user
  }

  async create(data: CreateUser): Promise<UserWithoutPassword> {
    const user: User = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      password: data.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.items.push(user)

    const { password, ...userWithoutPassword } = user
    return { ...userWithoutPassword, createdAt: new Date(user.createdAt), updatedAt: new Date(user.updatedAt) }
  }

  async findAll(skip: number, take: number): Promise<FetchUsers> {
    const paginatedItems = this.items.slice(skip, skip + take)
    const data: UserWithoutPassword[] = paginatedItems.map(item => {
      const { password, ...userWithoutPassword } = item
      return { ...userWithoutPassword, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) }
    })

    return {
      count: this.items.length,
      data,
    }
  }

  async update(id: string, data: UpdateUser): Promise<UserWithoutPassword> {
    const userIndex = this.items.findIndex((item) => item.id === id)

    if (userIndex === -1) {
      throw new Error('User not found')
    }

    const user = this.items[userIndex]

    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    }

    this.items[userIndex] = updatedUser

    const { password, ...userWithoutPassword } = updatedUser
    return { ...userWithoutPassword, createdAt: new Date(updatedUser.createdAt), updatedAt: new Date(updatedUser.updatedAt) }
  }

  async delete(id: string): Promise<void> {
    const initialLength = this.items.length
    this.items = this.items.filter((item) => item.id !== id)

    if (this.items.length === initialLength) {
      throw new Error('User not found')
    }
  }
}