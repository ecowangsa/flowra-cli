# Getting Started with flowra

flowra is an internal Node.js framework tailored for multi-tenant marketplace systems. It layers Express, Knex, and Redis under a clean architecture inspired by Laravel and NestJS.

## Prerequisites

- Node.js 18+
- npm 9+
- MySQL 8+ (or compatible)
- Redis 6+

## Installation

```bash
npm install
```

Copy `.env.example` to `.env` and adjust database, cache, and application values. Default ports use `3387` for HTTP and `6379` for Redis.

## Project Structure

```
app/
├── Bootstrap/
├── Config/
├── Http/
│   ├── Middleware/
│   └── http.router.js
├── Infrastructure/
├── Modules/
│   ├── Shared/
│   └── Welcome/
└── Providers/
core/
├── CLI/
└── Support/
```

## Running the Application

```bash
flowra serve
```

The CLI loads the dependency container, configures middleware, and starts the HTTP server with graceful shutdown handling.

## Generating Components

Use the CLI to accelerate your workflow:

```bash
flowra create-app river-app
flowra db:migrate:make create_users_table
```

Generated files follow the modular conventions described in the [Architecture](./architecture.md) guide.
