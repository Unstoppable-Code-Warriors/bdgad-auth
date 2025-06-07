import Link from "next/link"
import { Button } from "../ui/button"

const NonAuthScreen = () => {
	return (
		<div className="min-h-screen flex items-center justify-center flex-col gap-4">
			<h1 className="text-4xl font-bold">Unauthorized</h1>
			<p className="text-muted-foreground">
				You are not authorized to access this page
			</p>
			<Button asChild>
				<Link href="/login">Go to login</Link>
			</Button>
		</div>
	)
}

export default NonAuthScreen
