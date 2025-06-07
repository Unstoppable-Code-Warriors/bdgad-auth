"use client"

import { type LucideIcon } from "lucide-react"

import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavItems({
	items,
}: {
	items: {
		name: string
		url: string
		icon: LucideIcon
	}[]
}) {
	const { isMobile } = useSidebar()

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			{/* <SidebarGroupLabel>Projects</SidebarGroupLabel> */}
			<SidebarMenu>
				{items.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton asChild>
							<Link href={`/dashboard/${item.url}`}>
								<item.icon />
								<span>{item.name}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
