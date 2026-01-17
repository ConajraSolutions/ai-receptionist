// Conajra Solutions © 2026
// Author: Marwan

// a simple JSON based database 

import * as fs from "fs/promises";
import * as path from "path";

export class db {

    private base_path: string;

    constructor(base_path: string) { this.base_path = base_path; }

    async read<T>(file_name: string): Promise<T | null> 
    {
        const file_path = path.join(this.base_path, file_name);
        try 
        {
            const data = await fs.readFile(file_path, "utf-8");
            return JSON.parse(data) as T;
        } 
        catch { return null; }
    }

    async write<T>(file_name: string, data: T): Promise<void> 
    {
        const file_path = path.join(this.base_path, file_name);
        await fs.writeFile(file_path, JSON.stringify(data, null, 2), "utf-8");
    }

    async exists(file_name: string): Promise<boolean> 
    {
        const file_path = path.join(this.base_path, file_name);
        try 
        {
            await fs.access(file_path);
            return true;
        } catch { return false; }
    }

    async delete(file_name: string): Promise<void> 
    {
        const file_path = path.join(this.base_path, file_name);
        await fs.unlink(file_path);
    }

}
