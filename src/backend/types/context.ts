import { Context } from "hono"
import { Variables } from "./index"

// Base context type for handlers that use validation
export type ValidatedContext = Context<{
	Variables: Variables
}>
