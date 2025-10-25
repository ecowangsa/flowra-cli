# Architecture

flowra follows Domain-Driven Design (DDD) and Clean Architecture principles. The application is organised into concentric layers that keep HTTP transport, domain logic, and infrastructure concerns isolated.

## Layers

### Bootstrap
Creates the Express application, configures middleware, loads service providers, and prepares graceful shutdown hooks. The bootstrap factory exposes `{ app, container }` for reuse in tests and the CLI.

### Config
Centralised configuration files (e.g., `App.js`, `Database.js`, `Cache.js`, `Logger.js`). Use the `config(path, defaultValue)` helper to read values without importing individual files.

### Http
Contains incoming transport logic: routing and middleware. Modules provide their own controllers, so the HTTP layer focuses on request context, error handling, and shared middleware such as correlation IDs and security headers.

### Modules
Feature packages live under `app/Modules/<Name>`. Each module defines its own container registrations (queries, services, validators, controllers, routes) and optional aliases. Modules encapsulate vertical slices so HTTP transport, business logic, and validation remain cohesive.

### Infrastructure
Integrates with external systems such as databases and caches. `Infrastructure/Database/database.manager` manages Knex connections, query logging, and graceful teardown.

### Providers
Service providers register and boot additional services. They are resolved after the application starts so domain modules can hook into the container without polluting bootstrap code.

## Dependency Injection

`app/Bootstrap/Container/container.module.js` implements a lightweight IoC container. It registers:

- Configuration helper (`config`)
- Logger (Winston-based)
- Database manager (Knex)
- Cache manager (Redis or in-memory)
- Validation factory
- Module services, controllers, validators, and routes

Controllers and services request dependencies via constructor injection, enabling granular unit testing.

## Request Lifecycle

1. `flowra serve` resolves the container and bootstraps Express.
2. `RequestContextMiddleware` assigns a correlation ID and attaches a scoped logger.
3. Helmet, compression, and body parsing middleware prepare the request.
4. Routes dispatch to controllers which coordinate domain services.
5. `NotFoundHandler` converts unmatched routes to a 404 `HttpError`.
6. `ErrorHandler` serialises errors with request metadata and logs the failure.

## Extending the Framework

- Add new modules under `app/Modules/<Feature>` with their own `container.js` and route definitions.
- Register repositories or adapters through service providers when infrastructure cross-cuts multiple modules.
- Implement additional CLI commands by extending `core/CLI/commands`.
- Encapsulate shared utilities under `core/Support` or `core/Services`.

This layering keeps HTTP concerns thin while allowing domain logic to evolve independently from infrastructure.
