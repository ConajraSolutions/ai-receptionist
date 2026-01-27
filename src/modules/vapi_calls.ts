import { VapiClient } from "@vapi-ai/server-sdk";

const vapi = new VapiClient({ token: process.env.VAPI_API_KEY! });

await vapi.calls.create({
  transport: { type: "web" },
  assistant: { assistantId: "your-assistant-id" }
});
