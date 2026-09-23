import { IsNotEmpty, IsString } from 'class-validator'

export class JoinNotificationChannelDto {
	@IsString({ message: 'Канал должен быть строкой' })
	@IsNotEmpty({ message: 'Канал не может быть пустым' })
	channelId: string
}
