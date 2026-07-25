import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { FriendshipStatus } from '@prisma/__generated__/enums'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class FriendshipsService {
	constructor(private readonly prismaService: PrismaService) {}

	async sendFriendRequest(userId: string, friendId: string) {
		if (userId === friendId) {
			throw new BadRequestException(
				'Нельзя добавить в друзья самого себя'
			)
		}

		const existing = await this.prismaService.friendship.findFirst({
			where: {
				OR: [
					{ userId, friendId },
					{ userId: friendId, friendId: userId }
				]
			}
		})

		if (existing) {
			throw new BadRequestException(
				'Связь между пользователями уже существует'
			)
		}

		return this.prismaService.friendship.create({
			data: {
				userId,
				friendId,
				status: FriendshipStatus.PENDING
			}
		})
	}

	async acceptFriendRequest(userId: string, requesterId: string) {
		const friendship = await this.prismaService.friendship.findUnique({
			where: {
				userId_friendId: {
					userId: requesterId,
					friendId: userId
				}
			}
		})

		if (!friendship || friendship.status !== FriendshipStatus.PENDING) {
			throw new NotFoundException('Запрос в друзья не найден')
		}

		return this.prismaService.friendship.update({
			where: { id: friendship.id },
			data: { status: FriendshipStatus.ACCEPTED }
		})
	}

	async removeFriendship(userId: string, targetId: string) {
		const friendship = await this.prismaService.friendship.findFirst({
			where: {
				OR: [
					{ userId, friendId: targetId },
					{ userId: targetId, friendId: userId }
				]
			}
		})

		if (!friendship) {
			throw new NotFoundException('Связь не найдена')
		}

		return this.prismaService.friendship.delete({
			where: { id: friendship.id }
		})
	}

	async getFriendsList(
		userId: string,
		status: FriendshipStatus = FriendshipStatus.ACCEPTED
	) {
		const friendships = await this.prismaService.friendship.findMany({
			where: {
				OR: [
					{ userId, status },
					{ friendId: userId, status }
				]
			},
			include: {
				user: {
					select: {
						id: true,
						displayName: true,
						avatarUrl: true,
						email: true
					}
				},
				friend: {
					select: {
						id: true,
						displayName: true,
						avatarUrl: true,
						email: true
					}
				}
			}
		})

		return friendships.map(f => (f.userId === userId ? f.friend : f.user))
	}
}
