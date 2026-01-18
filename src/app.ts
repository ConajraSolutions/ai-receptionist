// Conajra Solutions © 2026
// Author: Marwan

// Main application entry point. Initializes the mediator (which owns storage)
// and starts the server. Storage must connect before accepting requests

import express from "express"; //
import "dotenv/config";

import { mediator } from "./modules/mediator";
 
// server setup code
const app = express();
app.use(express.json());

function check_env(name: string): string 
{
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing required env var: ${name}`);
    return value;
}

const call_mediator = new mediator({
    db_path: check_env("DB_PATH"),
    redis_url: check_env("REDIS_URL"),
    rate_limit_max: parseInt(check_env("RATE_LIMIT_MAX")),
    rate_limit_window: parseInt(check_env("RATE_LIMIT_WINDOW")),
    rate_limit_fail_open: check_env("RATE_LIMIT_FAIL_OPEN") === "true",
    config_cache_ttl: parseInt(check_env("CONFIG_CACHE_TTL"))
});

app.post("/vapi/webhook", async (req, res) =>
{
    try
    {
        const result = await call_mediator.handle_webhook(req.body);
        res.json(result);
    }
    catch (e: any)
    {
        res.status(500).json({ error: e.message });
    }
});

async function shutdown()
{
    console.log("shutting down.......");
    await call_mediator.disconnect();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const PORT = process.env.PORT || 3000;

call_mediator.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`server is listening on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("failed to connect storage:", error);
        process.exit(1);
    });