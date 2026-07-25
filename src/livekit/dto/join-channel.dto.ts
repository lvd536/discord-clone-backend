import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class JoinChannelDto {
	@IsString()
	@IsNotEmpty({ message: 'channelId не может быть пустым' })
	channelId: string
}
