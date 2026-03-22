---
title: TypeORM Advanced Guide
date: '2026-03-22'
tags:
- backend/typeorm
- backend/query-builder
- backend/drivers
- backend/performance
- backend/advanced
- typescript/library
description: QueryBuilder, QueryRunner, Driver, FAQ, 릴리스 노트까지 포함한 TypeORM 심화 분할 가이드
slug: typeorm-advanced-guide
---

# TypeORM Advanced Guide

쿼리 제어, 드라이버 차이, FAQ, 릴리스 노트처럼 한 단계 깊은 내용을 모아둔 분할본이다. 범위는 Part 6, Part 8, Part 9다.

## 읽기 경로

- [Core](https://devholic.me/posts/typeorm-core-guide)
- [Advanced](https://devholic.me/posts/typeorm-advanced-guide)
- [Operations](https://devholic.me/posts/typeorm-operations-guide)
- [NestJS](https://devholic.me/posts/typeorm-nestjs-guide)
- [Guide Hub](https://devholic.me/posts/typeorm-beginner-guide)

## 함께 읽기

- [NestJS Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide): `QueryRunner`, subscriber, migration을 Nest 앱 구조 안에서 적용할 때
- [NestJS Advanced Guide](https://devholic.me/posts/nestjs-advanced-guide): testing, e2e, 운영 장애와 연결해서 읽을 때

## 이 문서에서 다루는 섹션

### Part 6: Query와 실행 제어

- [Select QueryBuilder](#select-querybuilder)
- [Insert / Update / Delete QueryBuilder](#insert-/-update-/-delete-querybuilder)
- [RelationQueryBuilder](#relationquerybuilder)
- [Caching](#caching)
- [QueryRunner](#queryrunner)
- [Transaction](#transaction)
- [Lock 모드](#lock-모드)
- [Logging](#logging)
- [Entity Listener / Subscriber](#entity-listener-/-subscriber)
- [N+1 문제](#n+1-문제)
- [성능 최적화](#성능-최적화)
- [SQL Tag](#sql-tag)

### Part 8: 드라이버와 플랫폼

- [Postgres / CockroachDB](#postgres-/-cockroachdb)
- [MySQL / MariaDB](#mysql-/-mariadb)
- [SQLite 계열](#sqlite-계열)
- [Microsoft SQL Server](#microsoft-sql-server)
- [MongoDB](#mongodb)
- [Oracle](#oracle)
- [SAP HANA](#sap-hana)
- [Google Spanner](#google-spanner)
- [지원 플랫폼](#지원-플랫폼)

### Part 9: 가이드, FAQ, 릴리스 노트

- [Validation](#validation)
- [Express 예제와 JavaScript 사용](#express-예제와-javascript-사용)
- [Sequelize에서 옮길 때](#sequelize에서-옮길-때)
- [FAQ](#faq)
- [Support](#support)
- [v1 Migration Guide](#v1-migration-guide)
- [TypeORM 1.0 Release Notes](#typeorm-1.0-release-notes)
- [Roadmap](#roadmap)

# Part 6: Query와 실행 제어

---

## Select QueryBuilder

`QueryBuilder`는 TypeORM의 핵심 무기다.

### 강한 점

- 조인
- 그룹화
- 서브쿼리
- raw result
- pagination
- lock
- CTE
- 숨김 컬럼 포함 조회
- soft-deleted row 포함 조회
- Postgres 전용 기능(`DISTINCT ON`, time travel 일부 등)

### 핵심 메서드

- `getOne`, `getOneOrFail`
- `getMany`
- `getRawOne`, `getRawMany`
- `getCount`
- `getSql`, `getQuery`
- `stream`

### 매우 중요한 주의점

WHERE 파라미터 이름을 중복해서 쓰면 안 된다.  
`sheepId`, `cowId`처럼 각각 고유 이름을 써야 한다.

### 언제 QueryBuilder를 써야 하나

- relation join이 복잡하다
- where 조건이 동적이다
- raw aggregate가 필요하다
- 정교한 락/CTE/driver-specific SQL이 필요하다

### 최소 예제

```typescript
const posts = await dataSource
  .getRepository(Post)
  .createQueryBuilder("post")
  .leftJoinAndSelect("post.author", "author")
  .where("author.id = :authorId", { authorId: 1 })
  .orderBy("post.id", "DESC")
  .take(10)
  .getMany();
```

### 집계 예제

```typescript
const summaries = await dataSource
  .getRepository(Post)
  .createQueryBuilder("post")
  .select("author.id", "authorId")
  .addSelect("author.name", "authorName")
  .addSelect("COUNT(post.id)", "postCount")
  .innerJoin("post.author", "author")
  .groupBy("author.id")
  .addGroupBy("author.name")
  .getRawMany();
```

---

## Insert / Update / Delete QueryBuilder

공식 문서도 이 경로를 **가장 성능 좋은 bulk 작업 방식**으로 설명한다.

### Insert

- bulk insert에 유리
- `orUpdate`
- `orIgnore`
- `skipUpdateIfNoValuesChanged`
- partial index predicate
- `valuesFromSelect()` 지원

### Update

- 대량 업데이트에 유리
- raw SQL 식도 일부 허용 가능

### Delete / Soft Delete / Restore

- 대량 삭제/복원에 효율적

### 주의

`valuesFromSelect()`는 엔티티 인스턴스를 만들지 않으므로 listener/subscriber가 실행되지 않는다.  
즉, ORM lifecycle을 기대하면 안 된다.

### Insert / Upsert 예제

```typescript
await dataSource
  .createQueryBuilder()
  .insert()
  .into(User)
  .values([
    { email: "alice@example.com", name: "Alice" },
    { email: "bob@example.com", name: "Bob" },
  ])
  .orUpdate(["name"], ["email"])
  .execute();
```

### Soft delete 예제

```typescript
await dataSource
  .getRepository(User)
  .createQueryBuilder()
  .softDelete()
  .where("id = :id", { id: 10 })
  .execute();
```

---

## RelationQueryBuilder

관계 자체를 조작할 때 매우 강력하다.

### 가능한 작업

- `add`
- `remove`
- `set`
- `loadOne`
- `loadMany`

### 장점

거대한 relation 컬렉션을 전부 읽어와 `save()` 하지 않아도 된다.  
즉, **중간 관계만 조작할 때 매우 효율적**이다.

### 좋은 사용 예

- 대규모 many-to-many 연결 추가/제거
- user-role 연결 관리
- category-post 바인딩

### 예제

```typescript
await dataSource
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(1)
  .add(3);

await dataSource
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(1)
  .remove(3);

await dataSource
  .createQueryBuilder()
  .relation(Post, "author")
  .of(1)
  .set(10);

const categories = await dataSource
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(1)
  .loadMany();

const author = await dataSource
  .createQueryBuilder()
  .relation(Post, "author")
  .of(1)
  .loadOne();
```

---

## Caching

TypeORM은 `find*`, `count*`, QueryBuilder 결과 캐시를 지원한다.

### 핵심 포인트

- 기본 캐시 TTL은 짧다.
- DB table 캐시 또는 Redis/ioredis 사용 가능
- cache id를 주면 세밀한 무효화 가능

### Trade-off

| 장점 | 단점 |
|------|------|
| 읽기 성능 향상 | stale data 위험 |
| 단순 캐시 적용 가능 | 무효화 전략 필요 |
| Redis 연동 가능 | 캐시 장애 처리 필요 |

### 실무 팁

캐시는 “ORM 기능”이라기보다 “조회 정책”이다.  
조회 패턴이 명확하고 stale 허용 범위가 있을 때만 쓰는 편이 좋다.

### QueryBuilder 캐시 예제

```typescript
const users = await dataSource
  .getRepository(User)
  .createQueryBuilder("user")
  .where("user.isActive = :isActive", { isActive: true })
  .cache("active_users", 60_000)
  .getMany();
```

### Repository 캐시 예제

```typescript
const users = await userRepository.find({
  where: { isActive: true },
  cache: {
    id: "active_users",
    milliseconds: 60_000,
  },
});

await dataSource.queryResultCache?.remove(["active_users"]);
```

---

## QueryRunner

`QueryRunner`는 **하나의 실제 DB connection**을 붙잡고 작업하는 저수준 도구다.

### 언제 필요하나

- 트랜잭션을 더 세밀하게 제어
- 여러 쿼리를 동일 connection에서 강제 실행
- migration 내부 schema 조작

### 핵심 규칙

- 사용 후 반드시 `release()`
- release 이후 재사용 불가
- 자체 `manager`를 가짐

### 최신 포인트

explicit resource management, 즉 `await using` 패턴도 지원한다.

### 예제

```typescript
const queryRunner = dataSource.createQueryRunner();

await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.insert(User, {
    email: "runner@example.com",
    name: "Runner User",
  });

  await queryRunner.manager.update(Profile, { userId: 1 }, { locale: "ko-KR" });
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

---

## Transaction

공식 문서에서 가장 강하게 강조하는 원칙:

> **트랜잭션 안에서는 전달된 manager만 사용하라. 전역 manager/repository를 섞지 마라.**

### 두 가지 방법

1. `dataSource.transaction(async manager => ...)`
2. `QueryRunner`로 수동 제어

### Isolation Level

표준 격리 수준은 주로 MySQL, Postgres, MSSQL이 잘 지원한다.  
SQLite와 Oracle은 제약이 있다.

### Trade-off

| 방식 | 장점 | 단점 |
|------|------|------|
| callback transaction | 간단 | 세밀 제어 약함 |
| QueryRunner | 완전 제어 | 코드 길고 release 책임 필요 |

### NestJS 조합 포인트

서비스 메서드 안에서 repository 여러 개를 섞어 쓰다가 transaction manager를 놓치기 쉽다.  
Nest에서는 “트랜잭션 경계 메서드”를 분리해두는 편이 유지보수에 유리하다.

### Spring/JPA의 `REQUIRED` / `NESTED` / `REQUIRES_NEW`와 비교하면

TypeORM에는 Spring처럼 `@Transactional(propagation = ...)` 형태의 **전파 속성 API가 없다.**  
대신 현재 공식 문서와 공식 소스 기준으로 아래처럼 이해하는 편이 가장 정확하다.

| Spring/JPA 감각 | TypeORM에서 가까운 형태 | 핵심 차이 |
|------|------|------|
| `REQUIRED` | 일반 `dataSource.transaction(...)` | 바깥 트랜잭션 전파를 선언적으로 고르진 못함 |
| `NESTED` | **같은 `QueryRunner`** 안에서 다시 `manager.transaction(...)` 호출 | savepoint 기반, 같은 물리 트랜잭션 |
| `REQUIRES_NEW` | **새 `QueryRunner` / 새 `dataSource.transaction(...)`** 로 별도 시작 | 자동 suspend/resume 없음, 수동으로 분리해야 함 |

### 왜 이렇게 보나

- 공식 문서상 `EntityManager.transaction()`은 이미 `queryRunner`가 있으면 그것을 재사용한다.
- 공식 저장소 소스상 `BaseQueryRunner`는 `transactionDepth`를 갖고, Postgres/MySQL/SQLite는 depth가 1보다 크면 `SAVEPOINT`, `RELEASE SAVEPOINT`, `ROLLBACK TO SAVEPOINT`를 쓴다.
- 즉, **같은 query runner 안의 중첩 transaction은 새 물리 트랜잭션이 아니라 savepoint**다.
- 반대로 `dataSource.transaction()`은 global manager에서 새 query runner를 만들기 때문에, 바깥 transaction manager를 일부러 넘기지 않으면 **별도 connection/별도 transaction**이 된다.

### `NESTED`에 가까운 예시: savepoint

```typescript
await dataSource.transaction(async (outerManager) => {
  await outerManager.insert(User, { email: "outer@example.com" });

  await outerManager.transaction(async (innerManager) => {
    await innerManager.insert(Profile, { nickname: "nested" });
  });
});
```

이 패턴은 Spring의 `NESTED`에 더 가깝다.

- 같은 물리 트랜잭션이다.
- 내부 실패는 savepoint까지 롤백할 수 있다.
- 바깥 트랜잭션이 최종 롤백되면 안쪽 작업도 결국 함께 사라진다.

### `REQUIRES_NEW`에 가까운 예시: 새 transaction을 명시적으로 시작

```typescript
await dataSource.transaction(async (outerManager) => {
  const order = outerManager.create(Order, {
    userId: 1,
    status: "PENDING",
    publicId: "ord_20260322_001",
  });
  await outerManager.save(order);

  await dataSource.transaction(async (innerManager) => {
    await innerManager.insert(AuditLog, {
      event: "ORDER_CREATED",
      orderPublicId: order.publicId,
    });
  });

  throw new Error("force outer rollback");
});
```

이 코드는 의도가 분명하다.

- 바깥 `outerManager`는 주문 저장용 트랜잭션
- 안쪽 `dataSource.transaction(...)`은 별도 query runner를 쓰는 새 트랜잭션

즉, Spring의 `REQUIRES_NEW`에 **가장 가까운 수동 패턴**이다.

### 이 패턴의 실제 의미

- inner transaction이 commit된 뒤 outer transaction이 rollback되어도, inner 쪽은 남을 수 있다.
- 따라서 감사 로그, 실패 이력, outbox 기록처럼 “메인 비즈니스 롤백과 분리해서 남겨야 하는 데이터”에 유용하다.
- 하지만 TypeORM이 Spring처럼 기존 transaction context를 자동 suspend/resume 해주지는 않는다.
- 단, inner transaction은 outer transaction의 미커밋 row를 직접 읽거나 FK로 참조하면 안 될 수 있다. 이런 경우엔 public id, correlation id, request id 같은 독립 키를 쓰는 편이 안전하다.

### 매우 중요한 주의점

```typescript
// REQUIRES_NEW처럼 보이지만 실제로는 아님
await dataSource.transaction(async (outerManager) => {
  await dataSource.transaction(async () => {
    await outerManager.insert(AuditLog, { event: "WRONG" });
  });
});
```

위 코드는 안쪽에 새 transaction을 열었더라도, 실제 write를 `outerManager`로 하고 있으므로 의미가 완전히 달라진다.  
새 트랜잭션 안에서는 **반드시 그 트랜잭션이 제공한 manager/repository만 사용해야 한다.**

### 언제 `REQUIRES_NEW` 유사 패턴을 쓰는가

- 감사 로그는 남기고 본업 트랜잭션은 실패시킬 수 있어야 할 때
- 주문 실패 여부와 관계없이 “실패 이벤트” 자체는 기록해야 할 때
- outbox/event relay 테이블을 메인 write와 분리해야 할 때

### 언제 조심해야 하나

- inner transaction이 outer transaction의 **미커밋 데이터**를 읽어야 할 때
- 두 transaction이 같은 row를 만지며 lock 경쟁을 일으킬 수 있을 때
- connection pool이 작아 새 query runner 확보가 병목이 될 때
- “그냥 중첩 호출했으니 REQUIRES_NEW겠지”라고 착각할 때

### NestJS에서 자주 쓰는 helper 패턴

```typescript
@Injectable()
export class TransactionHelper {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  runInNewTransaction<T>(work: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction(work);
  }
}
```

```typescript
await this.dataSource.transaction(async (manager) => {
  await manager.save(order);

  await this.transactionHelper.runInNewTransaction(async (newManager) => {
    await newManager.insert(AuditLog, {
      event: "ORDER_ATTEMPTED",
      orderPublicId: order.publicId,
    });
  });
});
```

### 실무 판단

- 서비스 내부에서 그냥 `manager.transaction(...)`을 다시 부르면 대개 savepoint다.
- 정말 `REQUIRES_NEW`가 필요하면 **새 manager / 새 query runner / 새 connection**이라는 점이 코드에서 분명히 보여야 한다.
- Spring의 declarative propagation과 TypeORM의 manual composition은 철학이 다르다. TypeORM에서는 “전파 옵션 선택”보다 “어느 manager를 쓰고 있는가”가 진짜 핵심이다.

### callback transaction 예제

```typescript
await dataSource.transaction("READ COMMITTED", async (manager) => {
  const order = manager.create(Order, { userId: 1, totalPrice: 5000 });
  await manager.save(order);

  await manager.decrement(Product, { id: 3 }, "stock", 1);
});
```

### 잘못된 예 / 올바른 예

```typescript
// 잘못된 예
await dataSource.transaction(async (manager) => {
  await manager.save(order);
  await this.productRepository.decrement({ id: 3 }, "stock", 1);
});

// 올바른 예
await dataSource.transaction(async (manager) => {
  await manager.save(order);
  await manager.decrement(Product, { id: 3 }, "stock", 1);
});
```

---

## Lock 모드

공식 문서 기준 `QueryBuilder`는 optimistic/pessimistic lock을 모두 지원한다.  
지원하지 않는 lock mode를 쓰면 `LockNotSupportedOnGivenDriverError`가 날 수 있다.

### 언제 필요한가

- 재고 차감, 결제 승인처럼 동시 수정 충돌을 막아야 할 때
- 워커가 같은 작업 row를 동시에 집지 않게 해야 할 때
- 낙관적 버전 충돌을 감지하고 재시도 전략을 두고 싶을 때

### Optimistic Lock

`@VersionColumn` 또는 업데이트 시각 기반 version 값과 함께 쓴다.

```typescript
const order = await dataSource.getRepository(Order).findOne({
  where: { id: orderId },
  lock: {
    mode: "optimistic",
    version: currentVersion,
  },
});
```

```typescript
@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @VersionColumn()
  version: number;

  @Column()
  status: string;
}
```

### Pessimistic Write Lock

```typescript
await dataSource.transaction(async (manager) => {
  const job = await manager
    .getRepository(Job)
    .createQueryBuilder("job")
    .where("job.status = :status", { status: "PENDING" })
    .orderBy("job.id", "ASC")
    .setLock("pessimistic_write")
    .getOne();

  if (!job) {
    return null;
  }

  job.status = "PROCESSING";
  await manager.save(job);
  return job;
});
```

### `nowait` / `skip_locked`

대기하지 않고 바로 실패시키거나, 이미 잠긴 row를 건너뛸 수도 있다.

```typescript
const jobs = await dataSource
  .getRepository(Job)
  .createQueryBuilder("job")
  .where("job.status = :status", { status: "PENDING" })
  .setLock("pessimistic_write")
  .setOnLocked("skip_locked")
  .take(10)
  .getMany();
```

> **실무 추론**: `skip_locked`는 공식 문서의 lock API 위에 얹는 운영 패턴이다.  
> 배치 워커, 큐 소비, 잡 분배에 특히 잘 맞지만, "모든 대상을 즉시 빠짐없이 처리해야 하는 화면성 조회"와는 성격이 다르다.

### Trade-off

| 방식 | 장점 | 단점 |
|------|------|------|
| optimistic | 락 대기가 없어 가볍다 | 충돌 시 재시도 로직 필요 |
| pessimistic | 충돌을 강하게 막는다 | 대기, 교착, pool 점유 비용 |

### 실무 판단

> **실무 추론**: 아래 판단 기준은 공식 lock API와 DB 락 동작을 바탕으로 정리한 운영 가이드다.  
> 공식 문서가 "이 경우엔 optimistic를 써라"처럼 직접 처방하는 것은 아니다.

- 읽고 나중에 저장하는 UI 편집 흐름은 optimistic lock이 맞는 경우가 많다.
- 워커 dequeue, 재고 차감, 중복 집행 방지는 pessimistic lock이 더 직관적이다.
- `skip_locked`는 배치/큐 소비엔 좋지만, “모든 row를 빠짐없이 즉시 처리해야 한다”는 요구와는 맞지 않을 수 있다.

---

## Logging

TypeORM은 다음 로그 레벨/타입을 지원한다.

- `query`
- `error`
- `schema`
- `warn`
- `info`
- `log`
- `all`

### 로거 종류

- `advanced-console`
- `simple-console`
- `formatted-console`
- `file`
- `debug`
- custom logger

### 실무 활용

- 개발: `query`, `error`
- 스테이징: `error`, `warn`, slow query
- 운영: 애플리케이션 로거에 통합하거나 느린 쿼리만

### NestJS 조합 포인트

Nest Logger나 pino/winston과 통합할 때 custom logger를 붙이면 요청 ID, 사용자 ID, URL 같은 컨텍스트를 같이 남기기 좋다.

### 기본 로깅 예제

```typescript
const dataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "app",
  logging: ["query", "error"],
  maxQueryExecutionTime: 500,
});
```

### 파일 로거 예제

```typescript
const dataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "app",
  logging: true,
  logger: "file",
});
```

### 커스텀 로거 예제

```typescript
import { AbstractLogger, DataSource, LogLevel, LogMessage, QueryRunner } from "typeorm";

class AppLogger extends AbstractLogger {
  protected writeLog(
    level: LogLevel,
    logMessage: LogMessage | LogMessage[],
    queryRunner?: QueryRunner,
  ) {
    const messages = this.prepareLogMessages(logMessage, {}, queryRunner);
    for (const message of messages) {
      console.log(`[typeorm:${message.type ?? level}]`, message.message);
    }
  }
}

const dataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "app",
  logger: new AppLogger(),
});
```

---

## Entity Listener / Subscriber

### Listener

엔티티 클래스 내부 메서드에 붙인다.

예:
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

### Subscriber

엔티티 외부 클래스에서 이벤트를 구독한다.

### 매우 중요한 공식 주의점

**Listener 안에서 DB 호출을 하지 말고, 그런 작업은 Subscriber에서 하라.**

### Trade-off

| 방식 | 장점 | 단점 |
|------|------|------|
| Listener | 엔티티 가까이 있어 직관적 | DB 작업 부적합 |
| Subscriber | 이벤트 처리 유연 | 흐름이 분산될 수 있음 |

### NestJS 조합 포인트

Nest request scope와 TypeORM subscriber 생명주기는 잘 맞지 않는다.  
즉, subscriber에서 요청 컨텍스트나 request-scoped provider를 기대하면 꼬이기 쉽다.

공식 문서 기준으로 보면:

- TypeORM은 subscriber를 `DataSourceOptions.subscribers`로 로드할 수 있다.
- Nest 공식 문서는 `DataSource`를 주입받아 `dataSource.subscribers.push(this)`로 등록하는 패턴을 제시한다.
- Nest 공식 문서는 subscriber가 request-scoped일 수 없다고 명시한다.

### Listener 예제

```typescript
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: 0 })
  slugVersion: number;

  @BeforeInsert()
  setInitialSlugVersion() {
    this.slugVersion = 1;
  }

  @BeforeUpdate()
  bumpSlugVersion() {
    this.slugVersion += 1;
  }
}
```

### Subscriber 예제

```typescript
import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from "typeorm";

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  afterInsert(event: InsertEvent<User>) {
    console.log("user inserted", event.entity?.email);
  }

  afterUpdate(event: UpdateEvent<User>) {
    console.log("user updated", event.entity);
  }
}
```

### NestJS에서 subscriber를 안전하게 등록하는 패턴

Nest에서 DI를 받는 subscriber라면, 공식 문서 쪽 기준으로는 provider로 올린 뒤 `DataSource`에 등록하는 방식이 가장 안전하다.

> **실무 추론**: `dataSource.subscribers.push(this)` 자체와 subscriber가 request-scoped일 수 없다는 경고는 공식 문서 기반이다.  
> 다만 `includes(this)`로 중복 등록을 막는 부분과, actor/request 문맥을 subscriber에 숨기지 말자는 기준은 공식 문서 취지에서 도출한 실무 패턴이다.

```typescript
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from "typeorm";

@Injectable()
@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<Order> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    if (!dataSource.subscribers.includes(this)) {
      dataSource.subscribers.push(this);
    }
  }

  listenTo() {
    return Order;
  }

  async afterInsert(event: InsertEvent<Order>) {
    await event.manager.insert(AuditLog, {
      action: "ORDER_CREATED",
      targetId: event.entity.id,
    });
  }
}
```

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Order, AuditLog])],
  providers: [OrdersService, OrderSubscriber],
})
export class OrdersModule {}
```

### 해결 원칙

> **실무 추론**: 아래 원칙은 공식 문서의 subscriber/event manager 제약을 실무 설계 기준으로 번역한 것이다.

- subscriber는 singleton으로 둔다.
- request-scoped provider를 주입하지 않는다.
- DB 작업은 전역 repository 대신 `event.manager`나 `event.queryRunner.manager`를 쓴다.
- “현재 로그인 사용자” 같은 요청 문맥은 subscriber에 숨기지 말고 서비스 계층에서 명시적으로 전달한다.

### 어디까지 subscriber에 맡길 것인가

| 맡기기 좋은 것 | 서비스 계층이 더 나은 것 |
|------|------|
| 단순 감사 로그, 후처리 훅, 이벤트 감지 | actor 필요 감사 로그, 권한 판정, 외부 API 호출 |

즉, subscriber는 인프라 이벤트 훅으로는 좋지만, request context까지 품는 비즈니스 오케스트레이터로 키우면 Nest와 잘 충돌한다.

---

## N+1 문제

공식 문서도 성능 최적화 항목에서 N+1을 대표 문제로 바로 언급한다.  
핵심은 “목록 1번 조회 + 각 row마다 추가 relation 조회 N번”이 합쳐져 쿼리가 폭증하는 현상이다.

> **실무 추론**: 아래의 controller 직렬화, GraphQL field resolver, `for ... of` 순차 await 예시는 공식 문서의 N+1 경고를 NestJS/Node 런타임에서 자주 터지는 형태로 풀어쓴 것이다.

### 어떻게 터지나

```typescript
const posts = await postRepository.find();

for (const post of posts) {
  const author = await post.author;
  console.log(post.id, author.name);
}
```

이 코드는 겉보기엔 단순하지만, lazy relation이면 보통 다음처럼 된다.

- `posts` 목록 1번 조회
- 각 post마다 `author` 조회 N번

즉 총 `1 + N` 쿼리다.

### NestJS에서 특히 자주 보이는 패턴

- controller에서 엔티티를 그대로 반환했는데 직렬화 시점에 lazy relation이 풀리는 경우
- GraphQL resolver가 field resolver마다 relation을 따로 읽는 경우
- service에서 목록을 가져온 뒤 `for ... of` 안에서 relation Promise를 순차 await하는 경우

### 진단 방법

- 개발 환경에서 `logging: ["query", "error"]`를 켠다.
- 같은 형태의 `SELECT ... WHERE id = ?`가 반복되는지 본다.
- 응답 row 수보다 실행 쿼리 수가 훨씬 많으면 의심한다.

### 해결 1: `relations`로 명시 로드

```typescript
const posts = await postRepository.find({
  relations: {
    author: true,
  },
});
```

### 해결 2: `leftJoinAndSelect`

```typescript
const posts = await postRepository
  .createQueryBuilder("post")
  .leftJoinAndSelect("post.author", "author")
  .orderBy("post.id", "DESC")
  .getMany();
```

### 해결 3: relation 전체 대신 id만 먼저 가져오기

relation row가 너무 커서 join이 부담이면 relation id만 먼저 읽는 편이 나을 수 있다.

```typescript
const posts = await postRepository.find({
  loadRelationIds: {
    relations: ["author"],
  },
});
```

### Trade-off

| 해결 방식 | 장점 | 단점 |
|------|------|------|
| `relations` | 가장 간단하다 | relation이 깊어지면 쿼리가 금방 무거워진다 |
| `leftJoinAndSelect` | 제어가 세밀하다 | 코드가 길어진다 |
| `loadRelationIds` | join 비용을 줄일 수 있다 | relation 전체 데이터는 다시 따로 읽어야 한다 |

### 실무 감각

- “조회 목록”과 “상세 화면”은 relation 전략을 다르게 두는 편이 낫다.
- 한 번에 다 join하는 게 늘 정답은 아니다. 컬렉션 relation이 크면 row duplication이 커질 수 있다.
- 따라서 N+1을 막는 일과 join을 과도하게 키우지 않는 일은 같이 봐야 한다.

---

## 성능 최적화

공식 문서의 핵심 메시지는 단순하다.  
성능 문제의 대부분은 ORM 그 자체보다 **잘못된 조회 전략**에서 나온다.

### 핵심 체크리스트

- N+1 방지: `relations`, `leftJoinAndSelect`, `loadRelationIds`
- 필요한 컬럼만 선택: `select`
- entity 대신 raw면 `getRawMany`
- 인덱스 사용
- eager/lazy 남용 금지
- pagination 사용
- 캐시 적용

### 인덱스

- 단일 컬럼
- 복합 인덱스
- unique
- spatial
- Postgres concurrent index
- custom type/hash
- sync 제외 인덱스

### 인덱스 예제

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
@Index(["firstName", "lastName"])
@Index("IDX_USER_EMAIL_UNIQUE", ["email"], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;
}
```

```typescript
// PostgreSQL 전용 concurrent index 예시
@Entity()
@Index(["createdAt"], { concurrent: true })
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  createdAt: Date;
}
```

```typescript
// 수동 생성한 DB 특화 인덱스를 TypeORM sync에서 건드리지 않게 하는 예시
@Entity()
@Index("IDX_POST_NAME_LOWER", { synchronize: false })
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

### 자주 드는 의문

**ORM이 느린가, 쿼리가 느린가?**  
대부분은 후자다. 쿼리 모양과 인덱스가 먼저다.

---

## SQL Tag

`dataSource.sql\`...\`` 같은 템플릿 리터럴로 raw SQL을 작성할 수 있다.

### 장점

- 드라이버별 placeholder 자동 처리
- 가독성 향상
- SQL injection 방지에 유리

### 주의

동적 테이블명/컬럼명처럼 parameterize 불가능한 부분은 함수 래핑으로 raw 삽입할 수 있지만, 이 경우 escaping이 없으므로 매우 위험하다.

### 언제 좋은가

- 간단 raw query
- driver 차이를 줄이고 싶을 때
- QueryBuilder보다 SQL이 더 직관적인 경우

### 예제

```typescript
const activeUsers = await dataSource.sql`
  SELECT id, email
  FROM users
  WHERE is_active = ${true}
  ORDER BY id DESC
`;

const selectedUsers = await dataSource.sql`
  SELECT id, email
  FROM users
  WHERE id IN (${() => [1, 2, 3]})
`;
```

---


# Part 8: 드라이버와 플랫폼

---

## Postgres / CockroachDB

TypeORM과 가장 궁합이 좋은 축 중 하나다.

### 강점

- array
- json/jsonb
- enum
- hstore
- range / multirange
- spatial
- vector / halfvec
- CTE, locking, extension 생태계

### 중요한 옵션

- `schema`
- `uuidExtension`
- `maxTransactionRetries`
- `logNotifications`
- `installExtensions`
- `extensions`
- `applicationName`
- `parseInt8`

### 주의

`int8`는 기본적으로 문자열로 다룬다. number로 강제 파싱하면 안전 범위를 넘을 수 있다.

### `timestamptz` 예제

```typescript
@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
```

```typescript
const logs = await auditLogRepository.find({
  where: {
    occurredAt: MoreThan(new Date("2026-03-01T00:00:00.000Z")),
  },
  order: {
    occurredAt: "DESC",
  },
});
```

### 시간 컬럼 실무 권장

- PostgreSQL 기반 API 서버에서는 보통 `createdAt`, `updatedAt`, `deletedAt`을 `timestamptz`로 두는 편이 안전하다.
- 클라이언트에 보여줄 때만 사용자 시간대로 변환하고, 저장은 UTC 기준 시점으로 다루는 습관이 좋다.

### Trade-off

TypeORM의 고급 기능 대부분은 Postgres에서 가장 자연스럽다. 대신 운영 복잡도도 그만큼 올라갈 수 있다.

---

## MySQL / MariaDB

범용적이고 익숙하다.

### 핵심 메모

- 현재 권장 드라이버는 `mysql2`
- `multipleStatements`는 SQL injection 범위를 넓히므로 신중
- big number 처리 옵션을 정확히 알아야 한다
- spatial, set, vector 일부 지원

### 중요한 옵션

- `charset`, `collation`
- `timezone`
- `supportBigNumbers`
- `bigNumberStrings`
- `dateStrings`
- `legacySpatialSupport`

### 주의

`width`, `zerofill` 계열은 최근 MySQL 흐름에서 비중이 낮아졌고, 향후 제거/비권장 포인트를 확인해야 한다.

### 설정 예제

```typescript
const MySqlDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "root",
  database: "app",
  entities: [User],
  synchronize: false,
  timezone: "Z",
  supportBigNumbers: true,
  bigNumberStrings: true,
});
```

---

## SQLite 계열

로컬 개발, 테스트, 모바일/브라우저 계열에서 매우 유용하다.

### 변종

- `better-sqlite3`
- `sql.js`
- `capacitor`
- `cordova`
- `expo`
- `nativescript`
- `react-native`

### 장점

- 셋업이 쉽다
- 로컬 테스트에 강하다
- 파일 기반이라 개발 초기 속도가 빠르다

### 단점

- 운영용 대규모 동시성 환경엔 한계
- 드라이버/플랫폼별 제약이 다르다

### 특이 포인트

SQLite는 `jsonb`도 지원하는 최신 흐름이 반영됐다. 다만 실제 내부 저장/함수 동작을 RDBMS급 jsonb와 동일하게 생각하면 안 된다.

### `better-sqlite3` 예제

```typescript
const SqliteDataSource = new DataSource({
  type: "better-sqlite3",
  database: "dev.sqlite",
  entities: [User],
  synchronize: true,
  enableWAL: true,
});
```

### `sql.js` 예제

```typescript
const BrowserDataSource = new DataSource({
  type: "sqljs",
  location: "browser-db",
  autoSave: true,
  entities: [User],
  synchronize: true,
});
```

---

## Microsoft SQL Server

TypeORM이 공식 지원하며, pagination과 locking, schema 기능을 잘 활용할 수 있다.

### 메모

- `skip/take`는 `order` 없이 쓰면 문제를 일으킬 수 있다.
- schema, database 조합 활용 가능
- 일부 옵션/connection 방식은 최근 버전에서 바뀐 점이 있다.

### 설정 예제

```typescript
const MssqlDataSource = new DataSource({
  type: "mssql",
  host: "localhost",
  port: 1433,
  username: "sa",
  password: "StrongPassword123!",
  database: "app",
  entities: [User],
  synchronize: false,
  options: {
    encrypt: false,
  },
});
```

---

## MongoDB

TypeORM은 MongoDB도 지원하지만, 경험상 이 영역은 관계형 ORM 감각과는 다르게 접근해야 한다.

### 특징

- `MongoEntityManager`
- `MongoRepository`
- document/subdocument
- `_id` / `ObjectId`

### 판단

MongoDB를 쓸 거라면 TypeORM이 항상 최적 선택은 아니다.  
하지만 기존 TypeORM 기반 프로젝트에서 문서형 저장소 일부를 붙이는 상황에선 여전히 의미가 있다.

### 설정 예제

```typescript
const MongoDataSource = new DataSource({
  type: "mongodb",
  url: process.env.MONGO_URL,
  database: "app",
  entities: [LogEntry],
});
```

```typescript
@Entity()
export class LogEntry {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  event: string;

  @Column()
  payload: Record<string, unknown>;
}
```

---

## Oracle

thin mode / thick mode, `sid` / `serviceName` 같은 Oracle 고유 개념을 이해해야 한다.

### 메모

- 일반적인 CRUD는 가능
- 격리 수준과 드라이버 차이를 고려해야 함
- SQL 문법과 타입 체계는 Postgres/MySQL과 감각이 다르다

### 설정 예제

```typescript
const OracleDataSource = new DataSource({
  type: "oracle",
  host: "localhost",
  port: 1521,
  username: "system",
  password: "oracle",
  serviceName: "XEPDB1",
  entities: [User],
  synchronize: false,
});
```

---

## SAP HANA

TypeORM이 지원하지만, 대부분의 백엔드 입문자에게는 주류 경로는 아니다.

### 특징

- HANA 전용 데이터 타입
- vector / halfvec 지원
- pool 관련 옵션 다수

### 판단

문서 이해 목적이라면 “지원 범위를 아는 것” 정도가 중요하고, 실제 채택은 업무 환경이 정한다.

### 설정 예제

```typescript
const HanaDataSource = new DataSource({
  type: "sap",
  host: "localhost",
  port: 30015,
  username: "SYSTEM",
  password: "password",
  database: "HXE",
  entities: [Document],
  synchronize: false,
});
```

---

## Google Spanner

지원 범위는 존재하지만, 일반적인 웹 백엔드 학습 우선순위에서는 낮다.

### 핵심만 기억

- 별도 인증 설정 필요
- RDBMS 감각과 완전히 같게 생각하면 안 됨
- 학습용 우선순위는 낮고, 필요 업무에서만 깊게 들어가면 된다

### 설정 예제

```typescript
const SpannerDataSource = new DataSource({
  type: "spanner",
  projectId: process.env.GCP_PROJECT_ID,
  instanceId: process.env.SPANNER_INSTANCE_ID,
  databaseId: process.env.SPANNER_DATABASE_ID,
  entities: [User],
  synchronize: false,
});
```

---

## 지원 플랫폼

공식 문서는 Node.js 외에도 Browser, Capacitor, Cordova/Ionic, Expo, NativeScript, React Native를 다룬다.

### 핵심 메모

- Node.js 20+가 기준
- 브라우저에서는 `sql.js`
- 모바일 계열은 각자 전용 sqlite 드라이버 제약을 이해해야 함
- Cordova에서는 transaction 제약이 있다

### 브라우저 예제

```typescript
const BrowserDataSource = new DataSource({
  type: "sqljs",
  entities: [Photo],
  synchronize: true,
});
```

---


# Part 9: 가이드, FAQ, 릴리스 노트

---

## Validation

TypeORM 자체는 validation 라이브러리가 아니다.  
공식 문서도 `class-validator` 같은 별도 도구 사용을 권장한다.

### NestJS 조합 포인트

Nest에서는 엔티티에 validation 데코레이터를 얹기보다, 보통 DTO에 `class-validator`를 두고 `ValidationPipe`로 처리하는 편이 더 일관적이다.

즉:

- **입력 검증**: DTO
- **DB 매핑**: Entity

이 분리가 더 안정적이다.

### DTO 예제

```typescript
import { IsEmail, IsString, Length } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 50)
  name: string;
}
```

---

## Express 예제와 JavaScript 사용

공식 문서에는 Express 기반 예제와 JavaScript-only 사용법도 있다.

### 얻을 수 있는 교훈

- TypeORM은 Nest 전용 도구가 아니다.
- `reflect-metadata`, `DataSource.initialize()`, `Repository` 흐름은 프레임워크와 무관하게 동일하다.
- JavaScript-only 프로젝트에서는 `EntitySchema`가 특히 유용하다.

### Express 예제

```typescript
app.get("/users", async (_req, res) => {
  const users = await dataSource.getRepository(User).find();
  res.json(users);
});

app.post("/users", async (req, res) => {
  const user = dataSource.getRepository(User).create(req.body);
  const saved = await dataSource.getRepository(User).save(user);
  res.status(201).json(saved);
});
```

### JavaScript EntitySchema 예제

```javascript
const EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "User",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    email: {
      type: "varchar",
    },
  },
});
```

---

## Sequelize에서 옮길 때

공식 가이드가 비교하는 핵심은 다음이다.

- Sequelize의 model 정의 ↔ TypeORM의 entity 정의
- sync ↔ synchronize
- field/default/unique/autoIncrement 대응 방식

### 중요한 차이

TypeORM은 클래스/데코레이터/Repository 구조가 더 강해서, 코드베이스가 커질수록 아키텍처적 이점이 커질 수 있다.

### 대응 예제

```javascript
// Sequelize
const User = sequelize.define("user", {
  email: DataTypes.STRING,
  name: DataTypes.STRING,
});
```

```typescript
// TypeORM
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;
}
```

---

## FAQ

공식 FAQ에서 실제로 자주 다시 찾게 되는 것만 코드와 함께 추리면 아래와 같다.

### 1. 개발 중엔 `synchronize`, 운영에선 `migration`

```typescript
const dataSource = new DataSource({
  type: "postgres",
  synchronize: process.env.NODE_ENV === "development",
});
```

```bash
typeorm schema:sync
```

- 개발 중에는 `synchronize`가 매우 빠르다.
- 운영에서는 스키마 변경 이력을 남겨야 하므로 migration이 기본이다.

### 2. DB 컬럼명은 `name` 옵션으로 바꾼다

```typescript
@Column({ name: "is_active" })
isActive: boolean;
```

엔티티 필드명은 코드 관점, `name`은 실제 DB 컬럼명을 제어한다.

### 3. DB 함수 default도 줄 수 있다

```typescript
@Column({ type: "timestamptz", default: () => "NOW()" })
createdAt: Date;
```

애플리케이션에서 시간을 넣지 않아도 DB가 기본값을 채운다.

### 4. owner side를 정하지 않으면 relation이 완성되지 않는다

```typescript
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  @JoinColumn()
  profile: Profile;
}

@Entity()
export class Profile {
  @OneToOne(() => User, (user) => user.profile)
  user: User;
}
```

- `@JoinColumn()`이 붙은 쪽이 owner side다.
- `@ManyToMany`는 owner side에 `@JoinTable()`이 필요하다.
- `@ManyToOne`은 FK가 붙는 쪽이 명확해서 보통 `@JoinColumn()`을 생략한다.

### 5. many-to-many 중간 테이블에 extra column이 필요하면 별도 entity로 만든다

```typescript
@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, (student) => student.enrollments)
  student: Student;

  @ManyToOne(() => Course, (course) => course.enrollments)
  course: Course;

  @Column({ type: "varchar", length: 20 })
  status: string;
}
```

자동 생성 join table은 단순 연결용이다. 상태값, 순서, 생성자 정보가 필요하면 독립 entity가 맞다.

### 6. `outDir`를 쓰면 오래된 JS entity가 남아 중복 로딩될 수 있다

```json
{
  "scripts": {
    "build": "rimraf dist && tsc -p tsconfig.build.json"
  }
}
```

```typescript
export default new DataSource({
  entities: [__dirname + "/**/*.entity.{js,ts}"],
});
```

- 엔티티를 이름만 바꾸고 `dist`를 안 지우면, 예전 `*.js`가 남아 TypeORM이 둘 다 읽을 수 있다.
- 특히 Nest 빌드 후 migration이 갑자기 꼬일 때 가장 먼저 `dist` 정리를 의심한다.

### 7. ts-node / ESM / 번들링은 경로와 relation 타입이 핵심이다

```bash
npx typeorm-ts-node-commonjs schema:sync
npx typeorm-ts-node-esm schema:sync
```

```typescript
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>;
}
```

- ESM 프로젝트에서는 `"type": "module"` 설정과 import 해석이 중요하다.
- relation 필드에 `Relation<T>`를 쓰면 순환 참조 메타데이터 문제를 줄이는 데 도움이 된다.
- 번들링 환경에서는 migration 파일 경로와 클래스명이 유지되는지까지 확인해야 한다.

---

## Support

공식 지원 채널은 크게 네 갈래다.

- GitHub issue
- StackOverflow
- Discord
- commercial support

학습 관점에서는 **문서 → 예제 → GitHub issue 검색** 순서가 가장 생산적이다.

---

## v1 Migration Guide

이 문서는 매우 중요하다. 최신 TypeORM의 변화 포인트를 한 번에 알려준다.

### 특히 중요한 변화

- Node.js 20+ 필요
- `DataSource` 중심 구조 강화
- null/undefined where 처리 기본값이 엄격해짐
- `@EntityRepository`, `getCustomRepository` 등 구식 패턴 제거
- global helper류 제거
- 일부 드라이버 옵션 제거/변경
- query builder 일부 deprecated API 제거

### 실무적 의미

오래된 블로그 글을 따라 하면 깨지는 이유가 대부분 여기에 있다.

### old -> new 예제

```typescript
// 예전 감각
const connection = await createConnection();

// 현재 권장
const dataSource = new DataSource(options);
await dataSource.initialize();
```

```typescript
// 예전 커스텀 레포지토리 감각
// @EntityRepository(User)

// 현재 권장
export const UserRepository = dataSource.getRepository(User).extend({
  findActive() {
    return this.find({ where: { isActive: true } });
  },
});
```

---

## TypeORM 1.0 Release Notes

릴리스 노트는 “무엇이 추가되었는가”보다 “업그레이드 후 어디서 깨지고, 무엇을 새로 쓸 수 있는가” 관점으로 읽는 편이 실용적이다.

### 업그레이드 직후 바로 체감하는 변경

- Node.js 20+가 사실상 전제다.
- 오래된 전역 helper(`createConnection`, `getRepository`) 감각은 이제 완전히 버려야 한다.
- `null` / `undefined` where 처리 기본값이 엄격해져서, NestJS의 optional query DTO와 바로 충돌할 수 있다.
- 드라이버도 modern baseline으로 올라갔다.
  - MySQL은 `mysql2`
  - SQLite는 `better-sqlite3`
  - MongoDB는 최신 드라이버 계열 기준

### v1에서 바로 바뀌는 코드 예제

```typescript
import { DataSource, In } from "typeorm";

const dataSource = new DataSource(options);
await dataSource.initialize();

const users = await dataSource.getRepository(User).findBy({
  id: In([1, 2, 3]),
});

const exists = await dataSource.getRepository(User).exists({
  where: { isActive: true },
});
```

```typescript
const result = await userRepository.update(
  1,
  { firstName: "Alice" },
  { returning: ["id", "firstName"] },
);

console.log(result.raw);
```

```typescript
await dataSource
  .createQueryBuilder()
  .insert()
  .into(ArchivedUser, ["firstName", "lastName", "archivedAt"])
  .valuesFromSelect((qb) =>
    qb
      .select(["user.firstName", "user.lastName", "NOW()"])
      .from(User, "user")
      .where("user.deletedAt IS NOT NULL"),
  )
  .execute();
```

```typescript
await using queryRunner = dataSource.createQueryRunner();
await queryRunner.manager.update(
  Employee,
  { level: "junior" },
  { bonus: 0.2 },
);
```

### 런타임 동작이 달라지는 지점

```typescript
import { IsNull } from "typeorm";

await repository.find({ where: { email: undefined } }); // v1 기본값에서는 예외
await repository.find({ where: { deletedAt: IsNull() } }); // null 비교는 명시적으로
```

```typescript
@VirtualColumn({
  query: (alias) =>
    `SELECT COUNT(*) FROM post_categories_category WHERE postId = ${alias}.id`,
})
categoryCount: number;
```

- `findByIds`는 `In(...)`으로 바뀌었다.
- `exist()`는 `exists()`가 되었다.
- `@RelationCount`는 제거되어 `@VirtualColumn` 또는 subquery 감각이 필요하다.

### NestJS에서 체감하는 영향

- Node 18 이하 프로젝트면 Nest 앱 자체보다 TypeORM 업그레이드가 먼저 막힌다.
- 예전 `TYPEORM_*` 환경변수 자동 읽기 감각은 버리고, `ConfigService`나 명시적 config 파일로 관리하는 편이 맞다.
- optional query DTO를 그대로 `find({ where: dto })`에 넣던 코드는 v1에서 바로 예외를 만들 수 있다.

---

## Roadmap

현재 roadmap 페이지는 기능 체크리스트라기보다, GitHub milestone과 릴리스 노트로 흐름을 따라가라는 성격에 가깝다.

### 실무에서 보는 방식

- 장기 방향은 roadmap / milestone로 본다.
- 실제 업그레이드 영향은 migration guide와 release notes로 본다.
- 팀 운영에서는 “다음 major에서 깨질 코드가 무엇인가”를 먼저 추린다.

### 버전 추적 최소 루틴

```bash
npm ls typeorm
npm view typeorm version
npx typeorm -v
```

### 실전 해석

- roadmap 페이지 하나만 읽어서는 부족하다.
- release notes와 migration guide를 같이 봐야 실제 영향이 잡힌다.
- NestJS 프로젝트라면 Node 버전, 드라이버 교체, CLI 경로, optional filter 동작을 같이 점검하는 편이 안전하다.

---
