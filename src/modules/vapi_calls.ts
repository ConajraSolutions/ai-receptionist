import { VapiClient } from "@vapi-ai/server-sdk";

async function main() {
  const vapi = new VapiClient({ token: process.env.VAPI_API_KEY! });

  await vapi.calls.create({
    transport: { type: "web" },
    assistantId: process.env.VAPI_ASSISTANT_ID!,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
