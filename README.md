<p align="center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="128px" height=128px"><path fill="rgb(255, 255, 255)" d="M320 400C394.6 400 458.4 353.6 484 288L488 288C501.3 288 512 277.3 512 264L512 184C512 170.7 501.3 160 488 160L484 160C458.4 94.4 394.6 48 320 48C245.4 48 181.6 94.4 156 160L152 160C138.7 160 128 170.7 128 184L128 264C128 277.3 138.7 288 152 288L156 288C181.6 353.6 245.4 400 320 400zM304 144L336 144C389 144 432 187 432 240C432 293 389 336 336 336L304 336C251 336 208 293 208 240C208 187 251 144 304 144zM112 548.6C112 563.7 124.3 576 139.4 576L192 576L192 528C192 510.3 206.3 496 224 496L416 496C433.7 496 448 510.3 448 528L448 576L500.6 576C515.7 576 528 563.7 528 548.6C528 488.8 496.1 436.4 448.4 407.6C412 433.1 367.8 448 320 448C272.2 448 228 433.1 191.6 407.6C143.9 436.4 112 488.8 112 548.6zM279.3 205.5C278.4 202.2 275.4 200 272 200C268.6 200 265.6 202.2 264.7 205.5L258.7 226.7L237.5 232.7C234.2 233.6 232 236.6 232 240C232 243.4 234.2 246.4 237.5 247.3L258.7 253.3L264.7 274.5C265.6 277.8 268.6 280 272 280C275.4 280 278.4 277.8 279.3 274.5L285.3 253.3L306.5 247.3C309.8 246.4 312 243.4 312 240C312 236.6 309.8 233.6 306.5 232.7L285.3 226.7L279.3 205.5zM248 552L248 576L296 576L296 552C296 538.7 285.3 528 272 528C258.7 528 248 538.7 248 552zM368 528C354.7 528 344 538.7 344 552L344 576L392 576L392 552C392 538.7 381.3 528 368 528z"/></svg>
</p>

## Helpinaut API

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
