// Conajra Solutions © 2026
// Author: Marwan

// test suite for the rate_limiter module

import { rate_limiter } from "../src/modules/rate_limiter";
import { redis_client } from "../src/modules/redis_client";

jest.mock("../src/modules/redis_client");

describe("rate_limiter", () => {

    let mock_client: jest.Mocked<redis_client>;
    let limiter: rate_limiter;

    const MAX_REQUESTS = 5;
    const WINDOW_SECONDS = 60;

    beforeEach(() => {
        mock_client = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
            is_connected: jest.fn(),
            set_error_handler: jest.fn()
        } as unknown as jest.Mocked<redis_client>;

        limiter = new rate_limiter(mock_client, MAX_REQUESTS, WINDOW_SECONDS, true);
    });

    describe("get_count", () => {

        it("should return count when key exists", async () => {
            mock_client.get.mockResolvedValue("3");

            const result = await limiter.get_count("tenant_1");
            expect(result).toBe(3);
            expect(mock_client.get).toHaveBeenCalledWith("ratelimit:tenant_1");
        });

        it("should return 0 when key does not exist", async () => {
            mock_client.get.mockResolvedValue(null);

            const result = await limiter.get_count("tenant_1");
            expect(result).toBe(0);
        });

        it("should return 0 on error when fail_open is true", async () => {
            mock_client.get.mockRejectedValue(new Error("connection error"));

            const result = await limiter.get_count("tenant_1");
            expect(result).toBe(0);
        });

        it("should return max_requests on error when fail_open is false", async () => {
            limiter = new rate_limiter(mock_client, MAX_REQUESTS, WINDOW_SECONDS, false);
            mock_client.get.mockRejectedValue(new Error("connection error"));

            const result = await limiter.get_count("tenant_1");
            expect(result).toBe(MAX_REQUESTS);
        });

    });

    describe("increment", () => {

        it("should increment count from 0", async () => {
            mock_client.get.mockResolvedValue(null);

            const result = await limiter.increment("tenant_1");
            expect(result).toBe(1);
            expect(mock_client.set).toHaveBeenCalledWith("ratelimit:tenant_1", "1", WINDOW_SECONDS);
        });

        it("should increment existing count", async () => {
            mock_client.get.mockResolvedValue("3");

            const result = await limiter.increment("tenant_1");
            expect(result).toBe(4);
            expect(mock_client.set).toHaveBeenCalledWith("ratelimit:tenant_1", "4", WINDOW_SECONDS);
        });

    });

    describe("is_allowed", () => {

        it("should return true when under limit", async () => {
            mock_client.get.mockResolvedValue("2");

            const result = await limiter.is_allowed("tenant_1");
            expect(result).toBe(true);
        });

        it("should return false when at limit", async () => {
            mock_client.get.mockResolvedValue("5");

            const result = await limiter.is_allowed("tenant_1");
            expect(result).toBe(false);
        });

        it("should return false when over limit", async () => {
            mock_client.get.mockResolvedValue("10");

            const result = await limiter.is_allowed("tenant_1");
            expect(result).toBe(false);
        });

        it("should return true on error when fail_open is true", async () => {
            mock_client.get.mockRejectedValue(new Error("connection error"));

            const result = await limiter.is_allowed("tenant_1");
            expect(result).toBe(true);
        });

        it("should return false on error when fail_open is false", async () => {
            limiter = new rate_limiter(mock_client, MAX_REQUESTS, WINDOW_SECONDS, false);
            mock_client.get.mockRejectedValue(new Error("connection error"));

            const result = await limiter.is_allowed("tenant_1");
            expect(result).toBe(false);
        });

    });

    describe("check_and_increment", () => {

        it("should increment and return true when allowed", async () => {
            mock_client.get.mockResolvedValue("2");

            const result = await limiter.check_and_increment("tenant_1");
            expect(result).toBe(true);
            expect(mock_client.set).toHaveBeenCalled();
        });

        it("should not increment and return false when not allowed", async () => {
            mock_client.get.mockResolvedValue("5");

            const result = await limiter.check_and_increment("tenant_1");
            expect(result).toBe(false);
            expect(mock_client.set).not.toHaveBeenCalled();
        });

    });

    describe("reset", () => {

        it("should delete the rate limit key", async () => {
            await limiter.reset("tenant_1");

            expect(mock_client.delete).toHaveBeenCalledWith("ratelimit:tenant_1");
        });

        it("should not throw on error", async () => {
            mock_client.delete.mockRejectedValue(new Error("connection error"));

            await expect(limiter.reset("tenant_1")).resolves.not.toThrow();
        });

    });

    describe("get_remaining", () => {

        it("should return remaining requests", async () => {
            mock_client.get.mockResolvedValue("2");

            const result = await limiter.get_remaining("tenant_1");
            expect(result).toBe(3);
        });

        it("should return 0 when at limit", async () => {
            mock_client.get.mockResolvedValue("5");

            const result = await limiter.get_remaining("tenant_1");
            expect(result).toBe(0);
        });

        it("should return 0 when over limit", async () => {
            mock_client.get.mockResolvedValue("10");

            const result = await limiter.get_remaining("tenant_1");
            expect(result).toBe(0);
        });

        it("should return max_requests on error when fail_open is true", async () => {
            mock_client.get.mockRejectedValue(new Error("connection error"));

            const result = await limiter.get_remaining("tenant_1");
            expect(result).toBe(MAX_REQUESTS);
        });

        it("should return 0 on error when fail_open is false", async () => {
            limiter = new rate_limiter(mock_client, MAX_REQUESTS, WINDOW_SECONDS, false);
            mock_client.get.mockRejectedValue(new Error("connection error"));

            const result = await limiter.get_remaining("tenant_1");
            expect(result).toBe(0);
        });

    });

    describe("set_error_handler", () => {

        it("should call custom error handler on error", async () => {
            const error_handler = jest.fn();
            limiter.set_error_handler(error_handler);

            const error = new Error("connection error");
            mock_client.get.mockRejectedValue(error);

            await limiter.get_count("tenant_1");

            expect(error_handler).toHaveBeenCalledWith(error);
        });

    });

});
