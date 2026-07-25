import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'

import { CreateChannelDto } from './dto/create-channel.dto'
import { UpdateChannelDto } from './dto/update-channel.dto'

@Injectable()
export class ChannelsService {
	constructor(private readonly prismaService: PrismaService) {}

	async createChannel(dto: CreateChannelDto, serverId: string) {
		return this.prismaService.channel.create({
			data: {
				...dto,
				serverId
			}
		})
	}

	async updateChannel(dto: UpdateChannelDto, channelId: string) {
		return this.prismaService.channel.update({
			where: { id: channelId },
			data: { ...dto }
		})
	}

	async removeChannel(channelId: string) {
		return this.prismaService.channel.delete({ where: { id: channelId } })
	}

	async channel(channelId: string) {
		return this.prismaService.channel.findUnique({
			where: { id: channelId }
		})
	}
}
