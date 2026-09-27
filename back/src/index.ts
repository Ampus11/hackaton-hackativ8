import { createApp } from "./app";

const app = createApp();

export { app };
export default app;

const port = Number(process.env.PORT ?? 4000);

// Default to loopback: the API is published by cloudflared on this same host, so
// binding to every interface would expose it directly and bypass the tunnel.
const hostname = process.env.HOST ?? "127.0.0.1";

app.listen({ port, hostname });
console.log(`back API listening on http://${hostname}:${port}`);
