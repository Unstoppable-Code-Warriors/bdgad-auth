"use client"

import { ChevronsUpDown, CircleUser, LogOut, User } from "lucide-react"
import { signOut } from "next-auth/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Session } from "next-auth"

export function NavUser({ session }: { session: Session }) {
	const handleLogout = async () => {
		await signOut({ redirectTo: "/login" })
	}

	// Don't render if no user
	if (!session) {
		return null
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					className="h-12 w-12 rounded-full"
				>
				<CircleUser className="size-8"/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56 rounded-lg"
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-3 py-2 text-sm">
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage
								src={session.user.image || ""}
								alt={session.user.email}
							/>
							<AvatarFallback className="rounded-lg">
							<User/>
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col">
							<span className="truncate text-xs mb-1">
								{session.user.email}
							</span>
							<Badge variant="secondary" className="text-xs w-fit">
								System Admin
							</Badge>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleLogout}
					className="cursor-pointer"
				>
					<LogOut className="h-4 w-4 mr-2" />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
