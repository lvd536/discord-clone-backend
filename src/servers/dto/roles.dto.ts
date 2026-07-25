import { ApiProperty } from '@nestjs/swagger'
import { RolePermissions } from '@prisma/__generated__/enums'
import {
	IsArray,
	IsEnum,
	IsHexColor,
	IsString,
	MinLength
} from 'class-validator'

export class CreateRoleDto {
	@ApiProperty({ example: 'Администратор' })
	@IsString()
	@MinLength(3, { message: 'Имя роли должно быть не менее 3 символов' })
	name: string

	@ApiProperty({ example: '#ff0000' })
	@IsHexColor({ message: 'Некорректный HEX-формат цвета роли' })
	color: string

	@ApiProperty({ enum: RolePermissions, isArray: true })
	@IsArray()
	@IsEnum(RolePermissions, { each: true })
	permissions: RolePermissions[]
}

export class UpdateRoleDto extends CreateRoleDto {}
