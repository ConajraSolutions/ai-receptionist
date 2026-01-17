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

## Code Commenting Best Practices

Follow these 9 rules when writing comments (based on Stack Overflow's best practices):

1. **Comments should not duplicate the code** - Avoid redundant comments like `i = i + 1; // Add one to i`. They add clutter and become outdated.

2. **Good comments do not excuse unclear code** - Don't comment a poorly named variable; rename it instead. "Don't comment bad code — rewrite it."

3. **If you can't write a clear comment, there may be a problem with the code** - Struggling to explain code often means it's too clever. Simplify it.

4. **Comments should dispel confusion, not cause it** - If a comment causes confusion rather than clarity, remove it.

5. **Explain unidiomatic code in comments** - When code looks redundant but is necessary, explain why to prevent future "simplification."

6. **Provide links to the original source of copied code** - Include Stack Overflow URLs or other sources for context and attribution.

7. **Include links to external references where helpful** - Link to standards (RFCs), documentation, or tutorials where the code implements them.

8. **Add comments when fixing bugs** - Document browser-specific workarounds, edge cases, and reference issue tracker numbers.

9. **Use comments to mark incomplete implementations** - Use `TODO` comments to flag known limitations; link to issue tracker tickets when possible.

**Key principle:** "Code Tells You How, Comments Tell You Why." Comments complement good code by providing context that the code itself cannot express.
