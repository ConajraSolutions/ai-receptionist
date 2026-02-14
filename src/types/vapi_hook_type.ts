// Conajra Solutions © 2026
// Author: Marwan

// this is like a .h in C

// this will grow. each function will need it's own interface
export type vapi_function_name =
  | "book_appointment"
  | "check_availability"
  | "flag_for_human";

// Structure of a single tool call from Vapi
export interface vapi_tool_call
{
  id: string;
  type: "function";
  function: {
    name: vapi_function_name;
    arguments: unknown;
  };
  isPrecededByText?: boolean;
}

// Vapi webhook message structure for tool-calls events
export interface vapi_webhook_message
{
  type: "tool-calls";
  timestamp: number;
  toolCalls: vapi_tool_call[];
  toolCallList: vapi_tool_call[];
  [key: string]: unknown;
}

// Full Vapi webhook payload
export interface vapi_webhook_payload
{
  message: vapi_webhook_message;
  call?: unknown;
  assistant?: unknown;
  [key: string]: unknown;
}