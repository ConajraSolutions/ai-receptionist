// Conajra Solutions © 2026
// Author: Marwan

// tenant configuration cache using redis.
// stores and retrieves tenant configs from cache only.
// caller is responsible for loading from db on cache miss.

import { redis_client } from "./redis_client";
import { tenant_config } from "../types/tenant_type";

export class config_cache {

    private m_cache: redis_client;
    private m_ttl: number;
    private m_on_error: (error: Error) => void;
    
    private static readonly k_default_ttl = 3600; // 1 hour

    constructor(cache: redis_client, ttl?: number)
    {
        this.m_cache = cache;
        this.m_on_error = (error: Error) => console.error("Config cache error:", error);

        this.m_ttl = ttl ?? config_cache.k_default_ttl;
        if (ttl !== undefined && ttl <= 0) 
        {
            console.warn("Config cache TTL must be positive and non-zero. Using default TTL of", config_cache.k_default_ttl);
            this.m_ttl = config_cache.k_default_ttl;
        }
    }

    set_error_handler(handler: (error: Error) => void): void
    {
        this.m_on_error = handler;
    }

    private build_key(tenant_id: string): string
    {
        return `config:${tenant_id}`;
    }

    async get(tenant_id: string): Promise<tenant_config | null>
    {
        try {
            const key = this.build_key(tenant_id);
            const cached = await this.m_cache.get(key);

            if (cached)
                return JSON.parse(cached) as tenant_config;
            return null;
        }
        catch (error: any) {
            this.m_on_error(error);
            return null;
        }
    }

    async set(config: tenant_config): Promise<void>
    {
        try {
            const key = this.build_key(config.tenant_id);
            await this.m_cache.set(key, JSON.stringify(config), this.m_ttl);
        }
        catch (error: any) {
            this.m_on_error(error);
        }
    }

    async invalidate(tenant_id: string): Promise<void>
    {
        try {
            const key = this.build_key(tenant_id);
            await this.m_cache.delete(key);
        }
        catch (error: any) {
            this.m_on_error(error);
        }
    }

    async exists(tenant_id: string): Promise<boolean>
    {
        try {
            const key = this.build_key(tenant_id);
            return this.m_cache.exists(key);
        }
        catch (error: any) {
            this.m_on_error(error);
            return false;
        }
    }

}
