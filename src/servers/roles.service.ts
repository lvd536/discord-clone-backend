import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'

import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto'

@Injectable()
export class RolesService {
	constructor(private readonly prismaService: PrismaService) {}

	async create(dto: CreateRoleDto, serverId: string) {
		return this.prismaService.role.create({
			data: {
				...dto,
				serverId
			}
		})
	}

	async update(dto: UpdateRoleDto, roleId: string) {
		const role = await this.prismaService.role.findUnique({
			where: { id: roleId }
		})

		if (!role) {
			throw new NotFoundException('Роль не найдена')
		}

		return this.prismaService.role.update({
			where: { id: roleId },
			data: dto
		})
	}

	async remove(roleId: string) {
		const role = await this.prismaService.role.findUnique({
			where: { id: roleId }
		})

		if (!role) {
			throw new NotFoundException('Роль не найдена')
		}

		return this.prismaService.role.delete({
			where: { id: roleId }
		})
	}

	async getServerRoles(serverId: string) {
		return this.prismaService.role.findMany({
			where: { serverId },
			orderBy: { createdAt: 'asc' }
		})
	}
}
