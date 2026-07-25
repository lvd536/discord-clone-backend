import { Module } from '@nestjs/common'

import { ServersModule } from '@/servers/servers.module'

import { ChannelsController } from './channels.controller'
import { ChannelsService } from './channels.service'

@Module({
	imports: [ServersModule],
	controllers: [ChannelsController],
	providers: [ChannelsService]
})
export class ChannelsModule {}
