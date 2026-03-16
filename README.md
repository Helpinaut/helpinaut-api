<p align="center">
  <img src="https://cdn.discordapp.com/attachments/1428319464000327722/1483162823503642855/user-astronaut-solid.png?ex=69b99684&is=69b84504&hm=fe608bab6a256b21d363a78cb16f55b119240c1583c327efa163f1b3396977e9&" width="30%"/>
</p>

# Helpinaut API

Backend service built with **[NestJS](https://nestjs.com/)**, **[Prisma](https://www.prisma.io/)**, and **[PostgreSQL](https://www.postgresql.org/)**, designed to power a local services marketplace **[Helpinaut](https://github.com/Helpinaut/helpinaut-web)**.

Users can publish adverts requesting or offering services, upload photos, manage favorites, and search for specific adverts using filter params and approximate geolocation.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [API Overview](#api-overview)
  - [Adverts](#adverts)
  - [Auth](#auth)
  - [Users](#users)
- [Environment Setup](#environment-setup)
- [Running with Docker](#running-with-docker)
- [Run Locally](#run-locally)
- [Running Tests](#running-tests)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Authors](#authors)

## Tech Stack

- **Node.js** + **NestJS** (modular backend framework)
- **Prisma ORM** (with PostgreSQL)
- **JWT Authentication**
- **Nominatim Geocoding API** (postal-code-based geolocation)
- **Multer** (file uploads)
- **Jest** (unit + E2E testing)
- **Supertest** (HTTP testing)
- **Swagger** (API documentation)

## Features

- User registration and login with JWT.
- Create, update, delete and list adverts.
- Update and delete account.
- Upload up to 10 photos per advert.
- Mark/unmark adverts as favorites.
- Approximate geolocation based on postal code.
- Distance-based and param-based advert filtering.
- API versioning (`/api/v1/...`).
- Full test suite (init + E2E).
- Prisma migrations and seed.
- Clean architecture with modules, services, controllers, DTOs, guards, pipes, etc.

## Architecture Overview

This projects follows a modular NestJS architecture:

```
src/
├── adverts/
│   ├── dto/
│   ├── entities/
│   ├── pipes/
│   ├── services/
│   │   ├── favorites.service.ts
│   │   └── photos.service.ts
│   ├── adverts.controller.ts
│   ├── adverts.module.ts
│   └── adverts.service.ts
├── auth/
│   ├── decorators/
│   ├── dto/
│   ├── guard/
│   ├── interfaces/
│   ├── strategies/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── config/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── users/
│   ├── dto/
│   ├── entities/
│   ├── services/
│   │   └── geocoding.service.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── utils/
├── app.module.ts
└── main.ts
```

- **Controllers** expose REST endpoints.
- **Services** contain business logic.
- **DTOs** validate request payloads.
- **PrismaService** handles database access.
- **Pipes** validate uploaded image files.
- **Guards** enforce authentication via JWT.

Database schema is defined in `./prisma/schema.prisma`, including: `User`, `Advert`, `Photo`, `Favorite`, and `Categories` and `Status` enum values.

## API Overview

### Adverts

- **`/api/v1/adverts`**
  - `POST`: creates and returns new advert. **Requires authentication**.
  - `GET`: returns adverts list. Supports pagination and filtering by advert params and distance.
- **`/api/v1/adverts/categories`**
  - `GET`: returns advert categories list.
- **`/api/v1/adverts/:id`**
  - `GET`: returns an existing advert.
  - `PATCH`: updates an existing advert and returns it. **Requires authentication**.
  - `DELETE`: deletes an existing advert. **Requires authentication**.
- **`/api/v1/adverts/:id/photos`**
  - `POST`: add photos to an existing advert and returns it updated. **Requires authentication**.
- **`/api/v1/adverts/:id/photos/:photoId`**
  - `DELETE`: deletes a photo from an existing advert and returns it updated. **Requires authentication**.
- **`/api/v1/adverts/favorites/me`**
  - `GET`: returns favorite adverts list. **Requires authentication**.
- **`/api/v1/adverts/:id/favorites`**
  - `POST`: mark an existing advert as favorite and returns it updated. **Requires authentication**.
  - `DELETE`: unmark an existing advert as favorite and returns it updated. **Requires authentication**.

### Auth

- **`/api/v1/auth/login`**
  - `POST`: returns access token if user credentials are valid.
- **`/api/v1/auth/signup`**
  - `POST`: creates and returns new user and access token.

### Users

- **`/api/v1/users/me`**
  - `GET`: returns logged user. **Requires authentication**.
  - `PATCH`: updates logged user credentials and returns it. **Requires authentication**.
  - `DELETE`: deletes logged user. **Requires authentication**.
- **`/api/v1/users/me/location`**
  - `PATCH`: updates logged user location via postal code and returns it updated. **Requires authentication**.
- **`/api/v1/users/:id`**
  - `GET`: returns an existing user public profile.

## Environment Setup

1. Clone the project:

```bash
git clone https://github.com/Helpinaut/helpinaut-api.git
cd helpinaut-api
```

2. Copy the environment variables from `.env.example` to `.env`:

```bash
cp .env.example .env
```

> ![IMPORTANT]
> Make sure to check the new `.env` values to match your configuration.

## Running with Docker

1. Create the Docker environment file:

```bash
cp .env.example .env.docker
```

Update the database URL:

```bash
DATABASE_URL="postgresql://helpinaut:helpinaut@db:5432/helpinaut"
NODE_ENV=production
```

2. Build and start the containers:

```bash
docker compose up --build
```

This will build the API starting PostgreSQL 16, run prisma migrations, database seeds and NestJS server in production mode.

## Run Locally

Install dependencies and start the server:

```bash
npm install
npm run prisma:migrate
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

## Running Tests

To run test, run the following command:

```bash
# unit tests
npm run test

# unit tests coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

> ![IMPORTANT]
> Make sure to create an `.env.test` file with a proper testing database before running E2E tests.

These tests automatically reset the test database, run migrations, seed test data and validate all endpoints.

## Documentation

Swagger UI is available at `http://localhost:3000/api/v1/docs`.

## Roadmap

- [ ] PostGIS support for advanced geospatial queries
- [ ] Repository pattern for better abstraction and practice
- [ ] Prisma 7 migration
- [ ] Notifications system
- [ ] Password recovery and token expiration.
- [ ] Multi-language support
- [ ] Chat system

## Authors

[**@miguelferlez** Miguel Fernández](https://github.com/miguelferlez)
