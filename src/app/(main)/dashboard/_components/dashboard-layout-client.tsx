"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
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
				<header className="flex h-16 shrink-0 items-center gap-2">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1 cursor-pointer" />
						{/* <Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/> */}
						{/* <Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink href="#">
										Building Your Application
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									<BreadcrumbPage>
										Data Fetching
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb> */}
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
