// Conajra Solutions © 2026
// Author: Marwan
//
// Cross-platform demo launcher for testing AI receptionist voice calls.
// TypeScript replacement for scripts/dodemo.sh - works on Windows, macOS, and Linux.
//
// Usage: npm run demo
//
// Setup for Testing with Vapi (ngrok required):
// 1. Run ngrok: `ngrok http 3000` (keep terminal open)
// 2. Copy the ngrok HTTPS URL (e.g., https://abc123.ngrok-free.app)
// 3. Update tenant config: Set both tool server.url to "{ngrok_url}/vapi/webhook"
// 4. Run demo: `npm run demo`
// 5. Test voice calls in browser - Vapi will now reach your local server
//
// What it does:
// 1. Validates .env file and required environment variables
// 2. Checks if port is available (using Node.js net module, no lsof needed)
// 3. Starts development server (npm run dev) if not already running
// 4. Waits for server readiness by polling /assistant-id endpoint
// 5. Opens browser automatically to http://localhost:3000/demo
// 6. Handles cleanup on Ctrl+C
//
// Dependencies: chalk (colors), open (browser), all cross-platform

import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as http from "http";
import * as net from "net";
import * as path from "path";
import chalk from "chalk";
import open from "open";
import * as dotenv from "dotenv";

class demo_launcher {

    private server_process: ChildProcess | null = null;
    private port: number;
    private demo_url: string;
    private pid_file: string;
    private max_wait_seconds: number = 30;

    constructor()
    {
        this.port = parseInt(process.env.PORT || "3000");
        this.demo_url = `http://localhost:${this.port}/demo`;
        this.pid_file = path.join(process.cwd(), ".demo.pid");
    }

    // Check if .env file exists
    private check_env_file(): boolean
    {
        const env_path = path.join(process.cwd(), ".env");

        if (!fs.existsSync(env_path))
        {
            console.log(chalk.red("❌ Error: .env file not found"));
            console.log("Please create .env file from .env.example:");
            console.log("  cp .env.example .env");
            console.log("Then configure your VAPI_API_KEY and VAPI_PUBLIC_KEY");
            return false;
        }

        // Load environment variables
        dotenv.config({ path: env_path });
        return true;
    }

    // Validate required environment variables
    private validate_env_vars(): boolean
    {
        // Set development mode (disables config caching for fresh configs)
        process.env.NODE_ENV = "development";

        const vapi_api_key = process.env.VAPI_API_KEY;
        const vapi_public_key = process.env.VAPI_PUBLIC_KEY;

        if (!vapi_api_key || !vapi_public_key)
        {
            console.log(chalk.red("❌ Error: Missing required environment variables"));
            console.log("Please set VAPI_API_KEY and VAPI_PUBLIC_KEY in .env file");
            return false;
        }

        return true;
    }

    // Check if a port is in use
    private async is_port_in_use(port: number): Promise<boolean>
    {
        return new Promise((resolve) => {
            const server = net.createServer();

            server.once("error", (err: any) => {
                if (err.code === "EADDRINUSE")
                    resolve(true);
                else
                    resolve(false);
            });

            server.once("listening", () => {
                server.close();
                resolve(false);
            });

            server.listen(port);
        });
    }

    // Check if server is ready by polling the /assistant-id endpoint
    private async wait_for_server(): Promise<boolean>
    {
        const check_url = `http://localhost:${this.port}/assistant-id`;
        let elapsed = 0;

        console.log(chalk.blue("⏳ Waiting for server to be ready..."));

        while (elapsed < this.max_wait_seconds)
        {
            try
            {
                await this.http_get(check_url);
                console.log(chalk.green("✓ Server is ready!"));
                return true;
            }
            catch (error)
            {
                // Server not ready yet, keep waiting
                await this.sleep(1000);
                elapsed++;

                // Show progress every 5 seconds
                if (elapsed % 5 === 0)
                {
                    console.log(chalk.blue(`  Still waiting... (${elapsed}s)`));
                }
            }
        }

        console.log(chalk.red(`❌ Server failed to start within ${this.max_wait_seconds} seconds`));
        return false;
    }

