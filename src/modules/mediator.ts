// Conajra Solutions © 2026
// Author: Marwan

// The call mediator is responsible for routing calls to the appropriate services.
// It restricts direct communications between services and forces them
// to collaborate only through a mediator object.

// read more on the mediator pattern here: https://refactoring.guru/design-patterns/mediator

import { vapi_function_call } from "../types/vapi";
import { storage, storage_options } from "./storage";
import { scheduler } from "./scheduler";

export class mediator {

    private m_storage: storage;
    private m_scheduler: scheduler;

    constructor(storage_options: storage_options)
    {
        this.m_storage = new storage(storage_options);
        this.m_scheduler = new scheduler(this.m_storage);
    }

    async connect(): Promise<void>
    {
        await this.m_storage.connect();
    }

    async disconnect(): Promise<void>
    {
        await this.m_storage.disconnect();
    }

    // as vapi is handling the call, it will trigger services through the
    // mediator by sending messages to the server's webhook endpoint.
    async handle_webhook(request: vapi_function_call): Promise<any>
    {
        switch (request.function_name)
        {
            case "book_appointment":
                return await this.m_scheduler.book_appointment();

            case "check_availability":
                return await this.m_scheduler.check_availability();

            // later problem
            // case "flag_for_human":
            //     return true // this would route to the human escalation service

            default:
                throw new Error(`Unknown function name: ${request.function_name}`);
        }
    }

    // Agent configuration retrieval
    // Provides access to tenant configuration for agent initialization
    async get_tenant_config(tenant_id: string)
    {
        return await this.m_storage.get_tenant_config(tenant_id);
    }

}
