import { Injectable, Logger, OnModuleInit } from '@nestjs/common'

import { RedisService } from '@/redis/redis.service'

@Injectable()
export class PresenceService implements OnModuleInit {
	private readonly logger = new Logger(PresenceService.name)

	constructor(private readonly redisService: RedisService) {}

	async onModuleInit() {
		try {
			const socketKeys =
				await this.redisService.client.keys('user:sockets:*')
			const tempSocketKeys =
				await this.redisService.client.keys('socket:*')
			const allKeys = [...socketKeys, ...tempSocketKeys]

			if (allKeys.length > 0) {
				await this.redisService.client.del(...allKeys)
				this.logger.log(
					`Очищено ${allKeys.length} зависших сокет-ключей после перезапуска.`
				)
			}
		} catch (err: any) {
			this.logger.error(`Ошибка при сбросе сокет-ключей: ${err.message}`)
		}
	}

	async addSocket(userId: string, socketId: string): Promise<boolean> {
		const userSocketsKey = `user:sockets:${userId}`

		await this.redisService.client.sadd(userSocketsKey, socketId)
		await this.redisService.client.expire(userSocketsKey, 60)

		await this.redisService.client.set(
			`socket:${socketId}`,
			userId,
			'EX',
			60
		)

		const wasAlreadyOnline = await this.redisService.client.exists(
			`presence:${userId}`
		)
		await this.redisService.client.set(`presence:${userId}`, '1', 'EX', 45)

		return wasAlreadyOnline === 0
	}

	async touchPresence(userId: string): Promise<void> {
		const userSocketsKey = `user:sockets:${userId}`
		await this.redisService.client.set(`presence:${userId}`, '1', 'EX', 45)
		await this.redisService.client.expire(userSocketsKey, 60)
	}

	async removeSocket(
		socketId: string
	): Promise<{ userId: string | null; isNowOffline: boolean }> {
		const userId = await this.redisService.client.get(`socket:${socketId}`)
		if (!userId) return { userId: null, isNowOffline: false }

		const userSocketsKey = `user:sockets:${userId}`
		await this.redisService.client.srem(userSocketsKey, socketId)
		await this.redisService.client.del(`socket:${socketId}`)

		const remainingSockets =
			await this.redisService.client.scard(userSocketsKey)

		if (remainingSockets === 0) {
			await this.redisService.client.del(`presence:${userId}`)
			await this.redisService.client.del(userSocketsKey)
			return { userId, isNowOffline: true }
		}

		return { userId, isNowOffline: false }
	}

	async filteredOnlineUsers(userIds: string[]): Promise<string[]> {
		if (!userIds || userIds.length === 0) return []

		const keys = userIds.map(id => `presence:${id}`)
		const results = await this.redisService.client.mget(keys)

		return userIds.filter((_, index) => results[index] !== null)
	}
}
