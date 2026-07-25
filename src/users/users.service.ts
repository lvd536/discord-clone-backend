import { Injectable } from '@nestjs/common'
import { UserUpdateInput } from '@prisma/__generated__/models'
import * as bcrypt from 'bcrypt'
import { NotFoundError } from 'rxjs'

import { PrismaService } from '@/prisma/prisma.service'

import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
export class UsersService {
	constructor(private readonly prismaService: PrismaService) {}

	async findById(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				id
			}
		})

		if (!user) throw new NotFoundError('Не удалось найти пользователя')

		return user
	}

	async findByEmail(email: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				email
			}
		})

		if (!user) throw new NotFoundError('Не удалось найти пользователя')

		return user
	}

	async findAccountsByUserId(userId: string) {
		return this.prismaService.account.findMany({
			where: {
				userId
			}
		})
	}

	async create(createUserDto: CreateUserDto) {
		const salt = await bcrypt.genSalt(10)
		const { displayName, email, password } = createUserDto
		const hashedPassword = await bcrypt.hash(password, salt)

		return this.prismaService.user.create({
			data: { displayName, email, password: hashedPassword }
		})
	}

	async update(userId: string, data: UserUpdateInput) {
		return this.prismaService.user.update({ where: { id: userId }, data })
	}
}
