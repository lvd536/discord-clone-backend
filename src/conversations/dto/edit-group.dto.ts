import { IsArray, IsOptional, IsString, MinLength } from 'class-validator'

export class EditGroupDto {
	@IsString({ message: 'Название группы должно быть строкой' })
	@MinLength(4, { message: 'Минимальная длина названия группы 4 символа' })
	name: string

	@IsOptional()
	@IsArray()
	participiantIds?: string[]
}
