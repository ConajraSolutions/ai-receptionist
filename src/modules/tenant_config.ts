// Conajra Solutions © 2026
// Author: Marwan

// this is a structured format for sotring tenant configs usinf the db module

import { db } from "./database";
import { tenant_config } from "../types/tenant_type";

export class tenant_config_store {

    private store: db;

    constructor(base_path: string) { this.store = new db(base_path); }

    private get_file_name(tenant_id: string): string 
    {
        return `${tenant_id}.json`;
    }

    async get(tenant_id: string): Promise<tenant_config | null> 
    {
        return this.store.read<tenant_config>(this.get_file_name(tenant_id));
    }

    async save(config: tenant_config): Promise<void> 
    {
        await this.store.write(this.get_file_name(config.tenant_id), config);
    }

    async exists(tenant_id: string): Promise<boolean> 
    {
        return this.store.exists(this.get_file_name(tenant_id));
    }

    async remove(tenant_id: string): Promise<void> 
    {
        await this.store.delete(this.get_file_name(tenant_id));
    }
}
