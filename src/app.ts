// Conajra Solutions © 2026
// Author: Marwan
//
// Main application entry point. Initializes the mediator, creates the Vapi agent,
// and starts the webhook server to handle incoming Vapi function calls.

import "dotenv/config";
import express from "express";
import path from "path";
import { mediator } from "./modules/mediator";
import { vapi_agent } from "./modules/vapi_agent";

function check_env(name: string): string
{
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing required env var: ${name}`);
    return value;
}
async function shutdown(mediator: mediator): Promise<void>
{
    console.log("Shutting down gracefully...");
    await mediator.disconnect();
    process.exit(0);
}

async function main()
{
    const app = express();
    app.use(express.json());
    
    const tenant_id = check_env("TENANT_ID");
    const vapi_api_key = check_env("VAPI_API_KEY");
    const port = check_env("PORT");
    
    const call_mediator = new mediator({
        db_path: check_env("DB_PATH"),
        redis_url: check_env("REDIS_URL"),
        rate_limit_max: parseInt(check_env("RATE_LIMIT_MAX")),
        rate_limit_window: parseInt(check_env("RATE_LIMIT_WINDOW")),
        rate_limit_fail_open: check_env("RATE_LIMIT_FAIL_OPEN") === "true",
        config_cache_ttl: parseInt(check_env("CONFIG_CACHE_TTL"))
    });
    const agent = new vapi_agent(call_mediator, tenant_id, vapi_api_key);


    console.log("Connecting to storage...");
    await call_mediator.connect();

    console.log(`Creating Vapi assistant for tenant: ${tenant_id}`);
    await agent.create();

    console.log(`✓ Vapi assistant ready`);
    console.log(`  Assistant ID: ${agent.get_id()}`);
    console.log(`  Tenant: ${tenant_id}`);
    
    // Endpoint to get assistant ID and public key for demo/testing purposes
    app.get("/assistant-id", (req, res) =>
    {
        const assistant_id = agent.get_id();
        if (!assistant_id)
            return res.status(503).json({ error: "Assistant not ready" });
        res.json({
            assistant_id,
            tenant_id,
            public_key: process.env.VAPI_PUBLIC_KEY
        });
    });

    // Serve demo HTML page
    app.get("/demo", (req, res) =>
    {
        res.sendFile(path.join(__dirname, "..", "demo.html"));
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
            console.error("Webhook error:", e.message);
            res.status(500).json({ error: e.message });
        }
    });

    app.listen(port, () => {
        console.log(`\n✓ Server listening on http://localhost:${port}`);
        console.log(`  Webhook endpoint: http://localhost:${port}/vapi/webhook`);
        console.log(`\nReady to receive Vapi function calls!\n`);
    });

    process.on("SIGINT", () => shutdown(call_mediator));
    process.on("SIGTERM", () => shutdown(call_mediator));
};


main().catch((error: any) =>
{
    console.error("Failed to start server:", error.message);
    process.exit(1);
});