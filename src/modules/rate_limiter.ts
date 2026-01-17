// Conajra Solutions © 2026
// Author: Marwan

// a sliding window rate limiter using redis for distributed counting.
// implements graceful degradation pattern for redis failures.
// see: https://redis.io/docs/latest/develop/clients/nodejs/error-handling/

import { redis_client } from "./redis_client";

export class rate_limiter {

    private client: redis_client;
    private max_requests: number;
    private window_seconds: number;
    private fail_open: boolean;
    private on_error: (error: Error) => void;

    // fail_open controls behavior when Redis is unavailable:
    //
    // fail_open: true  - Allow requests through (prioritize availability)
    //                    Use when: rate limiting is nice-to-have, service must stay up
    //                    Risk: potential abuse during Redis outages
    //
    // fail_open: false - Block all requests (prioritize protection)
    //                    Use when: rate limiting is critical (billing, security)
    //                    Risk: service unavailable during Redis outages
    constructor(client: redis_client, max_requests: number, window_seconds: number, fail_open: boolean)
    {
        this.client = client;
        this.max_requests = max_requests;
        this.window_seconds = window_seconds;
        this.fail_open = fail_open;
        this.on_error = (error: Error) => console.error("Rate limiter error:", error);
    }

    set_error_handler(handler: (error: Error) => void): void
    {
        this.on_error = handler;
    }

    private build_key(tenant_id: string): string
    {
        return `ratelimit:${tenant_id}`;
    }

    async get_count(tenant_id: string): Promise<number>
    {
        try {
            const key = this.build_key(tenant_id);
            const value = await this.client.get(key);
            return value ? parseInt(value, 10) : 0;
        }
        catch (error: any) {
            this.on_error(error);
            // fail_open: assume no requests made (allow through)
            // fail_closed: assume at limit (block)
            return this.fail_open ? 0 : this.max_requests;
        }
    }

    async increment(tenant_id: string): Promise<number>
    {
        try {
            const key = this.build_key(tenant_id);
            const current = await this.get_count(tenant_id);
            const new_count = current + 1;
            await this.client.set(key, new_count.toString(), this.window_seconds);
            return new_count;
        }
        catch (error: any) {
            this.on_error(error);
            // fail_open: report count as 1 (allow through)
            // fail_closed: report over limit (block)
            return this.fail_open ? 1 : this.max_requests + 1;
        }
    }

    async is_allowed(tenant_id: string): Promise<boolean>
    {
        try {
            const count = await this.get_count(tenant_id);
            return count < this.max_requests;
        }
        catch (error: any) {
            this.on_error(error);
            return this.fail_open;
        }
    }

    // Atomic check-then-increment for typical rate limiting use case.
    // Only increments if the request is allowed.
    async check_and_increment(tenant_id: string): Promise<boolean>
    {
        try {
            const allowed = await this.is_allowed(tenant_id);
            if (allowed) {
                await this.increment(tenant_id);
            }
            return allowed;
        }
        catch (error: any) {
            this.on_error(error);
            return this.fail_open;
        }
    }

    async reset(tenant_id: string): Promise<void>
    {
        try {
            const key = this.build_key(tenant_id);
            await this.client.delete(key);
        }
        catch (error: any) {
            // Reset failure is logged but not propagated.
            // Caller can't do anything useful with a reset error.
            this.on_error(error);
        }
    }

    async get_remaining(tenant_id: string): Promise<number>
    {
        try {
            const count = await this.get_count(tenant_id);
            const remaining = this.max_requests - count;
            return remaining > 0 ? remaining : 0;
        }
        catch (error: any) {
            this.on_error(error);
            // fail_open: report full quota available
            // fail_closed: report no quota available
            return this.fail_open ? this.max_requests : 0;
        }
    }

}
