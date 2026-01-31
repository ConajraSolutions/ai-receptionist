// Conajra Solutions © 2026 
// Author: Marwan
//
// configuration driven vapi agent management. pulls Vapi configuration from
// storage using tenant_id and creates/configures assistants dynamically

import { VapiClient } from "@vapi-ai/server-sdk";
import { mediator } from "./mediator";
import { vapi_cfg, vapi_assistant_response } from "../types/vapi_config";

export class vapi_agent
{
    private m_id: string | null = null;
    private m_mediator: mediator;
    private m_tenant_id: string;
    private m_vapi_client: VapiClient;

    constructor(mediator: mediator, tenant_id: string, vapi_api_key: string)
    {
        this.m_mediator = mediator;
        this.m_tenant_id = tenant_id;
        this.m_vapi_client = new VapiClient({ token: vapi_api_key });
    }

    async create(): Promise<void>
    {
        console.log(`[vapi_agent] Loading config for tenant: ${this.m_tenant_id}`);

        const tenant_config = await this.m_mediator.get_tenant_config(this.m_tenant_id);
        if (!tenant_config)
            throw new Error(`Tenant ${this.m_tenant_id} not found in storage`);

        console.log(`[vapi_agent] Tenant config loaded:`, {
            tenant_id: tenant_config.tenant_id,
            name: tenant_config.name,
            has_vapi_cfg: !!tenant_config.vapi_cfg,
            vapi_assistant_id: tenant_config.vapi_assistant_id
        });

        const vapi_config = tenant_config.vapi_cfg;
        if (!vapi_config)
            throw new Error(`No Vapi assistant configuration found for tenant ${this.m_tenant_id}`);

        console.log(`[vapi_agent] Vapi config:`, {
            name: vapi_config.name,
            firstMessage: vapi_config.firstMessage,
            model: vapi_config.model?.model,
            voice: vapi_config.voice?.voiceId
        });

        // check if assistant already exists
        if (tenant_config.vapi_assistant_id)
        {
            console.log(`Using existing assistant: ${tenant_config.vapi_assistant_id}`);
            this.m_id = tenant_config.vapi_assistant_id;
            return;
        }

        console.log(`[vapi_agent] Creating new Vapi assistant with config...`);

        // we throw vapi our config struct and catch it's response in our own struct `vapi_assistant_response`
        const assistant = await this.m_vapi_client.assistants.create(vapi_config as any) as vapi_assistant_response;

        this.m_id = assistant.id;

        console.log(`Created Vapi assistant: ${assistant.id} for tenant ${this.m_tenant_id}`);

        // TODO: Optionally persist assistant_id back to tenant config in database
        // This would allow reusing the same assistant on subsequent runs
    }

    get_id(): string | null { return this.m_id; }
}
