// Conajra Solutions © 2026
// Author: Marwan
//
// Startup validation checks to ensure the system is properly configured
// before attempting to start the server. Provides clear error messages
// with actionable fixes to help developers quickly resolve issues.

import * as net from "net";
import { createClient } from "redis";

interface check_result {
    passed: boolean;
    message: string;
    fix?: string;
}

export class startup_checks {

    private checks_passed: boolean = true;

    // Check if Node.js version meets minimum requirements
    async check_node_version(): Promise<check_result>
    {
        const current_version = process.version;
        const major_version = parseInt(current_version.split('.')[0].substring(1));
        const min_version = 18;

        if (major_version >= min_version)
        {
            return {
                passed: true,
                message: `✓ Node.js version ${current_version} meets minimum requirement (>= ${min_version}.0.0)`
            };
        }

        return {
            passed: false,
            message: `✗ Node.js version ${current_version} is below minimum requirement`,
            fix: `Please upgrade to Node.js ${min_version}.0.0 or higher. Use nvm: 'nvm install ${min_version} && nvm use ${min_version}'`
        };
    }

    // Test Redis connectivity
    async check_redis_connectivity(): Promise<check_result>
    {
        const redis_url = process.env.REDIS_URL;
        if (!redis_url)
        {
            return {
                passed: false,
                message: "✗ REDIS_URL not set",
                fix: "Set REDIS_URL in .env file"
            };
        }

        let client;
        try
        {
            client = createClient({ url: redis_url });
            await client.connect();
            await client.ping();
            await client.disconnect();

            return {
                passed: true,
                message: `✓ Redis connection successful (${redis_url.split('@')[1] || 'localhost'})`
            };
        }
        catch (error: any)
        {
            if (client)
            {
                try { await client.disconnect(); } catch {}
            }

            return {
                passed: false,
                message: `✗ Redis connection failed: ${error.message}`,
                fix: "Check REDIS_URL is correct and Redis server is running. For local dev: 'docker run -d -p 6379:6379 redis:7-alpine'"
            };
        }
    }

    // Check if the specified port is available
    async check_port_availability(): Promise<check_result>
    {
        const port_str = process.env.PORT || "3000";
        const port = parseInt(port_str);

        if (isNaN(port) || port < 1 || port > 65535)
        {
            return {
                passed: false,
                message: `✗ Invalid port number: ${port_str}`,
                fix: "Set PORT to a valid number between 1-65535 in .env file"
            };
        }

        return new Promise((resolve) => {
            const server = net.createServer();

            server.once("error", (error: any) => {
                if (error.code === "EADDRINUSE")
                {
                    resolve({
                        passed: false,
                        message: `✗ Port ${port} is already in use`,
                        fix: `Stop the process using port ${port} or change PORT in .env file. Find process: 'lsof -i :${port}' (Unix) or 'netstat -ano | findstr :${port}' (Windows)`
                    });
                }
                else
                {
                    resolve({
                        passed: false,
                        message: `✗ Port check failed: ${error.message}`,
                        fix: "Check system permissions or firewall settings"
                    });
                }
            });

            server.once("listening", () => {
                server.close();
                resolve({
                    passed: true,
                    message: `✓ Port ${port} is available`
                });
            });

            server.listen(port);
        });
    }

    // Run all checks and return summary
    async run_all(): Promise<boolean>
    {
        console.log("\n🔍 Running startup health checks...\n");

        const checks = [
            { name: "Node Version", fn: () => this.check_node_version() },
            { name: "Redis Connectivity", fn: () => this.check_redis_connectivity() },
            { name: "Port Availability", fn: () => this.check_port_availability() }
        ];

        let all_passed = true;

        for (const check of checks)
        {
            try
            {
                const result = await check.fn();
                console.log(result.message);
                if (result.fix)
                    console.log(`  💡 Fix: ${result.fix}`);

                if (!result.passed)
                    all_passed = false;

                console.log();
            }
            catch (error: any)
            {
                console.log(`✗ ${check.name} check crashed: ${error.message}\n`);
                all_passed = false;
            }
        }

        if (all_passed)
            console.log("✅ All health checks passed! Starting server...\n");
        else
            console.log("❌ Some health checks failed. Please fix the issues above before starting.\n");

        return all_passed;
    }

}
