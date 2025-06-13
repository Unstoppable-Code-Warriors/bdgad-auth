"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { DialogProvider } from "@/hooks/use-dialog"

const queryClient = new QueryClient()

const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<SessionProvider>
			<QueryClientProvider client={queryClient}>
				<DialogProvider>
					{children}
					<Toaster position="top-center" />
				</DialogProvider>
			</QueryClientProvider>
		</SessionProvider>
	)
}

export default Providers
