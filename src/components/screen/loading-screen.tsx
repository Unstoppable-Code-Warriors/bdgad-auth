import { cn } from "@/lib/utils"
import { LoaderCircle } from "lucide-react"
const LoadingScreen = ({ className = "" }: { className?: string }) => {
	return (
		<div
			className={cn("h-full flex items-center justify-center", className)}
		>
			<LoaderCircle className="animate-spin" />
		</div>
	)
}

export default LoadingScreen
