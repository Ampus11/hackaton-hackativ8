import { createApp } from "./app";

const app = createApp();

export { app };
export default app;

if (typeof Bun !== "undefined" && process.env.WORKER !== "1") {
	const port = Number(process.env.PORT ?? 4000);
	app.listen(port);
	console.log(`back API listening on http://localhost:${port}`);
}
