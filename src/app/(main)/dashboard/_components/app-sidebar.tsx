"use client"

import { Dna, Settings2, UserRoundCheck, Users } from "lucide-react"

import { NavItems } from "./nav-items"
import { NavUser } from "./nav-user"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Session } from "next-auth"

const navItems = [
	{
		name: "Users",
		url: "/users",
		icon: Users,
	},
	{
		name: "Roles",
		url: "/roles",
		icon: UserRoundCheck,
	},
	{
		name: "Settings",
		url: "/settings",
		icon: Settings2,
	},
]

export function AppSidebar({
	session,
	...props
}: React.ComponentProps<typeof Sidebar> & { session: Session }) {
	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="#">
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<Dna className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										BDGAD
									</span>
									<span className="truncate text-xs">
										Biomedical Data Warehouse for Genomic
										Analysis and Diagnosis
									</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavItems items={navItems} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser session={session} />
			</SidebarFooter>
		</Sidebar>
	)
}