    // Simple HTTP GET request
    private http_get(url: string): Promise<void>
    {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                if (res.statusCode === 200)
                    resolve();
                else
                    reject(new Error(`HTTP ${res.statusCode}`));
            }).on("error", reject);
        });
    }

    // Sleep utility
    private sleep(ms: number): Promise<void>
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Start the development server
    private async start_server(): Promise<boolean>
    {
        console.log(chalk.green("📦 Starting development server..."));

        // Determine npm command (npm on Unix, npm.cmd on Windows)
        const npm_command = process.platform === "win32" ? "npm.cmd" : "npm";

        // Start npm run dev in background
        this.server_process = spawn(npm_command, ["run", "dev"], {
            stdio: "inherit",
            shell: true,
            env: { ...process.env, NODE_ENV: "development" }
        });

        // Store PID for cleanup
        if (this.server_process.pid)
        {
            fs.writeFileSync(this.pid_file, this.server_process.pid.toString());
        }

        // Set up cleanup on exit
        process.on("SIGINT", () => this.cleanup());
        process.on("SIGTERM", () => this.cleanup());
        process.on("exit", () => this.cleanup());

        // Wait for server to be ready
        const ready = await this.wait_for_server();

        if (!ready)
        {
            this.cleanup();
            return false;
        }

        return true;
    }

    // Open browser based on platform
    private async open_browser(): Promise<void>
    {
        console.log(chalk.blue(`Opening browser to: ${this.demo_url}`));

        try
        {
            await open(this.demo_url);
        }
        catch (error: any)
        {
            console.log(chalk.yellow("⚠️  Could not auto-open browser"));
            console.log(`Please open manually: ${this.demo_url}`);
        }
    }

    // Cleanup on exit
    private cleanup(): void
    {
        console.log(chalk.yellow("\n🛑 Shutting down server..."));

        if (this.server_process)
        {
            this.server_process.kill("SIGTERM");
            this.server_process = null;
        }

        if (fs.existsSync(this.pid_file))
        {
            fs.unlinkSync(this.pid_file);
        }
    }

    // Main entry point
    async run(): Promise<void>
    {
        console.log(chalk.blue("🚀 Starting AI Receptionist Demo\n"));

        // Check .env file exists
        if (!this.check_env_file())
            process.exit(1);

        // Validate environment variables
        if (!this.validate_env_vars())
            process.exit(1);

        // Check if port is already in use
        const port_in_use = await this.is_port_in_use(this.port);

        if (port_in_use)
        {
            console.log(chalk.yellow(`⚠️  Port ${this.port} is already in use`));
            console.log("Using existing server...\n");
            await this.sleep(1000);
        }
        else
        {
            // Start the server
            const started = await this.start_server();
            if (!started)
                process.exit(1);
        }

        // Show instructions
        console.log();
        console.log(chalk.green("✓ Demo is ready!"));
        console.log();
        console.log(chalk.yellow("Instructions:"));
        console.log("  1. Click 'Start Call' button in the browser");
        console.log("  2. Allow microphone access when prompted");
        console.log("  3. Start talking to the AI receptionist!");
        console.log();
        console.log(chalk.yellow("Press Ctrl+C to stop the demo"));
        console.log();

        // Open browser
        await this.open_browser();

        // If we started the server, wait for it to exit
        if (this.server_process)
        {
            await new Promise<void>((resolve) => {
                this.server_process!.on("exit", () => resolve());
            });
        }
    }

}

// Run the demo launcher
const launcher = new demo_launcher();
launcher.run().catch((error: any) => {
    console.error(chalk.red(`\n❌ Demo launcher failed: ${error.message}`));
    process.exit(1);
});
