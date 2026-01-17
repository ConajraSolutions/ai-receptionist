// Conajra Solutions © 2026
// Author: Marwan

// test suite for the redis_client module

import { redis_client } from "../src/modules/redis_client";

const mock_redis = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    on: jest.fn(),
    isOpen: true
};

jest.mock("redis", () => ({
    createClient: jest.fn(() => mock_redis)
}));

import { createClient } from "redis";

describe("redis_client", () => {

    let client: redis_client;

    beforeEach(() => {
        jest.clearAllMocks();
        client = new redis_client("redis://localhost:6379");
    });

    describe("connect", () => {

        it("should create client and connect", async () => {
            await client.connect();
            expect(createClient).toHaveBeenCalledWith({ url: "redis://localhost:6379" });
        });

        it("should register error handler on connect", async () => {
            await client.connect();
            expect(mock_redis.on).toHaveBeenCalledWith("error", expect.any(Function));
        });

    });

    describe("disconnect", () => {

        it("should disconnect when connected", async () => {
            await client.connect();
            await client.disconnect();
            expect(mock_redis.disconnect).toHaveBeenCalled();
        });

        it("should do nothing when not connected", async () => {
            await client.disconnect();
            expect(mock_redis.disconnect).not.toHaveBeenCalled();
        });

    });

    describe("get", () => {

        it("should return value when key exists", async () => {
            mock_redis.get.mockResolvedValue("test_value");
            await client.connect();

            const result = await client.get("test_key");
            expect(result).toBe("test_value");
            expect(mock_redis.get).toHaveBeenCalledWith("test_key");
        });

        it("should return null when key does not exist", async () => {
            mock_redis.get.mockResolvedValue(null);
            await client.connect();

            const result = await client.get("missing_key");
            expect(result).toBeNull();
        });

        it("should throw when not connected", async () => {
            await expect(client.get("key")).rejects.toThrow("Redis client not connected");
        });

        it("should retry on recoverable error then succeed", async () => {
            const error = new Error("timeout");
            (error as any).code = "ETIMEDOUT";

            mock_redis.get
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce("value");

            await client.connect();
            const result = await client.get("key");

            expect(result).toBe("value");
            expect(mock_redis.get).toHaveBeenCalledTimes(2);
        });

        it("should throw after max retries on recoverable error", async () => {
            const error = new Error("timeout");
            (error as any).code = "ETIMEDOUT";

            mock_redis.get.mockRejectedValue(error);

            client = new redis_client("redis://localhost:6379", 2, 10);
            await client.connect();

            await expect(client.get("key")).rejects.toThrow("timeout");
            expect(mock_redis.get).toHaveBeenCalledTimes(2);
        });

        it("should not retry on non-recoverable error", async () => {
            const error = new Error("WRONGTYPE");
            (error as any).name = "ReplyError";

            mock_redis.get.mockRejectedValue(error);

            await client.connect();
            await expect(client.get("key")).rejects.toThrow("WRONGTYPE");
            expect(mock_redis.get).toHaveBeenCalledTimes(1);
        });

    });

    describe("set", () => {

        it("should set value without TTL", async () => {
            await client.connect();
            await client.set("key", "value");

            expect(mock_redis.set).toHaveBeenCalledWith("key", "value");
        });

        it("should set value with TTL", async () => {
            await client.connect();
            await client.set("key", "value", 60);

            expect(mock_redis.setEx).toHaveBeenCalledWith("key", 60, "value");
        });

        it("should throw when not connected", async () => {
            await expect(client.set("key", "value")).rejects.toThrow("Redis client not connected");
        });

    });

    describe("delete", () => {

        it("should delete key", async () => {
            await client.connect();
            await client.delete("key");

            expect(mock_redis.del).toHaveBeenCalledWith("key");
        });

        it("should throw when not connected", async () => {
            await expect(client.delete("key")).rejects.toThrow("Redis client not connected");
        });

    });

    describe("exists", () => {

        it("should return true when key exists", async () => {
            mock_redis.exists.mockResolvedValue(1);
            await client.connect();

            const result = await client.exists("key");
            expect(result).toBe(true);
        });

        it("should return false when key does not exist", async () => {
            mock_redis.exists.mockResolvedValue(0);
            await client.connect();

            const result = await client.exists("key");
            expect(result).toBe(false);
        });

        it("should throw when not connected", async () => {
            await expect(client.exists("key")).rejects.toThrow("Redis client not connected");
        });

    });

    describe("is_connected", () => {

        it("should return false before connecting", () => {
            expect(client.is_connected()).toBe(false);
        });

        it("should return true when connected", async () => {
            await client.connect();
            expect(client.is_connected()).toBe(true);
        });

    });

    describe("set_error_handler", () => {

        it("should set custom error handler", async () => {
            const custom_handler = jest.fn();
            client.set_error_handler(custom_handler);

            await client.connect();

            const registered_handler = mock_redis.on.mock.calls[0][1];
            const test_error = new Error("test");
            registered_handler(test_error);

            expect(custom_handler).toHaveBeenCalledWith(test_error);
        });

    });

});
