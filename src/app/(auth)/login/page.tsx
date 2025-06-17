import { LoginForm } from "./_components/login-form"
import Image from "next/image"

export default function LoginPage() {
	return (
		<div className="min-h-screen flex">
			{/* Left side - Blue gradient background */}
			<div className="w-3/5 bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col gap-30 items-center justify-center">
				<div className="text-white text-center space-y-4">
					<h1 className="text-5xl font-bold">BDGAD System</h1>
					<p className="text-xl font-semibold">Admin Page</p>
				</div>
					<Image
						src="/undraw_working_n9u0.svg"
						alt="Working illustration"
						width={700}
						height={700}
					/>
			</div>

			{/* Right side - Login form */}
			<div className="w-2/5 flex items-center justify-center bg-white">
				<div className="w-full max-w-md px-8">
					<LoginForm />
				</div>
			</div>
		</div>
	)
}
