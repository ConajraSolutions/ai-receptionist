// Conajra Solutions © 2026
// Author: Marwan

// The call mediator is responsible for routing calls to the appropriate services.
// It restricts direct communications between services and forces them
// to collaborate only through a mediator object.

// read more on the mediator pattern here: https://refactoring.guru/design-patterns/mediator 

import { vapi_function_call } from "../types/vapi.js";
import { scheduler } from "./scheduler";

export class mediator {

    private sched: scheduler;

    constructor()
    {
        this.sched = new scheduler();
    }
    
    // as vapi is handling the call, it will trigger services through the
    // mediator by sending messages to the server's webhook endpoint.
    async handle_webhook(request: vapi_function_call): Promise<any> 
    {
        switch (request.function_name)
        {
            case "book_appointment":
                return await this.sched.book_appointment();
            
            case "check_availability":
                return await this.sched.check_availability();
            
            // later problem
            // case "flag_for_human":
            //     return true // this would route to the human escalation service
            
            default:
                throw new Error(`Unknown function name: ${request.function_name}`);
        }
    }
} // export 