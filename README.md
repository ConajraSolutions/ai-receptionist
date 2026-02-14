# AI Receptionist

Multi-tenant AI receptionist platform that handles phone calls 24/7, books appointments intelligently, and integrates with calendar platforms.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher ([install](https://nodejs.org))
- **Redis**: For caching and rate limiting
- **npm**: 9.0.0 or higher (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-receptionist

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration
```

### Development

```bash
# Run the demo (recommended for testing)
npm run demo

# Or run the development server directly
npm run dev
```

The demo launcher will:
- Start the development server
- Check system health (Node version, Redis, environment variables)
- Open your browser to the demo interface
- Allow you to test voice calls with the AI receptionist

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Voice AI** | Vapi | Telephony, speech-to-text, natural language processing |
| **Runtime** | Node.js 20 + TypeScript | Backend server and business logic |
| **Framework** | Express 5 | HTTP server and webhook handling |
| **Cache** | Redis 5+ | Configuration caching, rate limiting, distributed locks |
| **Storage** | JSON files (PostgreSQL planned) | Tenant configuration storage |
| **Testing** | Jest | Unit and integration tests |

---

## 📜 Available Commands

| Command | Description |
|---------|-------------|
| `npm run demo` | Launch demo with health checks and browser (cross-platform) |
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage report |

### Shell Scripts (Unix/Linux/macOS only)

| Script | Description |
|--------|-------------|
| `./scripts/dodemo.sh` | Bash version of demo launcher |
| `./scripts/dotest.sh` | Build and run tests |
| `./scripts/dodraft.sh` | Draft branch workflow for Git |
| `./scripts/flush-cache.sh` | Flush Redis cache |
| `./scripts/release.sh` | Release workflow automation |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run build check
npm run build
```

---

## 🔧 System Requirements

- **Node.js**: >= 18.0.0 (enforced in package.json)
- **npm**: >= 9.0.0
- **Redis**: 5.0+ (for caching and rate limiting)
---

## 🏛️ Architecture

This system uses a **mediator pattern** where all Vapi webhook requests are routed through a central mediator to appropriate services.

**Request Flow**:
```
Vapi (Voice AI) → POST /vapi/webhook → Mediator → Services (Scheduler, etc.)
```

**Key Features**:
- ✅ Multi-tenant with complete isolation
- ✅ Concurrent call handling
- ✅ Distributed locking for booking conflicts
- ✅ Calendar platform agnostic (adapter pattern)
- ✅ Graceful degradation under failure
- ✅ Human-in-the-loop review queue

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines for Claude Code
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed system architecture and design patterns
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Recent implementation notes

---

## 📄 License

Conajra Solutions © 2026
