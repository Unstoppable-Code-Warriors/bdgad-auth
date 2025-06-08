import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	/* config options here */
	output: "standalone",
	async headers() {
		return [
			{
				// Apply these headers to all API routes
				source: "/api/(.*)",
				headers: [
					{
						key: "Access-Control-Allow-Origin",
						value: "*", // Replace with your frontend URL in production
					},
					{
						key: "Access-Control-Allow-Methods",
						value: "GET, POST, PUT, DELETE, OPTIONS, PATCH",
					},
					{
						key: "Access-Control-Allow-Headers",
						value: "Content-Type, Authorization, Accept, X-Requested-With",
					},
					{
						key: "Access-Control-Max-Age",
						value: "86400",
					},
				],
			},
		]
	},
}

export default nextConfig
