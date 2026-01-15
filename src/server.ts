// Conajra Solutions © 2026
// Author: Marwan

// this is the main server that will 

import express from "express";
import "dotenv/config";

import { mediator } from "./modules/mediator";

const app = express();
app.use(express.json());
const call_mediator = new mediator();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is listening on http://localhost:${PORT}`);
})