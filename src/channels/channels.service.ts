import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'

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
		const channel = await this.prismaService.channel.findUnique({
			where: { id: channelId }
		})

		if (!channel) {
			throw new NotFoundException('Канал не найден')
		}

		if (channel.name === 'general') {
			throw new BadRequestException(
				'Нельзя удалить основной канал general'
			)
		}

		return this.prismaService.channel.delete({
			where: { id: channelId }
		})
	}

	async channel(channelId: string) {
		return this.prismaService.channel.findUnique({
			where: { id: channelId }
		})
	}
}
