import Link from "next/link"
import { Button } from "../ui/button"

const NonAuthScreen = () => {
	return (
		<div className="min-h-screen flex items-center justify-center flex-col gap-4">
			<h1 className="text-4xl font-bold">Không có quyền truy cập</h1>
			<p className="text-muted-foreground">
				Bạn không có quyền truy cập vào trang này
			</p>
			<Button asChild>
				<Link href="/login">Đi đến đăng nhập</Link>
			</Button>
		</div>
	)
}

export default NonAuthScreen
