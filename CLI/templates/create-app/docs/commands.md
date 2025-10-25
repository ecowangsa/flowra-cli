# CLI Commands

The `flowra` CLI streamlines common framework tasks. Run `flowra list` to see available commands.

## HTTP & Runtime

| Command | Description |
| --- | --- |
| `flowra serve` | Run the HTTP server using the configured APP_PORT. |
| `flowra serve:watch` | Start the server with nodemon for live reloads. |
| `flowra route:list` | Display registered routes from all enabled modules. |

## Module Management

| Command | Description |
| --- | --- |
| `flowra module:list` | List module names and enabled status. |
| `flowra module:enable <name>` | Enable a module (by kebab-case name). |
| `flowra module:disable <name>` | Disable a module. |

## Scaffolding

| Command | Description |
| --- | --- |
| `flowra create-app <directory>` | Scaffold a fresh flowra application in the target directory. |
| `flowra make:module <Name> [--db <alias>] [--force]` | Generate a module scaffold and update the manifest. |
| `flowra make:model <Name> [--db <alias>] [--table <name>] [--module <mod>]` | Generate a model in the project or module scope. |
| `flowra make:controller <Name> [--module <mod>]` | Generate a controller. |
| `flowra make:service <Name> [--module <mod>]` | Generate a service. |
| `flowra make:route <kebab> [--module <mod>]` | Generate a route file. |
| `flowra make:validator <kebab> [--module <mod>]` | Generate a Zod validator (installation of `zod` may be required). |
| `flowra make:query <Name> [--module <mod>]` | Generate query helpers. |
| `flowra make:resource <Name> [--db <alias>]` | Generate a full REST resource scaffold. |

## Database Operations

| Command | Description |
| --- | --- |
| `flowra db:migrate:make <name> [--env <alias>]` | Create a migration file for an alias. |
| `flowra db:migrate:latest [--env <alias>]` | Run migrations. |
| `flowra db:rollback [--env <alias>] [--all]` | Roll back migrations. |
| `flowra db:status [--env <alias>]` | Show migration status. |
| `flowra db:seed:make <name> [--env <alias>]` | Create a seed file. |
| `flowra db:seed:run [--env <alias>]` | Execute seeds. |

## Environment & Diagnostics

| Command | Description |
| --- | --- |
| `flowra env:example` | Regenerate `.env.example`. |
| `flowra env:check` | Validate required environment variables. |
| `flowra config:print [--namespace <ns>]` | Print active runtime configuration. |
| `flowra health:check` | Validate DB connection bootstrapping. |

## Maintenance

| Command | Description |
| --- | --- |
| `flowra clean:analyze` | Dry-run cleanup analysis. |
| `flowra clean:prune [--yes] [--force]` | Delete flagged files and folders. |

## Examples

```bash
# Start the server on a custom port
flowra serve --port 4000

# Scaffold a new application
flowra create-app my-app

# Run migrations then seed data
flowra db:migrate:latest
flowra db:seed:run
```
