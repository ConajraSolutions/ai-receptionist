# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant AI receptionist platform that handles phone calls, books appointments, and integrates with calendar platforms. Vapi manages telephony/voice AI; this codebase handles the backend business logic via webhooks.

## Development Commands

```bash
npm run dev      # Start dev server with hot-reload (ts-node-dev)
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled production build
```

## Architecture

### Request Flow
```
Vapi (Voice AI) → POST /vapi/webhook → Mediator → Services (Scheduler, etc.)
```

### Key Patterns

**Mediator Pattern** (`src/modules/mediator.ts`): Central router that handles all Vapi webhook requests and dispatches to appropriate services. Services never communicate directly with each other.

**Adapter Pattern** (planned): Calendar integrations will use a unified interface with platform-specific adapters (Google, Outlook, Notion).

### Project Structure
```
src/
├── server.ts          # Express entry point, webhook endpoint
├── modules/
│   ├── mediator.ts    # Routes function calls to services
│   └── scheduler.ts   # Booking and availability logic (stub)
└── types/
    └── vapi.ts        # TypeScript interfaces for Vapi webhooks
```

### Multi-Tenancy
- Every operation must be scoped by tenant_id
- Redis keys namespaced: `prefix:{tenant_id}`
- Each tenant has separate Vapi assistant and calendar credentials

## Vapi Integration

The system receives function calls from Vapi as POST requests to `/vapi/webhook`. Current supported functions:
- `book_appointment` - Book a new appointment
- `check_availability` - Check available time slots
- `flag_for_human` - Escalate to human review (planned)

## Code Conventions

- Classes: PascalCase (e.g., `mediator`, `scheduler`)
- Interfaces/types: snake_case (e.g., `vapi_function_call`)
- Methods: snake_case (e.g., `handle_webhook`, `book_appointment`)
- File headers include "Conajra Solutions © 2026" and author attribution
