// Conajra Solutions © 2026
// Author: Marwan

// test suite for the db module

import * as fs from "fs/promises";
import * as path from "path";
import { db } from "../src/modules/database";

describe("db", () => {

    const test_dir = path.join(__dirname, ".test_data");
    let store: db;

    beforeAll(async () => {
        await fs.mkdir(test_dir, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(test_dir, { recursive: true, force: true });
    });

    beforeEach(() => {
        store = new db(test_dir);
    });

    afterEach(async () => {
        const files = await fs.readdir(test_dir);
        for (const file of files) {
            await fs.unlink(path.join(test_dir, file));
        }
    });

    describe("write", () => {

        it("should write data to a JSON file", async () => {
            const data = { name: "test", value: 123 };
            await store.write("test", data);

            const content = await fs.readFile(path.join(test_dir, "test.json"), "utf-8");
            expect(JSON.parse(content)).toEqual(data);
        });

        it("should overwrite existing file", async () => {
            await store.write("test", { old: true });
            await store.write("test", { new: true });

            const content = await fs.readFile(path.join(test_dir, "test.json"), "utf-8");
            expect(JSON.parse(content)).toEqual({ new: true });
        });

    });

    describe("read", () => {

        it("should read and parse JSON file", async () => {
            const data = { name: "test", value: 456 };
            await fs.writeFile(path.join(test_dir, "read.json"), JSON.stringify(data));

            const result = await store.read<typeof data>("read");
            expect(result).toEqual(data);
        });

        it("should return null when file does not exist", async () => {
            const result = await store.read("nonexistent");
            expect(result).toBeNull();
        });

        it("should return null when file contains invalid JSON", async () => {
            await fs.writeFile(path.join(test_dir, "invalid.json"), "not valid json {{{");

            const result = await store.read("invalid");
            expect(result).toBeNull();
        });

    });

    describe("exists", () => {

        it("should return true when file exists", async () => {
            await fs.writeFile(path.join(test_dir, "exists.json"), "{}");

            const result = await store.exists("exists");
            expect(result).toBe(true);
        });

        it("should return false when file does not exist", async () => {
            const result = await store.exists("missing");
            expect(result).toBe(false);
        });

    });

    describe("delete", () => {

        it("should delete existing file", async () => {
            await fs.writeFile(path.join(test_dir, "delete.json"), "{}");

            await store.delete("delete");

            const exists = await fs.access(path.join(test_dir, "delete.json"))
                .then(() => true)
                .catch(() => false);
            expect(exists).toBe(false);
        });

        it("should throw when file does not exist", async () => {
            await expect(store.delete("nonexistent")).rejects.toThrow();
        });

    });

});
