import { VapiClient } from "@vapi-ai/server-sdk";

const vapi = new VapiClient({ token: process.env.VAPI_API_KEY! });

const systemPrompt = `You are an AI receptionist for a healthcare centre. Verify the customer, then offer booking, rescheduling, or cancellation. Use scheduling tools when needed. Keep replies under 30 words.`;

const assistant = await vapi.assistants.create({
  name: "Receptionist",
  firstMessage: "Welcome to Conajra's Healhtcare Centre! How can I help you today?",
  model: {
    provider: "openai",
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt }],
    // toolIds: [ "CHECK_AVAILABILITY_ID", "BOOK_ID", "RESCHEDULE_ID", "CANCEL_ID" ]
  }
});
