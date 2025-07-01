"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { NavUser } from "./nav-user"
import { Session } from "next-auth"
import { pathTitles } from "@/lib/constants"
import { usePathname } from "next/navigation"

const DashboardLayoutClient = ({
	session,
	children,
}: {
	session: Session
	children: React.ReactNode
}) => {
	const pathname = usePathname()
	const currentPath = pathname.split("/")[2]

	return (
		<SidebarProvider>
			<AppSidebar session={session} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 justify-between">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1 cursor-pointer" />
					</div>
					<div className="px-4">
						<NavUser session={session} />
					</div>
				</header>
				<section className="flex flex-col px-4 grow">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold mb-6">
							{pathTitles[currentPath]}
						</h1>
					</div>
					{children}
				</section>
			</SidebarInset>
		</SidebarProvider>
	)
}

export default DashboardLayoutClient
