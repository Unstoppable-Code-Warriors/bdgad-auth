import NonAuthScreen from "@/components/screen/non-auth-screen"
import DashboardLayoutClient from "./_components/dashboard-layout-client"
import { auth } from "@/lib/next-auth/auth"

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
	const session = await auth()

	if (!session?.user) {
		return <NonAuthScreen />
	}
	return (
		<DashboardLayoutClient session={session}>
			{children}
		</DashboardLayoutClient>
	)
}

export default DashboardLayout
