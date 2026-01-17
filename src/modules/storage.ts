// Conajra Solutions © 2026
// Author: Marwan

// unified storage module that coordinates db (persistent) and cache (temporary).
// provides a simple api for the data flow:
// 1. check cache → 2. cache miss → 3. load from db → 4. cache result

import { db } from "./database";
import { redis_client } from "./redis_client";
import { rate_limiter } from "./rate_limiter";
import { config_cache } from "./config_cache";
import { tenant_config } from "../types/tenant_config_type";

export interface storage_options {
    db_path: string;
    redis_url: string;
    rate_limit_max: number;
    rate_limit_window: number;
    rate_limit_fail_open: boolean;
    config_cache_ttl?: number;
}

export class storage {

    public readonly db: db;
    public readonly cache: {
        client: redis_client;
        config: config_cache;
        rate_limiter: rate_limiter;
    };

    constructor(options: storage_options)
    {
        // persistent storage
        this.db = new db(options.db_path);

        // cache layer
        const client = new redis_client(options.redis_url);
        this.cache = 
        {
            client: client,
            config: new config_cache(client, options.config_cache_ttl),
            rate_limiter: new rate_limiter(client, options.rate_limit_max, options.rate_limit_window,options.rate_limit_fail_open)
        };
    }

    async connect(): Promise<void>
    {
        await this.cache.client.connect();
    }

    async disconnect(): Promise<void>
    {
        await this.cache.client.disconnect();
    }

    // tenant storage
    async get_tenant_config(tenant_id: string): Promise<tenant_config | null>
    {
        // step 1: check cache
        const cached = await this.cache.config.get(tenant_id);
        if (cached) return cached;

        // step 2: cache miss, load from db
        const config = await this.db.read<tenant_config>(tenant_id);
        if (!config) return null;

        // step 3: cache the result
        await this.cache.config.set(config);

        return config;
    }

    async save_tenant_config(config: tenant_config): Promise<void>
    {
        await this.db.write(config.tenant_id, config);
        await this.cache.config.set(config);
    }

    async delete_tenant_config(tenant_id: string): Promise<void>
    {
        await this.cache.config.invalidate(tenant_id);
        await this.db.delete(tenant_id);
    }
}
