---
title: TypeORM Core Guide
date: '2026-03-22'
tags:
- backend/typeorm
- backend/orm
- backend/database
- backend/core
- backend/nestjs
- typescript/library
description: TypeORM 핵심 개념과 일상적인 CRUD/모델링/데이터 접근 계층만 추려 읽기 쉽게 분리한 코어 가이드
slug: typeorm-core-guide
---

# TypeORM Core Guide

가장 자주 쓰는 기초와 핵심 개념만 먼저 읽고 싶을 때 보는 분할본이다. 범위는 Part 1~5다.

## 읽기 경로

- [Core](https://devholic.me/posts/typeorm-core-guide)
- [Advanced](https://devholic.me/posts/typeorm-advanced-guide)
- [Operations](https://devholic.me/posts/typeorm-operations-guide)
- [NestJS](https://devholic.me/posts/typeorm-nestjs-guide)
- [Guide Hub](https://devholic.me/posts/typeorm-beginner-guide)

## 함께 읽기

- [NestJS Core Guide](https://devholic.me/posts/nestjs-core-guide): module, provider, DI 구조를 먼저 잡고 TypeORM을 얹을 때
- [NestJS Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide): `TypeOrmModule`, `@InjectRepository()`, multi connection 예제를 바로 같이 볼 때

## 이 문서에서 다루는 섹션

### Part 1: 기초

- [TypeORM이란?](#typeorm이란?)
- [빠른 시작과 기본 흐름](#빠른-시작과-기본-흐름)
- [Active Record vs Data Mapper](#active-record-vs-data-mapper)
- [NestJS와 조합할 때 기본 선택](#nestjs와-조합할-때-기본-선택)

### Part 2: DataSource와 연결 관리

- [DataSource — 연결의 시작점](#datasource-—-연결의-시작점)
- [DataSourceOptions — 실무에서 자주 쓰는 옵션](#datasourceoptions-—-실무에서-자주-쓰는-옵션)
- [DataSource API — 어디까지 할 수 있나](#datasource-api-—-어디까지-할-수-있나)
- [null / undefined WHERE 처리](#null-/-undefined-where-처리)
- [다중 DataSource, 다중 DB/스키마, 복제](#다중-datasource,-다중-db/스키마,-복제)

### Part 3: 엔티티 모델링

- [Entity와 Column](#entity와-column)
- [Embedded Entity](#embedded-entity)
- [Entity Inheritance](#entity-inheritance)
- [Tree Entity](#tree-entity)
- [View Entity](#view-entity)
- [EntitySchema — 데코레이터 없는 정의 방식](#entityschema-—-데코레이터-없는-정의-방식)
- [Decorator Reference — 자주 쓰는 데코레이터 지도](#decorator-reference-—-자주-쓰는-데코레이터-지도)

### Part 4: Relation 설계

- [Relation 옵션과 Cascade](#relation-옵션과-cascade)
- [One-to-One](#one-to-one)
- [Many-to-One / One-to-Many](#many-to-one-/-one-to-many)
- [Many-to-Many](#many-to-many)
- [Eager vs Lazy Loading](#eager-vs-lazy-loading)
- [Relations FAQ — 자주 헷갈리는 지점](#relations-faq-—-자주-헷갈리는-지점)

### Part 5: 데이터 접근 계층

- [EntityManager](#entitymanager)
- [Repository](#repository)
- [Find Options](#find-options)
- [Custom Repository](#custom-repository)
- [EntityManager API / Repository API 핵심 메서드](#entitymanager-api-/-repository-api-핵심-메서드)

# Part 1: 기초 (Overview)

---

## TypeORM이란?

TypeORM은 **TypeScript/JavaScript용 ORM**이다. 관계형 데이터베이스를 객체 모델로 다루게 해주며, `Entity`, `Repository`, `QueryBuilder`, `Migration`, `Transaction` 같은 도구를 제공한다. Node.js 서버뿐 아니라 브라우저/모바일 계열 플랫폼까지 일부 지원한다.

### 핵심 특징

| 특징 | 설명 |
|------|------|
| **DataSource 중심 구조** | 연결, 메타데이터, Repository, Migration 실행의 출발점 |
| **Entity 기반 모델링** | 클래스와 데코레이터로 테이블 구조 표현 |
| **Repository / EntityManager** | CRUD와 도메인 단위 데이터 접근을 추상화 |
| **강력한 QueryBuilder** | 복잡한 SQL을 ORM 안에서 제어 가능 |
| **Migration 지원** | 운영 환경용 스키마 변경 절차 관리 |
| **다양한 드라이버** | Postgres, MySQL, SQLite, MSSQL, MongoDB 등 지원 |

### 자주 드는 의문

**ORM을 쓰면 SQL을 몰라도 되나?**  
아니다. TypeORM은 SQL을 숨기기보다, SQL을 더 안전하고 구조적으로 다루게 해주는 도구에 가깝다. 관계, 인덱스, 트랜잭션, 조인 전략을 이해하지 못하면 ORM만 써도 성능 문제는 그대로 난다.

**TypeORM은 언제 강한가?**  
- CRUD 중심 서비스
- 복잡한 엔터프라이즈식 도메인 모델
- TypeScript 타입 안정성이 중요한 프로젝트
- Migration과 스키마 변경 추적이 중요한 팀

**언제 답답해지나?**  
- 쿼리 최적화를 아주 공격적으로 해야 하는 경우
- ORM 추상화보다 SQL을 1급 시민으로 두고 싶은 경우
- Relation이 매우 복잡하고 조회 패턴이 예측 불가능한 경우

### 머릿속 모델을 잡는 최소 그림

```typescript
const usersRepository = dataSource.getRepository(User);

const user = await usersRepository.findOne({
  where: { email: "alice@example.com" },
  relations: { profile: true },
});

const recentPaidOrders = await dataSource
  .createQueryBuilder(Order, "order")
  .innerJoin("order.user", "user")
  .where("user.id = :userId", { userId: user?.id })
  .andWhere("order.status = :status", { status: "PAID" })
  .orderBy("order.createdAt", "DESC")
  .take(5)
  .getMany();
```

이 짧은 예제가 보여주는 구조는 단순하다.

- `Entity`는 테이블 구조와 관계를 표현한다.
- `Repository`는 CRUD와 단순 조회의 기본 진입점이다.
- `QueryBuilder`는 조인, 집계, 정렬, 페이징 같은 SQL 의도를 더 직접적으로 드러낸다.
- `DataSource`는 이 모든 런타임 API의 허브다.

---

## 빠른 시작과 기본 흐름

TypeORM의 가장 기본 흐름은 다음과 같다.

1. `DataSource`를 만든다.
2. `initialize()`로 연결 또는 커넥션 풀을 연다.
3. `Entity`를 등록한다.
4. `Repository`나 `EntityManager`로 조회/저장한다.
5. 운영 환경에서는 `synchronize` 대신 `Migration`으로 스키마를 관리한다.

### 최소 예시

```typescript
import { DataSource, Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "app",
  entities: [User],
  synchronize: false,
});
```

### 기본 실행 순서

```typescript
await AppDataSource.initialize();
const userRepository = AppDataSource.getRepository(User);
const user = userRepository.create({ name: "Alice" });
await userRepository.save(user);
```

### 핵심 판단 기준

- **개발 초반**: `synchronize: true`가 빠르다.
- **운영 시작 이후**: `synchronize`는 끄고 `migration`으로 전환해야 한다.
- **간단한 조회**: `Repository.find*`
- **복잡한 조건/조인**: `QueryBuilder`
- **원자성 보장**: `transaction` 또는 `QueryRunner`

---

## Active Record vs Data Mapper

TypeORM은 두 패턴을 모두 지원한다.

### Active Record

엔티티가 `BaseEntity`를 상속하고, 엔티티 자신이 저장/조회 메서드를 갖는다.

```typescript
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

### Data Mapper

엔티티는 순수 모델에 가깝고, 저장/조회는 `Repository`나 서비스 계층에서 처리한다.

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

### Trade-off

| 방식 | 장점 | 단점 |
|------|------|------|
| **Active Record** | 빠르게 시작 가능, 코드가 짧음 | 도메인과 영속성이 강하게 결합됨 |
| **Data Mapper** | 테스트/확장/레이어 분리에 유리 | 초기에 코드가 조금 더 장황 |

### 실무 판단

- **작은 개인 프로젝트**: Active Record도 가능
- **팀 프로젝트, NestJS, 테스트 중요**: Data Mapper가 더 적합

---

## NestJS와 조합할 때 기본 선택

NestJS와 함께 쓸 때는 사실상 **Data Mapper 패턴이 기본 선택**이다.

이유는 명확하다.

- Nest는 `Service + Repository 주입` 구조와 잘 맞는다.
- `@InjectRepository()`로 repository를 DI 받는 흐름이 자연스럽다.
- 테스트에서 `getRepositoryToken()`으로 mock하기 쉽다.
- Active Record는 Entity가 영속성 로직을 품어 Nest의 계층 분리를 약하게 만든다.

> **정리**: TypeORM 자체는 두 패턴을 지원하지만, NestJS와 결합하면 대부분 Data Mapper가 더 좋은 선택이다.

### NestJS에서 권장하는 기본 골격

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.getOrThrow("DB_HOST"),
        port: config.getOrThrow<number>("DB_PORT"),
        username: config.getOrThrow("DB_USER"),
        password: config.getOrThrow("DB_PASSWORD"),
        database: config.getOrThrow("DB_NAME"),
        autoLoadEntities: true,
        synchronize: false,
        invalidWhereValuesBehavior: {
          null: "throw",
          undefined: "throw",
        },
      }),
    }),
  ],
})
export class AppModule {}
```

```typescript
// app-data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";

export default new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  entities: [__dirname + "/**/*.entity.{js,ts}"],
  migrations: [__dirname + "/database/migrations/*.{js,ts}"],
  synchronize: false,
});
```

### 왜 이 조합이 덜 후회되는가

- 앱 런타임은 `TypeOrmModule.forRootAsync()`로 올리고, CLI는 별도 `app-data-source.ts`로 분리하는 편이 안정적이다.
- `autoLoadEntities`는 개발 초반 속도가 빠르지만, CLI가 엔티티를 자동 수집해주지는 않으므로 data source 파일에서는 경로를 명시해야 한다.
- 트랜잭션은 `@InjectDataSource()`로 시작해서 `manager`를 전파하는 패턴이 Nest의 DI와 가장 충돌이 적다.
- DTO와 Entity를 분리하면 validation, authorization, relation 저장 범위를 각각 통제하기 쉽다.

---

# Part 2: DataSource와 연결 관리

---

## DataSource — 연결의 시작점

`DataSource`는 TypeORM의 중심 객체다. 연결 설정, 엔티티 메타데이터, Repository, QueryBuilder, Migration 실행, 트랜잭션 진입점이 모두 여기서 시작된다.

### 핵심 개념

- `initialize()`로 연결 또는 커넥션 풀을 연다.
- `destroy()`로 종료 시 연결을 닫는다.
- 서버 앱에서는 보통 부팅 시 한 번 초기화하고, 프로세스가 내려갈 때 정리한다.

### 최소 예제

```typescript
// app-data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./user.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "app",
  entities: [User],
  synchronize: false,
});
```

```typescript
// main.ts
import { AppDataSource } from "./app-data-source";

async function bootstrap() {
  await AppDataSource.initialize();
  console.log("data source initialized");
}

bootstrap().catch((error) => {
  console.error("bootstrap failed", error);
});
```

### 실무형 예제

```typescript
// user.repository-example.ts
import { AppDataSource } from "./app-data-source";
import { User } from "./user.entity";

export async function createUser(name: string, email: string) {
  const repository = AppDataSource.getRepository(User);
  const user = repository.create({ name, email });
  return repository.save(user);
}
```

### 자주 하는 실수

- 요청마다 `new DataSource()` 생성
- `initialize()`를 여러 번 호출
- 테스트와 운영에서 같은 DataSource 설정을 재사용

### NestJS 조합 포인트

Nest에서는 보통 직접 `DataSource.initialize()`를 다루기보다 `TypeOrmModule.forRoot()`가 이 초기화 과정을 감싼다.  
즉, Nest에서는 `DataSource`를 직접 관리한다기보다 **주입된 DataSource를 사용한다**고 생각하면 된다.

---

## DataSourceOptions — 실무에서 자주 쓰는 옵션

`DataSourceOptions`는 연결 방식과 ORM 동작 방식을 결정한다.

### 공통 핵심 옵션

| 옵션 | 의미 | 실무 메모 |
|------|------|------|
| `type` | DB 종류 | 필수 |
| `entities` | 엔티티 등록 | 클래스 직접 등록이 가장 명확 |
| `subscribers` | 구독자 등록 | 이벤트 로직에 사용 |
| `logging` | SQL/에러 로깅 | 개발/관측용 |
| `logger` | 로거 구현체 | 커스텀 로깅 가능 |
| `poolSize` | 풀 크기 | 고부하 서비스에서 중요 |
| `namingStrategy` | 이름 규칙 | snake_case 통일 등에 활용 |
| `entityPrefix` | 테이블 prefix | 멀티테넌트보다 단순 구분용에 적합 |
| `dropSchema` | 시작 시 스키마 삭제 | 테스트/개발 전용 |
| `synchronize` | 엔티티 기준 스키마 동기화 | 운영 금지 |
| `migrations` | 마이그레이션 파일 | 운영 필수 |
| `migrationsRun` | 시작 시 자동 실행 | 운영 자동화 시 신중 |
| `cache` | 쿼리 캐시 | 읽기 집중 서비스에서 유용 |
| `maxQueryExecutionTime` | 느린 쿼리 로깅 기준 | 성능 관측에 유용 |
| `invalidWhereValuesBehavior` | null/undefined 처리 | v1에서 특히 중요 |

### 특히 중요한 옵션

**`synchronize`**  
개발에서는 빠르지만, 운영에서는 스키마 손상/의도치 않은 변경 위험이 있다.

**`dropSchema`**  
테스트에서는 편하지만, 잘못된 환경 변수와 만나면 치명적이다.

**`entitySkipConstructor`**  
읽기 시 constructor를 건너뛸 수 있지만, default 값이나 private 상태 초기화에 의존하면 오동작할 수 있다.

### NestJS 조합 포인트

Nest의 `TypeOrmModule.forRoot()` 옵션에는 TypeORM 옵션 외에 `autoLoadEntities`, `retryAttempts`, `retryDelay` 같은 Nest 전용 보조 옵션이 붙는다.

### Trade-off

| 선택 | 장점 | 단점 |
|------|------|------|
| `entities: [User, Post]` 직접 등록 | 명시적, 추적 쉬움 | 파일이 많아지면 번거로움 |
| glob 패턴 등록 | 설정이 간단 | 빌드 산출물 중복 로딩 실수 가능 |
| `autoLoadEntities` 사용 | Nest 모듈화에 편함 | 등록 경로가 덜 명시적 |

### 운영형 PostgreSQL 예제

```typescript
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + "/entities/*.entity.{js,ts}"],
  migrations: [__dirname + "/migrations/*.{js,ts}"],
  synchronize: false,
  logging: ["error", "warn"],
  maxQueryExecutionTime: 500,
  invalidWhereValuesBehavior: {
    null: "throw",
    undefined: "throw",
  },
});
```

---

## DataSource API — 어디까지 할 수 있나

`DataSource`는 단순 연결 객체가 아니라, ORM 운영용 런타임 API의 허브다.

### 자주 쓰는 멤버

- `manager`
- `getRepository()`
- `getTreeRepository()`
- `getMongoRepository()`
- `transaction()`
- `query()`
- `sql`
- `createQueryBuilder()`
- `createQueryRunner()`
- `runMigrations()`
- `undoLastMigration()`
- `synchronize()`
- `dropDatabase()`

### 언제 무엇을 쓰나

- **일반 CRUD**: `getRepository()`
- **여러 엔티티를 한 군데서 다룰 때**: `manager`
- **복잡 SQL**: `createQueryBuilder()` 또는 `sql`
- **트랜잭션/저수준 제어**: `transaction()` / `createQueryRunner()`
- **운영 배포 자동화**: `runMigrations()`

### 주의

`query()`는 강력하지만, 드라이버별 placeholder 문법이 다르다. Postgres는 `$1`, MySQL은 `?`, Oracle은 `:1`, MSSQL은 `@0` 스타일이다. 이 차이를 줄이고 싶으면 `sql` 태그가 더 안전하다.

### API 조합 예제

```typescript
const userRepository = AppDataSource.getRepository(User);
const allUsers = await userRepository.find();

const report = await AppDataSource.sql`
  SELECT status, COUNT(*)::int AS count
  FROM users
  GROUP BY status
`;

await AppDataSource.transaction(async (manager) => {
  await manager.update(User, { id: 1 }, { lastLoginAt: new Date() });
});
```

### 멤버별 최소 예제

아래 예제들은 `User`, `Category`, `LogEntry` 엔티티가 이미 정의되어 있다고 가정한다.  
특히 `getTreeRepository()`는 `@Tree()`가 붙은 엔티티가 필요하고, `getMongoRepository()`는 MongoDB용 `DataSource`에서만 동작한다.

#### `manager`

```typescript
const users = await AppDataSource.manager.find(User, {
  where: { isActive: true },
});

const newUser = AppDataSource.manager.create(User, {
  email: "manager@example.com",
  name: "Manager API User",
});
await AppDataSource.manager.save(newUser);
```

#### `getRepository()`

```typescript
const userRepository = AppDataSource.getRepository(User);

const user = await userRepository.findOneBy({ id: 1 });
const created = userRepository.create({
  email: "repo@example.com",
  name: "Repository User",
});
await userRepository.save(created);
```

#### `getTreeRepository()`

```typescript
const categoryTreeRepository = AppDataSource.getTreeRepository(Category);

const roots = await categoryTreeRepository.findRoots();
const fullTree = await categoryTreeRepository.findTrees();
```

#### `getMongoRepository()`

```typescript
// MongoDB 전용 DataSource 예시
const MongoDataSource = new DataSource({
  type: "mongodb",
  url: process.env.MONGO_URL,
  database: "app",
  entities: [LogEntry],
});

await MongoDataSource.initialize();

const logRepository = MongoDataSource.getMongoRepository(LogEntry);
await logRepository.insertOne({ event: "user.login", payload: { userId: 1 } });
const logs = await logRepository.find();
```

#### `transaction()`

```typescript
await AppDataSource.transaction(async (manager) => {
  const user = manager.create(User, {
    email: "tx@example.com",
    name: "Transactional User",
  });
  await manager.save(user);
  await manager.increment(Profile, { userId: user.id }, "loginCount", 1);
});
```

#### `query()`

```typescript
const rows = await AppDataSource.query(
  "SELECT id, email FROM users WHERE is_active = $1",
  [true],
);
```

#### `sql`

```typescript
const rows = await AppDataSource.sql`
  SELECT id, email
  FROM users
  WHERE is_active = ${true}
`;
```

#### `createQueryBuilder()`

```typescript
const users = await AppDataSource
  .createQueryBuilder()
  .select("user")
  .from(User, "user")
  .where("user.createdAt >= :from", { from: new Date("2026-01-01") })
  .orderBy("user.id", "DESC")
  .getMany();
```

#### `createQueryRunner()`

```typescript
const queryRunner = AppDataSource.createQueryRunner();

await queryRunner.connect();
try {
  const now = await queryRunner.query("SELECT NOW()");
  console.log(now);
} finally {
  await queryRunner.release();
}
```

#### `runMigrations()`

```typescript
await AppDataSource.initialize();
await AppDataSource.runMigrations();
```

#### `undoLastMigration()`

```typescript
await AppDataSource.initialize();
await AppDataSource.undoLastMigration();
```

#### `synchronize()`

```typescript
// 개발/테스트에서만 권장
await AppDataSource.initialize();
await AppDataSource.synchronize();
```

#### `dropDatabase()`

```typescript
// 테스트 teardown 같은 상황에서만 사용
await AppDataSource.initialize();
await AppDataSource.dropDatabase();
```

### 위험한 멤버에 대한 태도

- `runMigrations()`는 운영 배포 파이프라인에서 핵심 도구다.
- `undoLastMigration()`는 rollback 수단이지만, 실제 운영에서는 데이터 변화까지 고려해 신중해야 한다.
- `synchronize()`와 `dropDatabase()`는 개발/테스트 전용에 가깝다.

---

## null / undefined WHERE 처리

v1 기준 TypeORM은 `null`, `undefined`를 WHERE 조건에 넣는 문제를 훨씬 엄격하게 다룬다.

### 기본 동작

- 기본값은 `throw`
- 즉, `where: { text: null }`이나 `undefined`를 넣으면 에러를 던진다.

### 왜 중요할까

과거 ORM에서는 `undefined`가 silently ignored 되는 경우가 많았고, 그 결과 **의도치 않은 전체 조회**가 자주 일어났다.

### 안전한 방법

```typescript
where: { deletedAt: IsNull() }
```

### 설정 가능 옵션

- `null: "ignore" | "sql-null" | "throw"`
- `undefined: "ignore" | "throw"`

### 실무 권장

- `null: "throw"`
- `undefined: "throw"`

이 편이 버그를 빨리 드러낸다.

### 중요한 한계

이 옵션은 `Repository.find*`, `EntityManager.find*`, `update`, `delete` 같은 **고수준 API**에만 적용된다.  
`QueryBuilder.where()`에는 적용되지 않는다. QueryBuilder에서는 직접 `IS NULL` 또는 파라미터 처리를 정확히 써야 한다.

### NestJS 조합 포인트

DTO에서 optional 필드가 많으면 `undefined`가 그대로 repository 조건 객체로 흘러가기 쉽다.  
Nest에서는 `ValidationPipe` + DTO 변환 단계에서 조건 객체를 정리한 뒤 repository로 넘기는 습관이 중요하다.

---

## 다중 DataSource, 다중 DB/스키마, 복제

TypeORM은 여러 DataSource를 동시에 둘 수 있고, 일부 드라이버에서는 하나의 DataSource 안에서 여러 DB/스키마를 다룰 수도 있다.

### 가능한 패턴

- **여러 DataSource**: 서비스 분리, 읽기/쓰기 분리, 레거시 연동
- **단일 DataSource + 여러 database**: MySQL/MSSQL 일부 시나리오
- **단일 DataSource + 여러 schema**: Postgres/MSSQL
- **replication**: master/slave 읽기/쓰기 분리

### Trade-off

| 방식 | 장점 | 단점 |
|------|------|------|
| 여러 DataSource | 경계가 명확 | 설정/트랜잭션 관리가 복잡 |
| 하나의 DataSource 안에서 여러 schema | 연결 관리 단순 | DB 종속성이 커짐 |
| replication | 읽기 확장 | read-after-write 일관성 주의 |

### NestJS 조합 포인트

Nest에서는 명명된 connection 또는 주입 토큰으로 관리해야 한다.  
이때 가장 흔한 문제는 **잘못된 connection의 repository를 주입**받는 것이다.

### 예제

```typescript
export const UserDataSource = new DataSource({
  type: "postgres",
  host: process.env.USER_DB_HOST,
  port: 5432,
  username: process.env.USER_DB_USER,
  password: process.env.USER_DB_PASSWORD,
  database: "users",
  entities: [User],
});

export const AuditDataSource = new DataSource({
  type: "postgres",
  host: process.env.AUDIT_DB_HOST,
  port: 5432,
  username: process.env.AUDIT_DB_USER,
  password: process.env.AUDIT_DB_PASSWORD,
  database: "audit",
  entities: [AuditLog],
});
```

> **실무 팁**: 멀티 DB가 필요해도 처음부터 복잡하게 가지 말고, 단일 DataSource로 시작한 뒤 진짜 병목이 드러날 때 분리하라.

---

# Part 3: 엔티티 모델링

---

## Entity와 Column

Entity는 테이블에 매핑되는 클래스다. 모든 Entity는 최소 하나의 PK가 필요하다.

### 기본 PK 전략

- `@PrimaryColumn()`: 직접 값 지정
- `@PrimaryGeneratedColumn()`: 자동 증가
- `@PrimaryGeneratedColumn("uuid")`: UUID
- 복합 PK도 가능

### 특수 컬럼

- `@CreateDateColumn`
- `@UpdateDateColumn`
- `@DeleteDateColumn`
- `@VersionColumn`

### 특수 컬럼 예제

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
} from "typeorm";

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @VersionColumn()
  version: number;
}
```

```typescript
const article = articleRepository.create({ title: "first article" });
await articleRepository.save(article);
// createdAt, updatedAt, version 자동 설정

article.title = "updated article";
await articleRepository.save(article);
// updatedAt 갱신, version 증가

await articleRepository.softDelete(article.id);
// deletedAt 설정
```

### 컬럼 타입 메모

- `bigint`는 JS `number` 범위를 넘어갈 수 있어 문자열로 다뤄질 수 있다.
- enum, array, json/jsonb, spatial, generated column 등은 드라이버 지원 차이가 크다.

### PostgreSQL 시간 컬럼 예제

PostgreSQL을 쓸 때 자주 헷갈리는 타입이 `timestamp`와 `timestamptz`다.

- `timestamp` (`timestamp without time zone`): 시간대 정보 없이 "벽시계 시각"만 저장
- `timestamptz` (`timestamp with time zone`): 실제 시점(instant)을 저장하는 데 더 적합

실무에서는 보통 **서버 이벤트 시간, 생성/수정 시각, 예약 실행 시각**은 `timestamptz`를 더 자주 쓴다.

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class EventSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  // "2026-03-22 14:00" 같은 로컬 시각 자체가 중요한 경우
  @Column({ type: "timestamp without time zone", nullable: true })
  localStartsAt: Date | null;

  // 실제 절대 시점 저장이 중요한 경우
  @Column({ type: "timestamptz" })
  startsAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
```

```typescript
const schedule = scheduleRepository.create({
  localStartsAt: new Date("2026-03-22T14:00:00"),
  startsAt: new Date("2026-03-22T05:00:00.000Z"),
});

await scheduleRepository.save(schedule);
```

### 시간 타입 선택 기준

| 상황 | 추천 타입 |
|------|------|
| 생성/수정 시각, 결제 시각, 로그인 시각 | `timestamptz` |
| "매일 09:00" 같은 로컬 비즈니스 시간 자체 | `timestamp without time zone` 또는 별도 date/time 모델링 |
| 날짜만 필요 | `date` |

### 실무에서 자주 쓰는 column 옵션

- `nullable`
- `default`
- `select: false`
- `unique`
- `update: false`
- `insert: false`
- `transformer`

### 자주 드는 의문

**생성자에 필수 인자를 두면 안 되나?**  
안 된다. ORM이 DB에서 객체를 만들 때 생성자 인자를 알 수 없다. 생성자 인자는 optional이어야 한다.

**엔티티에 비즈니스 메서드를 넣어도 되나?**  
간단한 도메인 규칙은 가능하지만, 저장/조회와 강하게 얽히면 Data Mapper의 장점이 약해진다.

### 최소 예제

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
```

### 값 변환 예제

```typescript
const bigintTransformer = {
  to(value: bigint) {
    return value.toString();
  },
  from(value: string) {
    return BigInt(value);
  },
};

@Column({
  type: "bigint",
  transformer: bigintTransformer,
})
pointBalance: bigint;
```

---

## Embedded Entity

중복 필드를 줄이고 싶을 때는 상속보다 **embedded column**이 더 안전한 경우가 많다.

예: `Name { first, last }`를 여러 엔티티에 재사용.

### 장점

- 조합(composition) 기반
- 공통 속성 묶기에 좋음
- 컬럼 중복 제거

### 단점

- 테이블은 여전히 하나라서, 구조를 과하게 중첩하면 컬럼 이름이 길어지고 복잡해진다.

### 언제 좋은가

- 주소, 이름, 기간 범위, 금액 묶음 같은 값 객체 표현

### 예제

```typescript
class Address {
  @Column()
  city: string;

  @Column()
  street: string;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column(() => Address)
  address: Address;
}
```

---

## Entity Inheritance

TypeORM은 두 가지 큰 방향을 제공한다.

### Concrete Table Inheritance

부모의 컬럼 정의를 상속하지만, 실제 테이블은 자식별로 나뉜다.

### Single Table Inheritance

하나의 테이블에 discriminator 컬럼을 두고 여러 자식 타입을 저장한다.

### Trade-off

| 방식 | 장점 | 단점 |
|------|------|------|
| Concrete Table | 단순, 테이블 분리 명확 | 공통 조회가 번거로움 |
| Single Table | 공통 조회 쉬움 | null 컬럼 증가, 테이블 비대화 |

### 실무 판단

- 자식 타입 차이가 작고 공통 조회가 많다: STI 검토
- 자식 타입 구조 차이가 크다: 개별 테이블이 보통 더 낫다

### Single Table Inheritance 예제

```typescript
@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;
}

@ChildEntity()
export class Article extends Content {
  @Column()
  body: string;
}

@ChildEntity()
export class Video extends Content {
  @Column()
  videoUrl: string;
}
```

---

## Tree Entity

트리 구조는 일반 relation만으로도 만들 수 있지만, TypeORM은 전용 tree 패턴을 지원한다.

### 지원 패턴

| 패턴 | 장점 | 단점 |
|------|------|------|
| Adjacency List | 단순 | 큰 트리 전체 조회가 약함 |
| Nested Set | 읽기 빠름 | 쓰기 비용 큼, 다중 root 불리 |
| Materialized Path | 구현 단순 | path 관리 비용 |
| Closure Table | 읽기/쓰기 균형 | 별도 closure 테이블 필요 |

### 핵심 메서드

- `findTrees`
- `findRoots`
- `findDescendants`
- `findDescendantsTree`
- `findAncestors`
- `findAncestorsTree`

### 실무 권장

대부분은 **Closure Table** 또는 단순 **Adjacency List + 맞춤 쿼리** 중에서 선택하게 된다.

### Closure Table 예제

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Tree,
  TreeChildren,
  TreeParent,
} from "typeorm";

@Entity()
@Tree("closure-table")
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category | null;
}
```

```typescript
const root = categoryRepository.create({ name: "backend" });
await categoryRepository.save(root);

const child = categoryRepository.create({ name: "typeorm", parent: root });
await categoryRepository.save(child);

const trees = await dataSource.getTreeRepository(Category).findTrees();
```

---

## View Entity

`@ViewEntity()`는 DB view를 읽기 모델처럼 다루게 해준다.

### 특징

- `expression` 필수
- 문자열 SQL 또는 QueryBuilder로 정의 가능
- `dependsOn`으로 view 간 의존 순서 제어 가능
- materialized view index는 PostgreSQL에서 일부 지원

### 주의

- parameter binding이 지원되지 않는다.
- 보통 읽기 전용 모델로 생각해야 한다.
- materialized view도 일반 entity처럼 생각하면 안 된다.

### 언제 좋은가

- 통계/집계 조회
- 복잡 조인을 읽기 모델로 분리
- API 응답용 denormalized projection

### NestJS 조합 포인트

Nest에서 CQRS나 read model을 분리할 때 ViewEntity는 꽤 잘 맞는다. 다만 쓰기 모델과 같은 repository 감각으로 다루면 안 된다.

### 예제

```typescript
@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select("post.id", "id")
      .addSelect("post.title", "title")
      .addSelect("author.name", "authorName")
      .from(Post, "post")
      .leftJoin("post.author", "author"),
})
export class PostSummary {
  @ViewColumn()
  id: number;

  @ViewColumn()
  title: string;

  @ViewColumn()
  authorName: string;
}
```

---

## EntitySchema — 데코레이터 없는 정의 방식

`EntitySchema`는 데코레이터 대신 객체로 엔티티 정의를 분리하는 방식이다.

### 장점

- 순수 JS 프로젝트와 잘 맞음
- 메타데이터를 파일로 분리 가능
- 동적 정의, 스키마 조합에 유리

### 단점

- 데코레이터 기반보다 가독성이 떨어질 수 있음
- Nest/TS 프로젝트에서는 보통 덜 자연스럽다

### 언제 고려하나

- JavaScript-only 프로젝트
- 메타데이터를 선언적 JSON/객체 스타일로 관리하고 싶은 경우

### 예제

```typescript
import { EntitySchema } from "typeorm";

export interface Category {
  id: number;
  name: string;
}

export const CategorySchema = new EntitySchema<Category>({
  name: "category",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    name: {
      type: String,
    },
  },
});
```

---

## Decorator Reference — 자주 쓰는 데코레이터 지도

공식 레퍼런스에는 매우 많은 데코레이터가 있다. 실무에서 자주 만나는 것만 추리면 아래와 같다.

### 엔티티 계열

- `@Entity`
- `@ViewEntity`
- `@ChildEntity`
- `@TableInheritance`

### 컬럼 계열

- `@Column`
- `@PrimaryColumn`
- `@PrimaryGeneratedColumn`
- `@CreateDateColumn`
- `@UpdateDateColumn`
- `@DeleteDateColumn`
- `@VersionColumn`
- `@VirtualColumn`

### 인덱스/제약 계열

- `@Index`
- `@Unique`
- `@Check`
- `@Exclusion`

### Relation 계열

- `@OneToOne`
- `@OneToMany`
- `@ManyToOne`
- `@ManyToMany`
- `@JoinColumn`
- `@JoinTable`
- `@RelationId`

### Listener / Subscriber 계열

- `@AfterLoad`
- `@BeforeInsert`
- `@AfterInsert`
- `@BeforeUpdate`
- `@AfterUpdate`
- `@BeforeRemove`
- `@AfterRemove`
- `@BeforeSoftRemove`
- `@AfterSoftRemove`
- `@BeforeRecover`
- `@AfterRecover`
- `@EventSubscriber`

> **정리**: 처음부터 전부 외우지 말고 `Entity`, `Column`, `Relation`, `Index`, `Lifecycle` 5개 묶음으로 나눠 익히는 편이 낫다.

### 대표 엔티티 하나로 보는 데코레이터 묶음

```typescript
import {
  BeforeInsert,
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  RelationId,
  Unique,
  UpdateDateColumn,
  VersionColumn,
  VirtualColumn,
} from "typeorm";

@Entity({ name: "users", orderBy: { createdAt: "DESC" } })
@Index("idx_users_email", ["email"], { unique: true })
@Unique("uq_users_nickname", ["nickname"])
@Check(`"age" >= 0`)
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 30 })
  nickname: string;

  @Column({ type: "int", default: 0 })
  age: number;

  @Column({ type: "varchar", length: 255, select: false })
  passwordHash: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @VersionColumn()
  version: number;

  @VirtualColumn({
    query: (alias) => `SELECT COUNT(*) FROM "posts" WHERE "authorId" = ${alias}.id`,
  })
  postCount: number;

  @OneToMany(() => Post, (post) => post.author)
  posts: Relation<Post[]>;

  @RelationId((user: User) => user.posts)
  postIds: number[];

  @BeforeInsert()
  normalizeEmail() {
    this.email = this.email.trim().toLowerCase();
  }
}
```

### PostgreSQL 전용 데코레이터 예시

```typescript
import { Column, Entity, Exclusion } from "typeorm";

@Entity()
@Exclusion(`USING gist ("room" WITH =, tsrange("startsAt", "endsAt") WITH &&)`)
export class RoomBooking {
  @Column()
  room: string;

  @Column({ type: "timestamptz" })
  startsAt: Date;

  @Column({ type: "timestamptz" })
  endsAt: Date;
}
```

### Subscriber까지 포함한 최소 예제

```typescript
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from "typeorm";

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  afterInsert(event: InsertEvent<User>) {
    console.log("user inserted", event.entity?.id);
  }
}
```

### 데코레이터를 읽을 때의 기준

- `@Unique`와 `@Index({ unique: true })`는 비슷해 보여도 의도가 다르다. 전자는 제약 조건, 후자는 인덱스 관점에 더 가깝다.
- `@RelationId`는 relation의 id를 읽기 좋게 노출하는 용도다. 이 값을 바꾼다고 관계가 바뀌지는 않는다.
- Listener는 엔티티 생명주기 훅이지 서비스 계층을 대체하는 비즈니스 로직 엔진이 아니다.
- `@Exclusion`, `timestamptz`, partial index처럼 드라이버 종속 기능은 PostgreSQL 기준으로 매우 강하지만 다른 DB로 옮길 때 비용이 생긴다.

---

# Part 4: Relation 설계

---

## Relation 옵션과 Cascade

공식 문서에서 relation의 핵심 옵션은 다음과 같다.

- `eager`
- `cascade`
- `onDelete`
- `nullable`
- `orphanedRowAction`

### Cascade에 대한 정확한 태도

Cascade는 편하지만, **의도하지 않은 저장/수정/삭제를 자동 전파**시킬 수 있다.

### orphanedRowAction

- `nullify`
- `delete`
- `soft-delete`
- `disable`

이 옵션은 부모 저장 시 빠진 자식을 어떻게 처리할지 정한다.

### 자주 하는 오해

**`cascade: true`면 다 편해지는가?**  
아니다. 편리함 대신 명시성을 잃는다. 특히 외부 입력 DTO를 엔티티에 바로 매핑하면 보안/무결성 문제를 만들기 쉽다.

### NestJS 조합 포인트

컨트롤러 DTO를 그대로 엔티티 그래프에 박아 넣고 `save()` 하는 패턴은 위험하다.  
Nest에서는 DTO → 명시적 엔티티 생성/매핑 → 필요한 relation만 연결하는 흐름이 훨씬 안전하다.

### Cascade 예제

```typescript
@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: ["insert"],
    orphanedRowAction: "delete",
  })
  items: OrderItem[];
}

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productName: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  order: Order;
}
```

```typescript
const order = new Order();
order.items = [
  Object.assign(new OrderItem(), { productName: "keyboard" }),
  Object.assign(new OrderItem(), { productName: "mouse" }),
];
await orderRepository.save(order);
```

---

## One-to-One

`@OneToOne`에서는 `@JoinColumn()`이 붙은 쪽이 owner side다. FK도 그쪽 테이블에 생긴다.

### 핵심 포인트

- `@JoinColumn`은 한쪽에만 둔다.
- uni-directional / bi-directional 모두 가능
- `find` 계열에서는 `relations`를 명시해야 한다.

### 설계 질문

**진짜 1:1이 맞는가?**  
많은 경우 논리적으로는 1:1처럼 보여도, 시간이 지나면 1:N 또는 optional relation이 된다. 너무 빨리 1:1로 못 박지 않는 게 좋다.

### 최소 예제

```typescript
@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bio: string;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @OneToOne(() => UserProfile, { cascade: ["insert"] })
  @JoinColumn()
  profile: UserProfile;
}
```

```typescript
const user = userRepository.create({
  email: "alice@example.com",
  profile: { bio: "backend developer" },
});
await userRepository.save(user);
```

---

## Many-to-One / One-to-Many

실무에서 가장 자주 쓰는 relation이다.

### 핵심 규칙

- `@ManyToOne` 쪽에 FK가 생긴다.
- `@OneToMany`는 단독으로 존재할 수 없고, 반대편 `@ManyToOne`이 필요하다.
- 반대로 `@ManyToOne`은 단독으로도 가능하다.

### 실무 팁

조회 위주라면 `ManyToOne`만 두고 역방향 `OneToMany`를 생략하는 것도 좋은 선택이다.  
양방향 relation은 편하지만, 메모리 구조와 직렬화 복잡도를 키운다.

### 최소 예제

```typescript
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.posts, { nullable: false })
  author: User;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
```

```typescript
const posts = await postRepository.find({
  relations: { author: true },
  order: { id: "DESC" },
});
```

---

## Many-to-Many

`@ManyToMany`는 중간 junction table을 자동 생성한다.

### 핵심 규칙

- owner side 한쪽에만 `@JoinTable()`
- relation 제거는 junction row만 제거하는 것
- 엔티티 자체 삭제와는 다르다

### 정말 중요한 FAQ

**중간 테이블에 추가 컬럼이 필요하면?**  
자동 many-to-many를 쓰면 안 된다. 중간 엔티티를 직접 만들고 `ManyToOne + ManyToOne` 두 개로 모델링해야 한다.

예: `UserCourse`에 `enrolledAt`, `role`, `status` 같은 컬럼이 필요하면 별도 entity가 정답이다.

### 자동 many-to-many 예제

```typescript
@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;
}

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Course, { cascade: ["insert"] })
  @JoinTable()
  courses: Course[];
}
```

### 추가 컬럼이 필요한 실무형 예제

```typescript
@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: "CASCADE" })
  student: Student;

  @ManyToOne(() => Course, { nullable: false, onDelete: "CASCADE" })
  course: Course;

  @Column({ default: "student" })
  role: string;

  @CreateDateColumn()
  enrolledAt: Date;
}
```

---

## Eager vs Lazy Loading

공식 문서도 이 부분을 꽤 신중하게 다룬다.

### Eager

- `find*`에서 자동 로딩
- QueryBuilder에서는 비활성화
- 양쪽 모두 eager는 불가

### Lazy

- `Promise<T>` 형태
- 접근 시 쿼리
- Node/TS에서는 실험적 성격이 강함

### Trade-off

| 방식 | 장점 | 단점 |
|------|------|------|
| Eager | 편함 | 항상 가져와서 과조회 가능 |
| Lazy | 필요 시 조회 | N+1 유발, 추론 어려움 |
| 명시적 relations / join | 예측 가능 | 코드가 길어짐 |

### 실무 권장

대부분의 백엔드 API에서는 **명시적 `relations` 또는 QueryBuilder join**이 가장 예측 가능하다.  
Lazy loading은 실수로 쿼리가 폭증하기 쉬워 신중해야 한다.

### Eager 예제

```typescript
@ManyToOne(() => User, { eager: true })
author: User;

const posts = await postRepository.find();
// author가 자동으로 로딩된다
```

### Lazy 예제

```typescript
@ManyToMany(() => Tag)
@JoinTable()
tags: Promise<Tag[]>;

const post = await postRepository.findOneBy({ id: 1 });
const tags = await post!.tags;
```

---

## Relations FAQ — 자주 헷갈리는 지점

### Self-reference

카테고리 트리처럼 자기 자신을 참조할 수 있다.

### relation id만 갖고 싶을 때

relation column 이름과 동일한 FK 컬럼을 직접 두면, 관계 엔티티를 join하지 않아도 id를 다룰 수 있다.

### relation property initializer 금지

```typescript
categories: Category[] = [];
```

이 패턴은 loaded entity를 저장할 때 **관계가 비어 있다고 오해**하게 만들 수 있어 문제를 일으킨다.

### FK 생성 비활성화

일부 케이스에서는 relation은 유지하되 실제 FK 제약은 만들지 않도록 조절할 수 있다. 하지만 무결성 책임이 앱으로 넘어온다는 뜻이므로 신중해야 한다.

### 순환 import

relation이 많아지면 circular import 에러가 잦다. 파일 구조와 import 경계를 정리해야 한다.

---

# Part 5: 데이터 접근 계층

---

## EntityManager

`EntityManager`는 모든 엔티티 repository를 한 군데 모아 둔 상위 인터페이스에 가깝다.

### 언제 쓰나

- 여러 엔티티를 공통 흐름으로 다룰 때
- 트랜잭션 내부에서 제공된 manager를 사용할 때

### 핵심 메시지

트랜잭션 안에서는 **반드시 전달받은 transactional manager**를 써야 한다.  
이건 TypeORM 공식 문서에서 가장 강하게 강조하는 제한 중 하나다.

### 예제

```typescript
await dataSource.transaction(async (manager) => {
  const user = await manager.findOneBy(User, { id: 1 });
  if (!user) throw new Error("user not found");

  user.name = "updated name";
  await manager.save(user);
});
```

---

## Repository

`Repository<T>`는 특정 엔티티 전용 데이터 접근 객체다.

### 장점

- 엔티티 단위 책임 분리
- 테스트하기 좋음
- 서비스 계층과 자연스럽게 결합

### 종류

- `Repository`
- `TreeRepository`
- `MongoRepository`

### NestJS 조합 포인트

Nest에서는 `@InjectRepository(User)`로 주입받는 이 계층이 사실상 TypeORM 활용의 표준이다.

### 서비스 예제

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findActiveUsers() {
    return this.usersRepository.find({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  async create(input: CreateUserDto) {
    const user = this.usersRepository.create(input);
    return this.usersRepository.save(user);
  }
}
```

---

## Find Options

간단한 조회는 `QueryBuilder`까지 갈 필요 없이 `find*` 옵션으로 충분하다.

### 자주 쓰는 옵션

- `select`
- `relations`
- `where`
- `order`
- `withDeleted`
- `skip`
- `take`
- `cache`
- `lock`

### Trade-off

| 방식 | 장점 | 단점 |
|------|------|------|
| `find` 옵션 | 간단, 선언적 | 복잡 조인/세밀한 제어 한계 |
| QueryBuilder | 유연함 | 코드가 길고 실수 지점 증가 |

### 주의

- MSSQL에서 `skip/take`는 `order` 없이 쓰면 문제를 일으킬 수 있다.
- soft delete 엔티티는 기본적으로 제외된다. 필요하면 `withDeleted`.

### 예제

```typescript
const users = await userRepository.find({
  select: {
    id: true,
    name: true,
    email: true,
  },
  relations: {
    profile: true,
  },
  where: {
    isActive: true,
    profile: {
      locale: "ko-KR",
    },
  },
  order: {
    createdAt: "DESC",
  },
  skip: 0,
  take: 20,
});
```

### 연산자 예제

공식 문서는 `findBy()`와 `where` 안에서 쓸 수 있는 비교 연산자를 꽤 많이 제공한다.  
초반에는 QueryBuilder로 바로 내려가기보다, 이 연산자들만 익혀도 상당수 조회를 처리할 수 있다.

```typescript
import {
  Between,
  ILike,
  In,
  IsNull,
  Like,
  Not,
  Raw,
} from "typeorm";

const posts = await postRepository.findBy({
  title: Not("임시 글"),
  category: In(["typeorm", "nestjs"]),
  summary: Like("%ORM%"),
  body: ILike("%transaction%"),
  publishedAt: Between(
    new Date("2026-03-01T00:00:00.000Z"),
    new Date("2026-03-31T23:59:59.999Z"),
  ),
  deletedAt: IsNull(),
});
```

```typescript
const users = await userRepository.findBy({
  email: Raw((alias) => `LOWER(${alias}) = LOWER(:email)`, {
    email: "Alice@example.com",
  }),
});
```

### 언제 어떤 연산자를 먼저 떠올리면 좋은가

- `Not()`: 특정 상태 하나만 제외하고 싶을 때
- `In()`: id 목록, enum 목록처럼 집합 조건일 때
- `Like()`: 대소문자 구분 패턴 검색이 필요할 때
- `ILike()`: Postgres에서 대소문자 무시 검색이 필요할 때
- `Between()`: 날짜 범위, 점수 범위처럼 양끝이 명확할 때
- `Raw()`: DB 함수나 계산식을 꼭 써야 할 때

### `Raw()`의 trade-off

- 장점: SQL 함수를 바로 태울 수 있어 유연하다.
- 단점: DB 종속성이 커지고 SQL injection 실수 여지가 생긴다.
- 원칙: 문자열 결합 대신 반드시 바인딩 파라미터를 사용한다.

### `lock` 예제

공식 문서 기준 `lock` 옵션은 `findOne`, `findOneBy`에서만 쓸 수 있다.

```typescript
const order = await orderRepository.findOne({
  where: { id: orderId },
  lock: {
    mode: "optimistic",
    version: 7,
  },
});
```

```typescript
const payment = await paymentRepository.findOne({
  where: { id: paymentId },
  lock: {
    mode: "pessimistic_write",
    onLocked: "nowait",
  },
});
```

### `lock` 주의

- optimistic lock은 `@VersionColumn` 또는 날짜 기반 version 값과 함께 쓴다.
- pessimistic lock은 실무에서는 transaction 안에서 써야 의미가 있다.
- DB마다 지원 lock mode가 다르므로, 복잡한 락은 `QueryBuilder` 예제까지 같이 보는 편이 안전하다.

---

## Custom Repository

TypeORM v1 기준 custom repository는 과거 `@EntityRepository` 방식이 아니라 `Repository.extend()` 패턴이 핵심이다.

### 장점

- 반복 쿼리 로직 재사용
- 도메인별 저장소 메서드 정의 가능

### 가장 중요한 주의점

트랜잭션 안에서 전역 custom repository를 그대로 쓰면 안 된다.  
반드시 transaction manager의 `withRepository()`를 사용해야 한다.

```typescript
await dataSource.transaction(async (manager) => {
  const userRepository = manager.withRepository(UserRepository);
  await userRepository.findByName("Alice", "Kim");
});
```

```typescript
// user.repository.ts
export const UserRepository = dataSource.getRepository(User).extend({
  findByName(name: string) {
    return this.createQueryBuilder("user")
      .where("user.name = :name", { name })
      .getMany();
  },
});
```

---

## EntityManager API / Repository API 핵심 메서드

두 API는 매우 비슷하다.

### 자주 쓰는 메서드

- `create`
- `merge`
- `preload`
- `save`
- `remove`
- `insert`
- `update`
- `updateAll`
- `upsert`
- `delete`
- `softDelete`
- `restore`
- `exists`
- `count`
- `increment`
- `decrement`
- `clear`

### 메서드 선택 기준

| 메서드 | 특징 |
|------|------|
| `save` | insert/update 자동 판단, 편하지만 무거울 수 있음 |
| `insert` | 순수 insert, 빠름 |
| `update` | 순수 update, 빠름, 엔티티 lifecycle 기대하면 안 됨 |
| `preload` | partial update 준비에 유용 |
| `upsert` | conflict 기반 insert-or-update |

### 실무 판단

- 단순 생성: `insert`
- 단순 수정: `update`
- 엔티티 그래프 저장: `save`
- 외부 시스템 동기화: `upsert`

### 자주 드는 의문

**왜 `save()`보다 `insert()/update()`가 빠른가?**  
`save()`는 상태 판단과 엔티티 처리 비용이 더 크다. 성능 민감 구간에서는 더 구체적인 메서드가 낫다.

### 생성/병합 계열 예제

```typescript
const user = userRepository.create({
  email: "create@example.com",
  name: "Create User",
});

userRepository.merge(user, { name: "Merged User" });
await userRepository.save(user);

const preloaded = await userRepository.preload({
  id: user.id,
  name: "Preloaded User",
});
if (preloaded) {
  await userRepository.save(preloaded);
}
```

### 직접 쓰기 계열 예제

```typescript
await userRepository.insert({
  email: "insert@example.com",
  name: "Inserted User",
});

await userRepository.update(
  { email: "insert@example.com" },
  { name: "Updated By Repository.update" },
);

await userRepository.updateAll({
  isActive: true,
});
```

### upsert 예제

```typescript
await userRepository.upsert(
  [
    { email: "alice@example.com", name: "Alice" },
    { email: "bob@example.com", name: "Bob" },
  ],
  ["email"],
);
```

### 삭제/복구 계열 예제

```typescript
await userRepository.softDelete({ email: "alice@example.com" });
await userRepository.restore({ email: "alice@example.com" });
await userRepository.delete({ email: "bob@example.com" });
```

### 조회/집계/증감 계열 예제

```typescript
const exists = await userRepository.exists({
  where: { email: "alice@example.com" },
});

const total = await userRepository.count({
  where: { isActive: true },
});

await userRepository.increment({ id: 1 }, "loginCount", 1);
await userRepository.decrement({ id: 1 }, "credit", 100);
```

### `clear()` 예제

```typescript
// 테스트 데이터 초기화 등에 사용
await userRepository.clear();
```

---
