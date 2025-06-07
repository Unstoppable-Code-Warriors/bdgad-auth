import React, { useState } from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface PaginationProps {
	total: number
	value?: number
	onChange?: (page: number) => void
	siblings?: number
	boundaries?: number
	className?: string
}

const Pagination = ({
	total,
	value,
	onChange,
	siblings = 1,
	boundaries = 1,
	className,
}: PaginationProps) => {
	// Use local state if no external state control is provided
	const [internalPage, setInternalPage] = useState(value || 1)
	const isControlled = value !== undefined && onChange !== undefined
	const currentPage = isControlled
		? Math.max(1, Math.min(value, total))
		: internalPage

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= total && page !== currentPage) {
			if (isControlled) {
				onChange(page)
			} else {
				setInternalPage(page)
			}
		}
	}

	const generatePageNumbers = () => {
		const pages: (number | "ellipsis")[] = []

		// Calculate total slots we want to maintain
		const maxSlots = Math.min(total, 2 * boundaries + 2 * siblings + 3) // boundaries + siblings + current + 2 ellipsis

		if (total <= maxSlots) {
			// If total pages fit in our slots, show all pages
			for (let i = 1; i <= total; i++) {
				pages.push(i)
			}
			return pages
		}

		// Always show first boundary pages
		for (let i = 1; i <= boundaries; i++) {
			pages.push(i)
		}

		// Calculate the range around current page
		const leftSiblings = Math.max(boundaries + 1, currentPage - siblings)
		const rightSiblings = Math.min(
			total - boundaries,
			currentPage + siblings
		)

		// Adjust siblings to maintain consistent count
		let adjustedLeft = leftSiblings
		let adjustedRight = rightSiblings

		// If we're near the beginning, extend right siblings
		if (currentPage - boundaries <= siblings + 1) {
			adjustedRight = Math.min(
				total - boundaries,
				boundaries + 1 + 3 * siblings
			)
		}
		// If we're near the end, extend left siblings
		else if (total - currentPage <= siblings + boundaries) {
			adjustedLeft = Math.max(
				boundaries + 1,
				total - boundaries - 3 * siblings
			)
		}

		// Add ellipsis after boundaries if there's a gap
		if (adjustedLeft > boundaries + 1) {
			pages.push("ellipsis")
		}

		// Add pages around current page
		for (let i = adjustedLeft; i <= adjustedRight; i++) {
			if (i > boundaries && i <= total - boundaries) {
				pages.push(i)
			}
		}

		// Add ellipsis before last boundary pages if there's a gap
		if (adjustedRight < total - boundaries) {
			pages.push("ellipsis")
		}

		// Always show last boundary pages
		for (
			let i = Math.max(total - boundaries + 1, boundaries + 1);
			i <= total;
			i++
		) {
			if (i > boundaries) {
				pages.push(i)
			}
		}

		return pages
	}

	const pages = generatePageNumbers()

	if (total <= 1) {
		return null
	}

	return (
		<nav
			role="navigation"
			aria-label="pagination"
			className={cn("mx-auto flex w-full justify-center", className)}
		>
			<div className="flex flex-row items-center gap-2">
				{/* Previous button */}
				<Button
					variant="outline"
					size="icon"
					onClick={() => handlePageChange(currentPage - 1)}
					disabled={currentPage <= 1}
					aria-label="Go to previous page"
					className="cursor-pointer"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				{/* Page numbers */}
				{pages.map((page, index) => {
					if (page === "ellipsis") {
						return (
							<div
								key={`ellipsis-${index}`}
								className="flex h-9 w-9 items-center justify-center"
							>
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">More pages</span>
							</div>
						)
					}

					return (
						<Button
							key={page}
							variant={
								currentPage === page ? "default" : "outline"
							}
							size="icon"
							onClick={() => handlePageChange(page)}
							aria-label={`Go to page ${page}`}
							aria-current={
								currentPage === page ? "page" : undefined
							}
							className="cursor-pointer"
						>
							{page}
						</Button>
					)
				})}

				{/* Next button */}
				<Button
					variant="outline"
					size="icon"
					onClick={() => handlePageChange(currentPage + 1)}
					disabled={currentPage >= total}
					aria-label="Go to next page"
					className="cursor-pointer"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</nav>
	)
}

export { Pagination }
