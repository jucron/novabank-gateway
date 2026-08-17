# NovaBank Gateway

A portfolio project that simulates an enterprise API Gateway architecture using **NGINX, Docker, TypeScript, and Node.js**.

The project is inspired by concepts commonly encountered when working with enterprise integration gateways such as **IBM DataPower**: API routing, backend targets, authentication, health monitoring, request policies, and eventually asynchronous messaging and other gateway capabilities.

> **Project status:** Early development. The routing, Dockerized backend services, centralized health monitoring, and JWT authentication foundations are implemented. More gateway capabilities will be added incrementally.

---

## Architecture

```text
                         ┌──────────────────────┐
                         │       Client         │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP
                                    ▼
                         ┌──────────────────────┐
                         │       NGINX          │
                         │   API Gateway        │
                         │                      │
                         │  Routing             │
                         │  Authentication      │
                         │  Gateway policies    │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
      │   Customer   │      │    Account   │      │   Payment    │
      │   Service    │      │    Service   │      │   Service    │
      │    :3001     │      │     :3002    │      │    :3003     │
      └──────────────┘      └──────────────┘      └──────────────┘

                         ┌──────────────────────┐
                         │    Auth Service      │
                         │        :3004         │
                         │      JWT validation  │
                         └──────────────────────┘

                         ┌──────────────────────┐
                         │ Gateway Health       │
                         │       :3005          │
                         │ Dependency checks    │
                         └──────────────────────┘
```

Everything runs locally through Docker Compose.

---

## Goals

The goal is to build a realistic, hands-on gateway laboratory rather than a collection of isolated examples.

The project focuses on understanding **gateway concepts and architecture**, using open-source technologies that can be run locally without requiring an enterprise gateway license.

The long-term goal is to reproduce and demonstrate concepts commonly found in enterprise gateway platforms, particularly DataPower.

---

## Current Features

### API Gateway / Reverse Proxy

NGINX acts as the single entry point for the APIs:

```text
Client
  |
  v
NGINX :8080
  |
  +--> Customer Service :3001
  |
  +--> Account Service  :3002
  |
  +--> Payment Service  :3003
```

External API paths are separated from internal service addresses.

Examples:

```text
GET  /api/customers/123
GET  /api/accounts/456
POST /api/payments
```

---

### Catalog and Targets

The project uses a small declarative gateway configuration model.

`config/catalog.yaml` defines the APIs exposed by the gateway:

```yaml
apis:
  customers:
    path: /customers
    target: customer-service

  accounts:
    path: /accounts
    target: account-service

  payments:
    path: /payments
    target: payment-service
```

`config/targets.yaml` defines where the backend services are located:

```yaml
targets:
  customer-service:
    url: http://customer-service:3001

  account-service:
    url: http://account-service:3002

  payment-service:
    url: http://payment-service:3003
```

A TypeScript generator converts this declarative configuration into the NGINX gateway configuration.

This provides a simple abstraction similar to the separation between API definitions and backend targets found in enterprise gateway products.

---

### Dockerized Backend Services

The gateway sits in front of independent services:

- Customer Service
- Account Service
- Payment Service
- Auth Service
- Gateway Health Service

Each service runs in its own Docker container.

This makes the project suitable for experimenting with:

- service failures
- routing
- dependency checks
- authentication
- network configuration
- load balancing
- retries
- asynchronous communication

---

### Centralized Gateway Health

Instead of exposing every service's health endpoint through the public API, the gateway exposes:

```http
GET /health
```

The Gateway Health Service checks the internal services and returns an aggregated status.

Example:

```json
{
  "status": "UP",
  "services": {
    "customer-service": "UP",
    "account-service": "UP",
    "payment-service": "UP",
    "auth-service": "UP"
  }
}
```

If a dependency is unavailable:

```json
{
  "status": "DEGRADED",
  "services": {
    "customer-service": "UP",
    "account-service": "UP",
    "payment-service": "DOWN",
    "auth-service": "UP"
  }
}
```

The endpoint returns `503 Service Unavailable` when dependencies are unavailable.

---

### JWT Authentication

An Auth Service provides development JWT functionality.

It supports:

```text
POST /token
POST /validate
GET  /verify
```

The intended architecture is:

```text
Client
  |
  | Authorization: Bearer <JWT>
  v
NGINX
  |
  | JWT verification
  v
Backend Service
```

Authentication is intended to be enforced at the gateway rather than duplicated across every backend service.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| TypeScript | Service and gateway tooling |
| Node.js | Runtime |
| Fastify | Lightweight backend services |
| NGINX | API Gateway / reverse proxy |
| Docker | Service containerization |
| Docker Compose | Local orchestration |
| YAML | Gateway configuration |
| JWT | Authentication |
| IntelliJ HTTP Client | API testing |

---

## Project Structure

