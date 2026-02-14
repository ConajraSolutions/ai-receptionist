// Conajra Solutions © 2026
// Author: Marwan

// The call mediator is responsible for routing calls to the appropriate services.
// It restricts direct communications between services and forces them
// to collaborate only through a mediator object.

// read more on the mediator pattern here: https://refactoring.guru/design-patterns/mediator

import { vapi_webhook_payload, vapi_function_name } from "../types/vapi_hook_type";
import { storage, storage_configs } from "./storage";
import { scheduler } from "./scheduler";

export class mediator {

    private m_storage: storage;
    private m_scheduler: scheduler;
    private m_tenant_id: string;

    constructor(storage_configs: storage_configs, tenant_id: string)
    {
        this.m_storage = new storage(storage_configs);
        this.m_tenant_id = tenant_id;
        this.m_scheduler = new scheduler(this.m_storage, tenant_id);
    }

    async connect(): Promise<void>
    {
        await this.m_storage.connect();
    }

    async disconnect(): Promise<void>
    {
        await this.m_storage.disconnect();
    }

    // Extract function name and parameters from Vapi webhook payload
    // Handles both new webhook structure (message.toolCalls) and legacy structure
    private parse_webhook(request: any): { function_name: vapi_function_name; parameters: unknown }
    {
        // New webhook structure: message.toolCalls array
        if (request.message?.toolCalls && Array.isArray(request.message.toolCalls))
        {
            const tool_call = request.message.toolCalls[0];
            if (!tool_call?.function)
                throw new Error("Invalid webhook: toolCalls[0].function is missing");

            return {
                function_name: tool_call.function.name,
                parameters: tool_call.function.arguments
            };
        }

        // Legacy webhook structure: direct function_name and parameters
        if (request.function_name && request.parameters !== undefined)
        {
            return {
                function_name: request.function_name,
                parameters: request.parameters
            };
        }

        throw new Error("Invalid webhook payload: missing function call data");
    }

    // as vapi is handling the call, it will trigger services through the
    // mediator by sending messages to the server's webhook endpoint.
    async handle_webhook(request: vapi_webhook_payload): Promise<any>
    {
        const { function_name, parameters } = this.parse_webhook(request);

        let result: any;
        switch (function_name)
        {
            case "book_appointment":
                result = await this.m_scheduler.book_appointment(parameters as any);
                break;
                
            case "check_availability":
                result = await this.m_scheduler.check_availability(parameters as any);
                break;
                
            // later problem
            // case "flag_for_human":
            //     result = true // this would route to the human escalation service
            //     break;
                
            default:
                throw new Error(`Unknown function name: ${function_name}`);
        }
                    
        // Extract toolCallId for Vapi response format
        let tool_call_id: string | undefined;
        if ((request as any).message?.toolCalls?.[0]?.id)
            tool_call_id = (request as any).message.toolCalls[0].id;
            
        // Format response according to Vapi's expected structure
        // https://docs.vapi.ai/tools/custom-tools#server-response-format-providing-results-and-context
        if (tool_call_id)
        {
            return {
                results: [
                    {
                        toolCallId: tool_call_id,
                        result: result
                    }
                ]
            };
        }

        // Legacy format fallback (if no toolCallId)
        return result;
    }

    // Agent configuration retrieval
    // Provides access to tenant configuration for agent initialization
    async get_tenant_config(tenant_id: string)
    {
        return await this.m_storage.get_tenant_config(tenant_id);
    }

}