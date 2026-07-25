import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/__generated__/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		const pool = new Pool({
			connectionString: process.env.POSTGRES_URI
		})

		const adapter = new PrismaPg(pool)

		super({ adapter })
	}

	public async onModuleInit(): Promise<void> {
		await this.$connect()
	}

	public async onModuleDestroy(): Promise<void> {
		await this.$disconnect()
	}
}