```text
novabank-gateway/
│
├── config/
│   ├── catalog.yaml
│   └── targets.yaml
│
├── gateway/
│   └── nginx.conf
│
├── scripts/
│   └── generate-nginx.ts
│
├── services/
│   ├── customer/
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── server.ts
│   │
│   ├── account/
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── server.ts
│   │
│   ├── payment/
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── server.ts
│   │
│   ├── auth/
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── server.ts
│   │
│   └── gateway-health/
│       ├── Dockerfile
│       └── src/
│           └── server.ts
│
├── tests/
│   └── gateway.http
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Running the Project

### Prerequisites

Install:

- Docker
- Docker Compose
- Node.js
- npm
- IntelliJ IDEA (optional, but recommended for the HTTP Client)

### Install dependencies

From the project root:

```bash
npm install
```

### Generate the gateway configuration

```bash
npm run generate:gateway
```

This generates:

```text
gateway/nginx.conf
```

from the catalog and target configuration.

### Start everything

```bash
docker compose up --build
```

The gateway is available at:

```text
http://localhost:8080
```

---

## Example Requests

### Gateway health

```http
GET http://localhost:8080/health
```

### Get a customer

```http
GET http://localhost:8080/api/customers/123
```

### Get an account

```http
GET http://localhost:8080/api/accounts/456
```

### Create a payment

```http
POST http://localhost:8080/api/payments
Content-Type: application/json

{
  "fromAccount": "A100",
  "toAccount": "A200",
  "amount": 100
}
```

Authentication will eventually be required for these business APIs.

---

## Testing

The project uses the IntelliJ HTTP Client.

The test collection is located at:

```text
tests/gateway.http
```

It contains tests for:

- gateway routing
- customer API
- account API
- payment API
- authentication
- invalid authentication
- gateway health
- direct service health checks
- negative routing scenarios

Example:

```http
GET http://localhost:8080/health
```

Authentication tests use an automatically captured JWT:

```http
POST http://localhost:3004/token

> {%
    client.global.set("authToken", response.body.access_token);
%}
```

Subsequent requests can use:

```http
Authorization: Bearer {{authToken}}
```

---

## Gateway Concepts Demonstrated

The project is intended to demonstrate progressively more advanced gateway responsibilities.

### Routing

```text
/api/customers  -> customer-service
/api/accounts   -> account-service
/api/payments   -> payment-service
```

### Reverse Proxy

Clients communicate with the gateway rather than directly with backend services.

### Target Management

Backend locations are represented separately from API definitions.

### Authentication

JWT validation is centralized at the gateway boundary.

### Health and Dependency Monitoring

A centralized health endpoint reports the state of downstream services.

### Request Policies

Future gateway policies will be applied before requests reach backend services.

### Service Isolation

Backend services are independently containerized and can fail independently.

---

## Roadmap

The project will gradually implement additional gateway capabilities.

### Completed / In Progress

- [x] Dockerized backend services
- [x] NGINX reverse proxy
- [x] API routing
- [x] Catalog and target configuration
- [x] Generated NGINX configuration
- [x] Parameterized backend routes
- [x] Centralized gateway health
- [x] JWT authentication service
- [ ] Gateway-enforced JWT authentication

### Planned

- [ ] Request/response header manipulation
- [ ] Rate limiting
- [ ] TLS termination
- [ ] Load balancing
- [ ] Retry and fault handling
- [ ] Request transformation
- [ ] Response transformation
- [ ] API versioning
- [ ] Caching
- [ ] Structured gateway logging
- [ ] Metrics and observability
- [ ] SOAP/XML integration
- [ ] Asynchronous messaging
- [ ] RabbitMQ integration
- [ ] WebSocket experimentation
- [ ] Security policies
- [ ] Service-to-service authentication
- [ ] Integration tests
- [ ] CI/CD pipeline

---

## Why This Project?

Enterprise integration platforms such as IBM DataPower provide many capabilities around:

- API exposure
- routing
- security
- protocol mediation
- policy enforcement
- transformation
- message handling
- observability
- asynchronous integration

Those platforms are powerful but can be difficult to practice with outside a corporate environment.

This project provides a lightweight local environment for learning the underlying concepts using open-source technologies and Docker.

The objective is not to recreate DataPower internally.

The objective is to understand **why these gateway capabilities exist, how they interact, and how they can be implemented using different technologies**.

---

## Portfolio Context

This project demonstrates experience with:

- API Gateway architecture
- Reverse proxies
- HTTP routing
- Docker and containerized services
- TypeScript/Node.js
- NGINX
- JWT authentication
- Declarative configuration
- Service health monitoring
- Distributed-service concepts
- Integration architecture

As the project evolves, it will also demonstrate security policies, traffic management, asynchronous messaging, protocol transformation, observability, and fault handling.

---

## Disclaimer

This is an educational portfolio project.

The architecture intentionally simplifies several production concerns, including secret management, certificate management, identity-provider integration, network security, persistence, and high availability.

Production systems should use appropriate identity providers, secret stores, TLS configuration, observability, security controls, and infrastructure practices.
