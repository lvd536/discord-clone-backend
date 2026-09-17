import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
	public client: Redis
	private readonly logger = new Logger(RedisService.name)

	constructor(private readonly configService: ConfigService) {}

	onModuleInit() {
		this.client = new Redis({
			host: this.configService.getOrThrow<string>('REDIS_HOST'),
			port: this.configService.getOrThrow<number>('REDIS_PORT'),
			password:
				this.configService.get<string>('REDIS_PASSWORD') || undefined,
			username: this.configService.get<string>('REDIS_USER') || undefined,
			lazyConnect: false
		})

		this.client.on('connect', () =>
			this.logger.log('Подключение к Redis успешно установлено')
		)
		this.client.on('error', err => this.logger.error('Ошибка Redis:', err))
	}

	onModuleDestroy() {
		this.client.disconnect()
	}
}
