import NonAuthScreen from "@/components/screen/non-auth-screen"
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar"
import { auth } from "@/lib/next-auth/auth"
import { AppSidebar } from "./_components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
	const session = await auth()

	if (!session?.user) {
		return <NonAuthScreen />
	}
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
				{children}
			</SidebarInset>
		</SidebarProvider>
	)
}

export default DashboardLayout
