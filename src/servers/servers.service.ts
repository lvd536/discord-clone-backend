// servers.service.ts
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { ChannelType, RolePermissions } from '@prisma/__generated__/enums'
import { v4 as uuidv4 } from 'uuid'

import { PrismaService } from '@/prisma/prisma.service'

import { CreateServerDto } from './dto/create-server.dto'
import { UpdateServerDto } from './dto/update-server.dto'

@Injectable()
export class ServersService {
	constructor(private readonly prismaService: PrismaService) {}

	async createServer(dto: CreateServerDto, ownerId: string) {
		const inviteCode = uuidv4()

		return this.prismaService.$transaction(async tx => {
			const server = await tx.server.create({
				data: {
					...dto,
					inviteCode,
					ownerId,
					channels: {
						createMany: {
							data: [
								{ name: 'general', type: ChannelType.TEXT },
								{ name: 'lobby', type: ChannelType.VOICE }
							]
						}
					}
				}
			})

			const ownerRole = await tx.role.create({
				data: {
					name: 'Владелец',
					color: '#ff0000',
					permissions: [RolePermissions.OWNER],
					serverId: server.id
				}
			})

			await tx.role.create({
				data: {
					name: 'Участник',
					color: '#18cc00',
					permissions: [RolePermissions.CAN_INVITE],
					serverId: server.id
				}
			})

			await tx.member.create({
				data: {
					serverId: server.id,
					userId: ownerId,
					roles: {
						connect: { id: ownerRole.id }
					}
				}
			})

			return tx.server.findUnique({
				where: { id: server.id },
				include: { channels: true, roles: true }
			})
		})
	}

	async joinServer(inviteCode: string, userId: string) {
		const server = await this.prismaService.server.findUnique({
			where: { inviteCode },
			include: { roles: true }
		})

		if (!server) {
			throw new NotFoundException('Код приглашения недействителен')
		}

		const memberRole = server.roles.find(r => r.name === 'Участник')

		return this.prismaService.member.create({
			data: {
				serverId: server.id,
				userId: userId,
				roles: memberRole
					? { connect: { id: memberRole.id } }
					: undefined
			}
		})
	}

	async updateServer(dto: UpdateServerDto, serverId: string) {
		return this.prismaService.server.update({
			where: { id: serverId },
			data: dto
		})
	}

	async removeServer(serverId: string) {
		return this.prismaService.server.delete({ where: { id: serverId } })
	}

	async getUserServers(userId: string) {
		return this.prismaService.server.findMany({
			where: {
				members: {
					some: {
						userId
					}
				}
			}
		})
	}

	async getServerInfo(serverId: string) {
		return this.prismaService.server.findUnique({
			where: { id: serverId },
			include: {
				channels: true,
				roles: true,
				members: {
					include: {
						roles: true,
						user: {
							select: {
								id: true,
								displayName: true,
								email: true,
								avatarUrl: true
							}
						}
					}
				}
			}
		})
	}

	async getServerMembers(serverId: string) {
		return this.prismaService.server.findUnique({
			where: { id: serverId },
			select: {
				members: {
					include: {
						roles: true,
						user: {
							select: {
								id: true,
								displayName: true,
								email: true,
								avatarUrl: true
							}
						}
					}
				}
			}
		})
	}

	async grantRolesToMember(memberId: string, roleIds?: string[]) {
		return this.prismaService.member.update({
			where: { id: memberId },
			data: {
				roles: {
					set: roleIds ? roleIds.map(id => ({ id })) : []
				}
			},
			include: { roles: true }
		})
	}

	async revokeRoleFromMember(memberId: string, roleId: string) {
		return this.prismaService.member.update({
			where: { id: memberId },
			data: {
				roles: {
					disconnect: { id: roleId }
				}
			},
			include: { roles: true }
		})
	}

	async kickMember(memberId: string) {
		const member = await this.prismaService.member.findUnique({
			where: { id: memberId },
			select: {
				userId: true,
				server: {
					select: {
						ownerId: true
					}
				}
			}
		})

		if (member.userId === member.server.ownerId) {
			throw new BadRequestException(
				'Создатель сервера не может выгнать самого себя'
			)
		}

		return this.prismaService.member.delete({
			where: { id: memberId }
		})
	}
}
