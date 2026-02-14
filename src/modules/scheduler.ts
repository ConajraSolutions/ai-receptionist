// Conajra Solutions © 2026
// Author: Marwan
//
// Scheduler service handles appointment booking and availability checks.
// This is a multi-tenant service that adapts to each tenant's specific needs
// by pulling configuration from storage rather than hardcoding business logic.

import { storage } from "./storage";

// Generic parameter types - each tenant defines their own schema
type scheduling_params = Record<string, unknown>;

// Tool schema extracted from tenant configuration
interface tool_schema {
    name: string;
    description?: string;
    parameters?: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
    };
}

// Validation result
interface validation_result {
    valid: boolean;
    error_message?: string;
}

export class scheduler {

    private m_storage: storage;
    private m_tenant_id: string;

    constructor(storage: storage, tenant_id: string)
    {
        this.m_storage = storage;
        this.m_tenant_id = tenant_id;
    }

    // Get tool schema from tenant configuration (uses storage caching)
    private async get_tool_schema(function_name: string): Promise<tool_schema | null>
    {
        const tenant_config = await this.m_storage.get_tenant_config(this.m_tenant_id);

        if (!tenant_config?.vapi_cfg?.model?.tools)
            return null;

        const tools = tenant_config.vapi_cfg.model.tools as any[];
        const tool = tools.find(t => t.type === "function" && t.function?.name === function_name);

        if (!tool?.function)
            return null;

        return {
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
        };
    }

    // Validate parameters against the tenant's tool schema
    private async validate_params(function_name: string, params: scheduling_params): Promise<validation_result>
    {
        const schema = await this.get_tool_schema(function_name);

        if (!schema)
            return { valid: false, error_message: `Function not configured.` };

        // Check all required parameters are present
        const required = schema.parameters?.required || [];
        const missing = required.filter(field => !(field in params));

        if (missing.length > 0)
            return { valid: false, error_message: `Missing required: ${missing.join(', ')}` };

        // Validate service_type enum if it exists
        const service_type_schema = schema.parameters?.properties?.service_type;
        if (service_type_schema?.enum && params.service_type)
        {
            const allowed = service_type_schema.enum as string[];
            if (!allowed.includes(params.service_type as string))
            {
                return {
                    valid: false,
                    error_message: `We don't offer ${params.service_type}. Available options: ${allowed.join(', ')}.`
                };
            }
        }

        return { valid: true };
    }

    // Books an appointment with tenant-specific parameters
    // Parameters are defined in each tenant's Vapi configuration
    // e.g., Papa John's uses: customer_name, phone_number, time_slot, service_type (delivery|pickup)
    // e.g., Healthcare might use: patient_name, phone_number, appointment_time, appointment_type (in-person|telehealth)
    async book_appointment(params: scheduling_params): Promise<string>
    {
        console.log("[scheduler] book_appointment called with:", params);

        // Validate parameters against tenant's schema
        const validation = await this.validate_params("book_appointment", params);
        if (!validation.valid)
        {
            console.warn("[scheduler] Validation failed:", validation.error_message);
            return validation.error_message!;
        }

        // TODO: Hamza - Implement actual booking logic here
        // - Check calendar availability
        // - Create appointment in calendar system
        // - Store in database
        // - Send confirmation

        // Placeholder implementation for testing
        const appointment_id = `appt_${Date.now()}`;

        // Extract common fields (these will vary by tenant)
        const customer_name = params.customer_name || params.patient_name || "customer";
        const phone_number = params.phone_number || "provided number";
        const time_slot = params.time_slot || params.appointment_time || "requested time";
        const service_type = params.service_type || params.appointment_type || "appointment";

        // Return a conversational confirmation message
        return `Perfect! I've booked your ${service_type} for ${customer_name} at ${time_slot}. Your confirmation number is ${appointment_id}. We'll call ${phone_number} if there are any changes. Is there anything else I can help you with?`;
    }

    // Checks availability with tenant-specific parameters
    // Parameters are defined in each tenant's Vapi configuration
    // e.g., Papa John's uses: date, service_type (delivery|pickup)
    // e.g., Healthcare might use: date, appointment_type (in-person|telehealth), provider_id
    async check_availability(params: scheduling_params): Promise<string>
    {
        console.log("[scheduler] check_availability called with:", params);

        // Validate parameters against tenant's schema
        // is this needed or is the ai smart enough?
        const validation = await this.validate_params("check_availability", params);
        if (!validation.valid)
        {
            console.warn("[scheduler] Validation failed:", validation.error_message);
            return validation.error_message!;
        }

        // TODO: Hamza - Implement actual availability checking here
        // - Query calendar system for available slots
        // - Filter by service/appointment type
        // - Return formatted availability

        // Placeholder implementation for testing
        const requested_date = (params.date || params.appointment_date || new Date().toISOString().split('T')[0]) as string;
        const service_type = (params.service_type || params.appointment_type || "appointment") as string;

        // Generate mock time slots
        const time_slots_readable = [
            "10:00 AM",
            "12:00 PM",
            "2:00 PM",
            "4:00 PM",
            "6:00 PM"
        ];

        // Format date nicely (e.g., "February 14th")
        // Parse YYYY-MM-DD format explicitly to avoid timezone issues
        const [year, month_num, day_num] = requested_date.split('-').map(Number);
        const date_obj = new Date(year, month_num - 1, day_num); // month is 0-indexed
        const month = date_obj.toLocaleDateString('en-US', { month: 'long' });
        const day = date_obj.getDate();
        const day_suffix = this.get_day_suffix(day);
        const formatted_date = `${month} ${day}${day_suffix}`;

        // Return a conversational message
        return `We have ${time_slots_readable.length} available times for ${service_type} on ${formatted_date}: ${time_slots_readable.join(', ')}. Which time works best for you?`;
    }

    // Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
    private get_day_suffix(day: number): string
    {
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

} 