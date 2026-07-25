import { Role } from '@prisma/__generated__/client'

type RoleConstantType = Omit<
	Role,
	'id' | 'createdAt' | 'serverId' | 'updatedAt'
>

export const MEMBER_ROLE: RoleConstantType = {
	name: 'member',
	color: '#18cc00',
	permissions: ['CAN_INVITE']
} as const

export const OWNER_ROLE: RoleConstantType = {
	name: 'owner',
	color: '#ff0000',
	permissions: ['OWNER']
} as const
