// Conajra Solutions © 2026
// Author: Marwan

// Redis client wrapper with automatic retry and error handling.

import { createClient, RedisClientType } from "redis";

// when we are dealing with the redis client, we need to handle errors
// gracefully since it is networked and can have simple transient errors that
// are recoverable. recoverable errors imply that the Redis server itself is
// fine, the problem is in the network path between client and server. these are
// recoverable because the server is intentionally rejecting commands
// temporarily while it completes background work.
// ofcourse there are also non-recoverable errors.

// ECONNREFUSED: server not accepting connections (may be starting up or restarting)
// ETIMEDOUT:    network timeout (temporary network congestion or latency spike)
// ECONNRESET:   connection dropped mid-request (network blip or server restart)
// EAI_AGAIN:    DNS lookup failed temporarily (DNS server overloaded)
const RECOVERABLE_ERRORS = ["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "EAI_AGAIN"];

// BUSY:      server running a blocking script (Lua script or module command)
// TRYAGAIN:  cluster slot migration in progress (retry will hit correct node)
// LOADING:   server loading dataset from disk after restart
const RETRYABLE_REPLY_ERRORS = ["BUSY", "TRYAGAIN", "LOADING"];


export class redis_client {

    private m_client: RedisClientType | null = null;
    private m_url: string;
    private m_max_retries: number;
    private m_base_delay_ms: number;
    private m_on_error: (error: Error) => void;

    constructor(url: string, max_retries: number = 3, base_delay_ms: number = 100)
    {
        this.m_url = url;
        this.m_max_retries = max_retries;
        this.m_base_delay_ms = base_delay_ms;
        this.m_on_error = (error: Error) => console.error("Redis client error:", error);
    }

    set_error_handler(handler: (error: Error) => void): void
    {
        this.m_on_error = handler;
    }

    private is_recoverable(error: any): boolean
    {
        if (RECOVERABLE_ERRORS.includes(error.code)) return true;

        // ReplyError is returned when Redis server responds with an error.
        // Only some server errors are worth retrying.
        if (error.name === "ReplyError") 
            return RETRYABLE_REPLY_ERRORS.some(code => error.message?.includes(code));

        return false;
    }

    private async doit<T>(operation: () => Promise<T>): Promise<T>
    {
        let delay = this.m_base_delay_ms;
        
        // when something isnt working, we shouldn't hammer the server with retries.
        // instead we back off exponentially to give it time to recover.
        for (let attempt = 0; attempt < this.m_max_retries; attempt++)
        {
            try { return await operation(); }
            catch (error: any)
            {
                const is_last_attempt = attempt === this.m_max_retries - 1;

                if (!this.is_recoverable(error) || is_last_attempt)
                    throw error;

                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }

        throw new Error("Max retries exceeded");
    }

    async connect(): Promise<void>
    {
        this.m_client = createClient({ url: this.m_url });

        // Node.js EventEmitter requires at least one error listener.
        // Without this, unhandled errors crash the process.
        // See: https://nodejs.org/api/events.html#events_error_events
        this.m_client.on("error", this.m_on_error);

        await this.m_client.connect();
    }

    async disconnect(): Promise<void>
    {
        if (this.m_client)
        {
            await this.m_client.disconnect();
            this.m_client = null;
        }
    }

    async get(key: string): Promise<string | null>
    {
        if (!this.m_client) 
            throw new Error("Redis client not connected");

        return this.doit(() => this.m_client!.get(key));
    }

    async set(key: string, value: string, ttl_seconds?: number): Promise<void>
    {
        if (!this.m_client) 
            throw new Error("Redis client not connected");

        await this.doit(async () => {
            if (ttl_seconds)
                await this.m_client!.setEx(key, ttl_seconds, value);
            else
                await this.m_client!.set(key, value);
        });
    }

    async delete(key: string): Promise<void>
    {
        if (!this.m_client) 
            throw new Error("Redis client not connected");

        await this.doit(() => this.m_client!.del(key));
    }

    async exists(key: string): Promise<boolean>
    {
        if (!this.m_client) 
            throw new Error("Redis client not connected");

        const result = await this.doit(() => this.m_client!.exists(key));
        return result === 1;
    }

    is_connected(): boolean
    {
        return this.m_client !== null && this.m_client.isOpen;
    }

}
