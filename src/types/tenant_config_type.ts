// Conajra Solutions © 2026
// Author: Marwan

import { vapi_cfg } from "./vapi_config";

export interface tenant_config
{
    tenant_id: string;
    name: string;
    vapi_assistant_id?: string;  // Optional: may not exist yet if we're creating it
    vapi_cfg: vapi_cfg;  // Full Vapi assistant configuration
    calendar_credentials: object;
}