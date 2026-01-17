// Conajra Solutions © 2026
// Author: Marwan

// a simple JSON based database 

import * as fs from "fs/promises";
import * as path from "path";

export class db {

    private base_path: string;

    constructor(base_path: string) { this.base_path = base_path; }

    async read<T>(tenant_id: string): Promise<T | null> 
    {
        const file_path = path.join(this.base_path, `${tenant_id}.json`);
        try 
        {
            const data = await fs.readFile(file_path, "utf-8");
            return JSON.parse(data) as T;
        } 
        catch { return null; }
    }

    async write<T>(tenant_id: string, data: T): Promise<void> 
    {
        const file_path = path.join(this.base_path, `${tenant_id}.json`);
        await fs.writeFile(file_path, JSON.stringify(data, null, 2), "utf-8");
    }

    async exists(tenant_id: string): Promise<boolean> 
    {
        const file_path = path.join(this.base_path, `${tenant_id}.json`);
        try 
        {
            await fs.access(file_path);
            return true;
        } catch { return false; }
    }

    async delete(tenant_id: string): Promise<void> 
    {
        const file_path = path.join(this.base_path, `${tenant_id}.json`);
        await fs.unlink(file_path);
    }

}
