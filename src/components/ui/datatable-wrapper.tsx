"use client"

import dynamic from "next/dynamic"
import { ComponentProps } from "react"
import { DataTable } from "./datatable"

// Create a loading component
const LoadingTable = () => (
	<div className="w-full">
		<div className="flex items-center justify-between py-4">
			<div className="h-10 w-64 bg-muted animate-pulse rounded" />
			<div className="h-10 w-24 bg-muted animate-pulse rounded" />
		</div>
		<div className="rounded-md border">
			<div className="p-4">
				<div className="space-y-3">
					<div className="h-4 bg-muted animate-pulse rounded w-full" />
					<div className="h-4 bg-muted animate-pulse rounded w-full" />
					<div className="h-4 bg-muted animate-pulse rounded w-full" />
				</div>
			</div>
		</div>
	</div>
)

// Type-safe wrapper component that handles SSR
export function Datatable<TData, TValue>(
	props: ComponentProps<typeof DataTable<TData, TValue>>
) {
	// Dynamically import and render the DataTable component
	const DynamicDataTable = dynamic(
		() => import("./datatable").then((mod) => ({ default: mod.DataTable })),
		{
			ssr: false,
			loading: LoadingTable,
		}
	) as typeof DataTable

	return <DynamicDataTable {...props} />
}
