import { Hono } from "hono"

const app = new Hono().basePath("/api/v1")

app.get("/", (c) => {
	return c.json({
		message: "Welcome to the BDGAD Auth Service API",
	})
})

export default app
