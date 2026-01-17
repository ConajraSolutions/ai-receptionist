// Conajra Solutions © 2026
// TODO: hamza will do this

import { storage } from "./storage";

export class scheduler {

    private m_storage: storage;

    constructor(storage: storage)
    {
        this.m_storage = storage;
    }

    async book_appointment()
    {
        return true;
    }

    async check_availability()
    {
        return true;
    }

} 