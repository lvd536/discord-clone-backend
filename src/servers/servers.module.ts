import { Module } from '@nestjs/common'

import { RolesController } from './roles.controller'
import { RolesService } from './roles.service'
import { ServersController } from './servers.controller'
import { ServersService } from './servers.service'

@Module({
	controllers: [ServersController, RolesController],
	providers: [ServersService, RolesService],
	exports: [ServersService, RolesService]
})
export class ServersModule {}
