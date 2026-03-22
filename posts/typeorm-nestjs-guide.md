---
title: 'TypeORM + NestJS Guide'
date: '2026-03-22'
tags:
  - backend/typeorm
  - backend/nestjs
  - backend/database
  - backend/operations
  - backend/testing
  - typescript/library
description: 'NestJS와 TypeORM을 함께 쓸 때의 시너지, 장애 패턴, 운영 전략을 모은 분할 가이드'
slug: typeorm-nestjs-guide
content: |
  # TypeORM + NestJS Guide

  NestJS 조합 포인트만 따로 읽고 싶을 때 보는 분할본이다. 범위는 Part 10이다.

  ## 읽기 경로

  - [Core](https://devholic.me/posts/typeorm-core-guide)
  - [Advanced](https://devholic.me/posts/typeorm-advanced-guide)
  - [Operations](https://devholic.me/posts/typeorm-operations-guide)
  - [NestJS](https://devholic.me/posts/typeorm-nestjs-guide)
  - [Guide Hub](https://devholic.me/posts/typeorm-beginner-guide)

  ## 함께 읽기

  - [NestJS Core Guide](https://devholic.me/posts/nestjs-core-guide): module, provider, DI 구조를 먼저 다시 확인할 때
  - [NestJS Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide): TypeORM 연동 기본 예제와 `TypeOrmModule` 설정을 같이 볼 때
  - [NestJS Advanced Guide](https://devholic.me/posts/nestjs-advanced-guide): 테스트, e2e, 운영 장애 대응까지 확장해서 볼 때

  ## 이 문서에서 다루는 섹션

  - [NestJS와 TypeORM의 시너지](#nestjs와-typeorm의-시너지)
  - [NestJS에서 특히 자주 터지는 문제들](#nestjs에서-특히-자주-터지는-문제들)
  - [NestJS + TypeORM 추천 운영 전략](#nestjs-+-typeorm-추천-운영-전략)
  - [학습 로드맵](#학습-로드맵)
  - [공식 문서 반영 체크리스트](#공식-문서-반영-체크리스트)

  # Part 10: NestJS 조합 특화

  ---

  ## NestJS와 TypeORM의 시너지

  NestJS와 TypeORM은 구조적으로 잘 맞는다.

  ### 잘 맞는 이유

  - Module 기반 구조 ↔ entity/repository 분리
  - DI ↔ repository 주입
  - service 계층 ↔ Data Mapper 패턴
  - DTO validation ↔ 엔티티와 역할 분리

  ### 대표 조합

  ```typescript
  TypeOrmModule.forRoot({
    type: "postgres",
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: false,
  });
  ```

  ```typescript
  @Injectable()
  export class UsersService {
    constructor(
      @InjectRepository(User)
      private readonly usersRepository: Repository<User>,
      @InjectDataSource()
      private readonly dataSource: DataSource,
    ) {}
  }
  ```

  ### 시너지 포인트

  - repository mocking이 쉽다
  - service 단위 테스트가 명확하다
  - ConfigModule과 연결 구성이 자연스럽다
  - migration 배포 파이프라인을 만들기 쉽다

  ### 모듈 + 엔티티 + 서비스 예제

  ```typescript
  // users.module.ts
  @Module({
    imports: [TypeOrmModule.forFeature([User, Profile])],
    providers: [UsersService],
    exports: [UsersService],
  })
  export class UsersModule {}
  ```

  ```typescript
  // user.entity.ts
  @Entity()
  export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @OneToOne(() => Profile, (profile) => profile.user, { cascade: ["insert"] })
    profile: Profile;
  }
  ```

  ```typescript
  // users.service.ts
  @Injectable()
  export class UsersService {
    constructor(
      @InjectRepository(User)
      private readonly usersRepository: Repository<User>,
    ) {}

    async create(dto: CreateUserDto) {
      const user = this.usersRepository.create({
        email: dto.email,
        name: dto.name,
        profile: dto.bio ? { bio: dto.bio } : undefined,
      });
      return this.usersRepository.save(user);
    }

    async findOne(id: number) {
      return this.usersRepository.findOne({
        where: { id },
        relations: { profile: true },
      });
    }
  }
  ```

  ---

  ## NestJS에서 특히 자주 터지는 문제들

  이 섹션은 “이론상 가능한 문제”가 아니라, NestJS + TypeORM 조합에서 실제로 자주 만나게 되는 장애 패턴을 기준으로 정리한다.

  ### 증상별 빠른 진단표

  | 증상 | 보통 원인 | 먼저 볼 곳 |
  |------|-----------|------------|
  | 트랜잭션 안인데 일부 쿼리만 롤백되지 않음 | transaction 내부에서 전역 repository 사용 | `dataSource.transaction()` 내부 코드 |
  | optional query DTO만 붙였는데 예외가 남 | `undefined`가 where 조건으로 그대로 들어감 | service의 filter 조립 로직 |
  | 응답 직전에 쿼리가 갑자기 늘어남 | lazy relation 또는 broad relations 직렬화 | controller 반환 객체 |
  | 개발에선 되는데 배포 후 migration이 안 잡힘 | `src`/`dist` 경로와 CLI data source 불일치 | `app-data-source.ts`, npm scripts |
  | 테스트는 통과하지만 운영 Postgres에서만 깨짐 | SQLite 메모리 테스트가 드라이버 차이를 숨김 | E2E test DB 설정 |
  | subscriber에서 현재 사용자 정보를 못 읽음 | request scope와 subscriber 생명주기 불일치 | subscriber 설계 |

  ### 1. `synchronize: true`를 오래 끌고 가는 문제

  개발 초반엔 편하다. 하지만 운영 직전까지 끌고 가면 스키마 변경 이력, 롤백 가능성, 배포 예측 가능성을 전부 잃는다.

  ```typescript
  TypeOrmModule.forRoot({
    type: "postgres",
    synchronize: false,
    migrationsRun: true,
  });
  ```

  - 개발 초기의 `synchronize: true`는 가능하다.
  - 운영, 스테이징, 공유 개발 DB에서는 migration으로 전환해야 한다.
  - “나중에 migration 만들지”는 보통 가장 비싼 부채가 된다.

  ### 2. `autoLoadEntities`를 과신하는 문제

  Nest 런타임에서는 편하지만, CLI와 build 산출물까지 자동으로 맞춰주지는 않는다.

  ```typescript
  // users.module.ts
  @Module({
    imports: [TypeOrmModule.forFeature([User, Profile])],
  })
  export class UsersModule {}
  ```

  ```typescript
  // CLI용 data source는 여전히 경로를 명시하는 편이 안전하다.
  export default new DataSource({
    type: "postgres",
    entities: [__dirname + "/**/*.entity.{js,ts}"],
    migrations: [__dirname + "/database/migrations/*.{js,ts}"],
  });
  ```

  - `autoLoadEntities`는 앱에 import된 모듈 기준으로만 동작한다.
  - CLI, migration, 번들링 환경까지 자동으로 일관성을 보장해주지 않는다.
  - 기능 모듈이 많아질수록 “앱은 뜨는데 migration은 못 찾는” 문제가 자주 난다.

  ### 3. DTO를 엔티티에 바로 덮어쓰는 문제

  relation, cascade, hidden column과 섞이면 원치 않는 insert/update가 생긴다.

  ```typescript
  // 좋지 않은 예
  async create(dto: CreateUserDto) {
    return this.usersRepository.save(dto);
  }

  // 더 안전한 예
  async create(dto: CreateUserDto) {
    const user = this.usersRepository.create({
      email: dto.email,
      name: dto.name,
    });
    return this.usersRepository.save(user);
  }
  ```

  - DTO는 입력 계약이고, Entity는 영속 모델이다.
  - 둘을 바로 겹치면 mass assignment, relation 오염, select:false 컬럼 혼선이 생긴다.
  - 특히 `cascade: true`와 결합하면 외부 입력이 relation graph 전체를 바꿔버릴 수 있다.

  ### 4. optional filter DTO를 그대로 where에 넣는 문제

  v1에서는 `null`/`undefined` where 기본값이 엄격해져서, NestJS의 query DTO와 바로 충돌한다.

  ```typescript
  // 위험한 예
  async findMany(query: SearchUsersQueryDto) {
    return this.usersRepository.find({
      where: {
        email: query.email,
        role: query.role,
      },
    });
  }
  ```

  ```typescript
  // 안전한 예
  async findMany(query: SearchUsersQueryDto) {
    const where: FindOptionsWhere<User> = {};

    if (query.email !== undefined) where.email = query.email;
    if (query.role !== undefined) where.role = query.role;

    return this.usersRepository.find({ where });
  }
  ```

  - v0.3 감각으로 optional field를 그대로 넘기면, v1에서는 예외가 날 수 있다.
  - Nest에서는 query string이 대부분 optional이므로 특히 자주 터진다.
  - 검색 API는 DTO를 바로 where로 넘기지 말고 조건을 조립하는 편이 낫다.

  ### 5. transaction 안에서 전역 repository를 쓰는 문제

  가장 흔한 실수 중 하나다. 트랜잭션 안에서는 전달받은 `manager` 또는 그 manager에서 파생된 repository만 써야 한다.

  ```typescript
  // 좋지 않은 예
  async checkout(dto: CheckoutDto) {
    return this.dataSource.transaction(async () => {
      await this.ordersRepository.save({ userId: dto.userId });
      await this.productsRepository.decrement({ id: dto.productId }, "stock", 1);
    });
  }
  ```

  ```typescript
  // 더 안전한 예
  async checkout(dto: CheckoutDto) {
    return this.dataSource.transaction(async (manager) => {
      const ordersRepository = manager.getRepository(Order);
      const productsRepository = manager.getRepository(Product);

      await ordersRepository.save({ userId: dto.userId, productId: dto.productId });
      await productsRepository.decrement({ id: dto.productId }, "stock", 1);
    });
  }
  ```

  ```typescript
  // 다른 서비스로 넘길 때도 manager를 전파하는 편이 낫다.
  async reserveStock(manager: EntityManager, productId: number, amount: number) {
    return manager.decrement(Product, { id: productId }, "stock", amount);
  }
  ```

  - 주입된 repository는 기본 data source에 묶여 있다.
  - transaction 내부에서 그것을 그대로 쓰면, 같은 함수 안에서도 일부 쿼리만 트랜잭션 밖으로 나갈 수 있다.
  - 서비스 간 호출이 섞이면 manager 전파 규칙을 더 엄격하게 잡아야 한다.

  ### 6. savepoint와 `REQUIRES_NEW`를 혼동하는 문제

  Spring/JPA 감각으로 “안쪽에서 transaction을 한 번 더 열었으니 별도 commit이겠지”라고 생각하면 쉽게 틀린다.

  ```typescript
  // savepoint에 더 가까운 예
  await this.dataSource.transaction(async (manager) => {
    await manager.save(order);

    await manager.transaction(async (nestedManager) => {
      await nestedManager.insert(AuditLog, { event: "ORDER_CREATED" });
    });

    throw new Error("rollback outer");
  });
  ```

  이 코드는 안쪽이 commit되어도, 바깥이 최종 rollback되면 같이 사라질 수 있다.  
  즉 `REQUIRES_NEW`가 아니라 savepoint/NESTED 감각에 더 가깝다.

  ```typescript
  // REQUIRES_NEW에 더 가까운 예
  await this.dataSource.transaction(async (manager) => {
    await manager.save(order);

    await this.dataSource.transaction(async (newManager) => {
      await newManager.insert(AuditLog, { event: "ORDER_CREATED" });
    });

    throw new Error("rollback outer");
  });
  ```

  - 안쪽이 savepoint인지, 새 물리 트랜잭션인지 먼저 구분해야 한다.
  - Nest에서는 helper/service abstraction 뒤에 manager가 숨으면 이 차이를 놓치기 쉽다.
  - 감사 로그, 알림 이력, outbox 같은 것은 이 차이가 실제 장애로 이어진다.

  ### 7. `Repository.update()`를 relation-rich update에 쓰는 문제

  `update()`는 빠르지만, relation graph와 엔티티 생명주기까지 다뤄주지는 않는다.

  ```typescript
  // 좋지 않은 예
  await this.usersRepository.update(id, {
    name: dto.name,
    profile: { bio: dto.bio },
  });
  ```

  ```typescript
  // 더 안전한 예
  const user = await this.usersRepository.findOne({
    where: { id },
    relations: { profile: true },
  });

  if (!user) {
    throw new NotFoundException();
  }

  user.name = dto.name;
  if (user.profile) {
    user.profile.bio = dto.bio;
  }

  await this.usersRepository.save(user);
  ```

  - `update()`는 flat column patch에 적합하다.
  - relation 수정, listener 의존, 엔티티 상태 기반 로직까지 기대하면 어긋난다.
  - Nest 서비스에서는 “단순 SQL patch인가, 엔티티 저장인가”를 먼저 구분해야 한다.

  ### 8. subscriber에서 Nest request context를 기대하는 문제

  subscriber의 생명주기와 Nest의 request scope는 다르다. “현재 로그인 사용자” 같은 문맥을 subscriber가 자연스럽게 알 수 있다고 기대하면 거의 틀린다.

  ```typescript
  // subscriber에 비즈니스 문맥을 기대하는 설계는 취약하다.
  @EventSubscriber()
  export class OrderSubscriber implements EntitySubscriberInterface<Order> {
    listenTo() {
      return Order;
    }

    afterInsert(event: InsertEvent<Order>) {
      console.log("order inserted", event.entity?.id);
    }
  }
  ```

  ```typescript
  // 감사 로그가 필요하면 서비스 계층에서 actor를 명시적으로 같이 다루는 편이 안전하다.
  async createOrder(actorId: string, dto: CreateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, dto);
      await manager.save(order);

      await manager.insert(AuditLog, {
        actorId,
        action: "ORDER_CREATED",
        targetId: order.id,
      });

      return order;
    });
  }
  ```

  - subscriber는 인프라 훅으로는 유용하지만, request user/context 전파를 맡기기엔 부적합하다.
  - 감사 로그, 권한, 외부 API 호출은 서비스 계층에서 더 명시적으로 다루는 편이 낫다.

  #### 안전한 등록 패턴

  Nest 공식 문서 기준으로는 subscriber를 provider로 등록한 뒤, `DataSource`에 붙이는 패턴이 기본이다.  
  또 같은 문서에서 subscriber는 request-scoped일 수 없다고 경고한다.

  > **실무 추론**: `dataSource.subscribers.push(this)`와 request-scope 경고는 공식 문서 기반이다.  
  > `includes(this)`로 중복 등록을 막는 부분, 그리고 actor/request 문맥을 서비스 계층으로 올리는 기준은 그 제약에서 도출한 실무 패턴이다.

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

  #### 여기서 무엇을 해결한 건가

  > **실무 추론**: 아래 정리는 공식 API 설명 자체가 아니라, 그 API를 Nest 애플리케이션 구조에 맞게 해석한 운영 기준이다.

  - subscriber 인스턴스는 singleton이라 request scope와 충돌하지 않는다.
  - DB write는 `event.manager`로 처리해서 현재 transaction 문맥을 유지한다.
  - actor, tenant, request id 같은 문맥은 subscriber에 숨기지 않고 서비스 메서드 인자로 명시적으로 전달한다.

  #### 여전히 subscriber에 넣지 않는 편이 좋은 것

  - 현재 로그인 사용자 기준 권한 분기
  - 외부 API 호출과 재시도
  - request별 locale, tenant, tracing 문맥 의존 로직

  이런 건 결국 서비스 계층이나 outbox 처리 쪽이 더 안정적이다.

  ### 9. lazy relation을 JSON 직렬화까지 끌고 가는 문제

  Promise relation은 편해 보이지만, controller 응답 직전에 예상치 못한 쿼리를 만들 수 있다.

  ```typescript
  @Entity()
  export class User {
    @OneToMany(() => Order, (order) => order.user)
    orders: Promise<Order[]>;
  }
  ```

  ```typescript
  // 응답 직전에 relation이 터질 수 있다.
  @Get(":id")
  async findOne(@Param("id") id: number) {
    return this.usersRepository.findOneByOrFail({ id });
  }
  ```

  ```typescript
  // 더 예측 가능한 방식
  @Get(":id")
  async findOne(@Param("id") id: number) {
    const user = await this.usersRepository.findOneOrFail({
      where: { id },
      relations: { orders: true },
    });

    return {
      id: user.id,
      email: user.email,
      orderCount: user.orders.length,
    };
  }
  ```

  - Nest controller에서는 엔티티 자체를 그대로 내보내기보다 response DTO로 바꾸는 편이 낫다.
  - lazy relation은 “필요할 때 가져온다”보다 “언제 쿼리가 나가는지 예측이 어려워진다”가 더 큰 비용일 때가 많다.

  ### 10. migration과 앱 실행 경로를 섞는 문제

  Nest 앱의 DI 구성과 TypeORM CLI data-source 설정은 별도 관리가 더 안정적이다.

  ```typescript
  // app-data-source.ts
  import { DataSource } from "typeorm";

  export default new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + "/**/*.entity.{js,ts}"],
    migrations: [__dirname + "/database/migrations/*.{js,ts}"],
    synchronize: false,
  });
  ```

  ```json
  {
    "scripts": {
      "typeorm": "typeorm-ts-node-commonjs -d src/app-data-source.ts",
      "migration:generate": "npm run typeorm -- migration:generate src/database/migrations/AutoMigration",
      "migration:run": "npm run typeorm -- migration:run"
    }
  }
  ```

  - Nest 부트스트랩과 CLI 실행 컨텍스트는 다르다.
  - `src` 기준 경로와 `dist` 기준 경로를 섞으면 dev에서는 되는데 배포 후 깨진다.
  - migration 스크립트는 프로젝트 초반에 먼저 고정해두는 편이 좋다.

  ### 11. 테스트 DB를 SQLite로만 두는 문제

  SQLite 메모리 테스트는 빠르지만, PostgreSQL 전용 타입과 동작 차이를 숨긴다.

  ```typescript
  // 빠르지만 Postgres 차이를 숨길 수 있는 테스트 설정
  export const sqliteTestDataSource = new DataSource({
    type: "better-sqlite3",
    database: ":memory:",
    synchronize: true,
    entities: [User, Order],
  });
  ```

  ```typescript
  // E2E는 실제 운영 드라이버와 맞추는 편이 안전하다.
  export const postgresTestDataSource = new DataSource({
    type: "postgres",
    url: process.env.TEST_DB_URL,
    synchronize: true,
    dropSchema: true,
    entities: [User, Order],
  });
  ```

  - `timestamptz`, `jsonb`, enum, partial index, lock mode, migration SQL은 SQLite에서 그대로 재현되지 않는다.
  - 단위 테스트는 mock + lightweight DB로 가더라도, E2E는 운영 드라이버와 맞추는 편이 좋다.

  ---

  ## NestJS + TypeORM 추천 운영 전략

  ### 개발 초기

  - `autoLoadEntities: true`
  - local DB
  - `logging: ["error", "query"]`
  - 필요 시 `synchronize: true`

  ### 기능 확장기

  - relation은 명시적 join 중심
  - DTO/Entity 분리
  - repository mock 테스트 + 실제 DB 통합 테스트 혼합

  ### 운영 진입 전

  - `synchronize: false`
  - migration only
  - slow query logging
  - custom logger 또는 앱 로거 통합
  - transaction 경계 명시

  ### 개인적 권장

  Nest에서 TypeORM을 쓸 때는 아래 원칙이 가장 덜 후회된다.

  - 엔티티는 얇게
  - 서비스는 명시적으로
  - relation은 최소화
  - join은 예측 가능하게
  - migration은 사람이 읽고 실행

  ### 테스트 mock 예제

  ```typescript
  const moduleRef = await Test.createTestingModule({
    providers: [
      UsersService,
      {
        provide: getRepositoryToken(User),
        useValue: {
          findOne: jest.fn(),
          find: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
      },
    ],
  }).compile();
  ```

  ---

  ## 학습 로드맵

  ### Phase 1: 기초
  - [ ] `DataSource`, `Entity`, `Repository`, `Find Options` 이해
  - [ ] 단일 엔티티 CRUD 구현
  - [ ] `save`와 `insert/update` 차이 체감하기

  ### Phase 2: 관계와 조회
  - [ ] `ManyToOne`, `OneToMany`, `ManyToMany` 구현
  - [ ] `relations`와 `QueryBuilder join` 비교
  - [ ] N+1 문제 직접 재현하고 해결하기

  ### Phase 3: 운영 감각
  - [ ] `Transaction`과 `QueryRunner` 사용
  - [ ] `Migration` 생성/실행/롤백
  - [ ] `logging`, `indices`, `cache` 적용

  ### Phase 4: NestJS 통합
  - [ ] `@InjectRepository()`와 서비스 패턴 적용
  - [ ] `forRootAsync` + `ConfigModule`
  - [ ] 테스트에서 repository mocking
  - [ ] migration 배포 흐름 정리

  ---

  ## 공식 문서 반영 체크리스트

  아래는 **2026-03-22 기준 공식 TypeORM 문서 69개 페이지**를 대조한 반영 목록이다.

  ### Data Source
  - [x] Getting Started
  - [x] DataSource
  - [x] Data Source Options
  - [x] Multiple data sources, databases, schemas and replication setup
  - [x] DataSource API
  - [x] Handling null and undefined values in where conditions

  ### Entity
  - [x] Entities
  - [x] Embedded Entities
  - [x] Entity Inheritance
  - [x] Tree Entities
  - [x] View Entities
  - [x] Separating Entity Definition

  ### Relations
  - [x] Relations
  - [x] One-to-one relations
  - [x] Many-to-one / one-to-many relations
  - [x] Many-to-many relations
  - [x] Eager and Lazy Relations
  - [x] Relations FAQ

  ### Working with Entity Manager
  - [x] EntityManager
  - [x] Repository
  - [x] Find Options
  - [x] Custom repositories
  - [x] EntityManager API
  - [x] Repository APIs

  ### Query Builder / Query Runner
  - [x] Select using Query Builder
  - [x] Insert using Query Builder
  - [x] Update using Query Builder
  - [x] Delete using Query Builder
  - [x] Working with Relations
  - [x] Caching queries
  - [x] Query Runner

  ### Migrations
  - [x] How migrations work?
  - [x] Setup
  - [x] Creating manually
  - [x] Generating
  - [x] Executing and reverting
  - [x] Reverting
  - [x] Status
  - [x] Faking Migrations and Rollbacks
  - [x] Query Runner API
  - [x] Extra options
  - [x] Vite

  ### Drivers
  - [x] Google Spanner
  - [x] Microsoft SQLServer
  - [x] MongoDB
  - [x] MySQL / MariaDB
  - [x] Oracle
  - [x] Postgres / CockroachDB
  - [x] SAP HANA
  - [x] SQLite

  ### Guides
  - [x] Active Record vs Data Mapper
  - [x] Using Validation
  - [x] Example using TypeORM with Express
  - [x] Using with JavaScript
  - [x] Migration from Sequelize to TypeORM
  - [x] SQL Tag
  - [x] Migration to v1
  - [x] TypeORM 1.0 Release Notes

  ### Advanced Topics / Help
  - [x] Transactions
  - [x] Indices
  - [x] Entity Listeners and Subscribers
  - [x] Logging
  - [x] Using CLI
  - [x] Performance and optimization in TypeORM
  - [x] FAQ
  - [x] Supported platforms
  - [x] Decorator reference
  - [x] Support
  - [x] Roadmap

  ### 검증 메모
  - 공식 저장소 문서 트리 기준 `docs/docs/**/*.md` 69개 페이지를 수집해 대조함
  - 위 가이드는 각 페이지의 핵심 개념, 실무적 의문점, trade-off를 반영함
  - NestJS와 함께 쓸 때의 시너지/주의점은 별도 파트로 확장 정리함

---