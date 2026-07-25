import { ChannelType } from '@prisma/__generated__/enums'
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateChannelDto {
	@IsString({ message: 'Название канала должно быть строкой' })
	@IsNotEmpty({ message: 'Название канала не может быть пустым' })
	name: string

	@IsNotEmpty()
	type: ChannelType
}
