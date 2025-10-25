# Deployment Guide

This guide highlights production considerations for the flowra framework.

## Docker & PM2

1. Build a lightweight Node.js image (e.g., `node:18-alpine`).
2. Copy source code and install production dependencies: `npm ci --only=production`.
3. Verify environment variables: `flowra env:check`.
4. Start the app through the CLI using PM2: `pm2 start bin/flowra.js --name flowra -- serve`.

## Database Migrations

Automate schema changes during deployment:

```bash
flowra db:migrate:latest
flowra db:seed:run
```

Run these commands against a managed MySQL instance using a database user with migration privileges.

## Environment Management

- Store secrets in a secure vault (e.g., AWS Parameter Store, HashiCorp Vault).
- Use `.env.production` files only for local mirroring; never commit secrets to version control.
- Set `APP_ENV=production` and `APP_DEBUG=false` to reduce log verbosity.

## Observability

- Forward application logs to a central aggregator (e.g., ELK, Datadog).
- The logger emits JSON metadata (request ID, route, status) suitable for structured ingestion.
- Extend `RequestContextMiddleware` to include tenant IDs or correlation tokens for distributed tracing.

## CI/CD Pipeline

A recommended pipeline includes:

1. `npm install`
2. `npm run lint`
3. `npm run test:unit`
4. `npm run test:integration`
5. `npm run format`
6. Build Docker image and push to registry.
7. Run database migrations on release.

## Scaling

- Place flowra behind Nginx or a load balancer (AWS ALB, GCP Load Balancer).
- Use Redis for session storage, caching, and rate limiting.
- Enable horizontal scaling by running multiple PM2/Node instances and using sticky sessions if required.

## Graceful Shutdown

The CLI and HTTP entrypoints trap `SIGTERM`/`SIGINT`, draining Knex pools and Redis connections before exiting. Ensure orchestration platforms (Kubernetes, ECS) allow enough termination grace period (≥ 10 seconds).
