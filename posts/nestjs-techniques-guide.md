---
title: 'NestJS Techniques Guide'
date: '2026-03-22'
tags:
  - backend/nestjs
  - backend/typeorm
  - backend/http
  - backend/cache
  - backend/queue
  - backend/techniques
description: 'Configuration, Validation, TypeORM, Queue, Scheduler 등 실전 기법만 분리한 NestJS 가이드'
slug: nestjs-techniques-guide
content: |
  # NestJS Techniques Guide

  실무에서 자주 바로 찾게 되는 techniques 파트만 따로 모은 분할본이다. 범위는 Part 3이다.

  ## 읽기 경로

  - [Core](https://devholic.me/posts/nestjs-core-guide)
  - [Techniques](https://devholic.me/posts/nestjs-techniques-guide)
  - [Security + Recipes](https://devholic.me/posts/nestjs-security-recipes-guide)
  - [Advanced](https://devholic.me/posts/nestjs-advanced-guide)
  - [Guide Hub](https://devholic.me/posts/nestjs-beginner-guide)

  ## 함께 읽기

  - [TypeORM Core Guide](https://devholic.me/posts/typeorm-core-guide): `DataSource`, `Entity`, `Repository`, relation 모델링을 같이 볼 때
  - [TypeORM Operations Guide](https://devholic.me/posts/typeorm-operations-guide): migration, CLI, Git 충돌, 배포 절차까지 이어서 볼 때
  - [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide): `@InjectRepository()`, transaction, subscriber, 테스트 함정까지 묶어 볼 때

  ## 이 문서에서 다루는 섹션

  - [Configuration — 환경 설정 관리](#configuration-—-환경-설정-관리)
  - [Validation — 유효성 검증 심화](#validation-—-유효성-검증-심화)
  - [TypeORM — 데이터베이스 연동](#typeorm-—-데이터베이스-연동)
  - [Serialization — 응답 직렬화](#serialization-—-응답-직렬화)
  - [Logger — 로깅](#logger-—-로깅)
  - [HTTP Module — 외부 API 호출](#http-module-—-외부-api-호출)
  - [File Upload — 파일 업로드](#file-upload-—-파일-업로드)
  - [Caching — 캐싱](#caching-—-캐싱)
  - [Queues — 작업 큐](#queues-—-작업-큐)
  - [Task Scheduling — 작업 스케줄링](#task-scheduling-—-작업-스케줄링)
  - [Event Emitter — 이벤트 처리](#event-emitter-—-이벤트-처리)
  - [Versioning — API 버전 관리](#versioning-—-api-버전-관리)

  ---

  # Part 3: 실전 기법 (Techniques)

  ---

  ## Configuration — 환경 설정 관리

  ### 설치

  ```bash
  npm i --save @nestjs/config
  ```

  ### 기본 설정

  ```typescript
  import { ConfigModule } from '@nestjs/config';

  @Module({
    imports: [ConfigModule.forRoot()], // 프로젝트 루트의 .env 파일 로드
  })
  export class AppModule {}
  ```

  ### .env 파일

  ```
  DATABASE_USER=test
  DATABASE_PASSWORD=test
  PORT=3000
  ```

  > 런타임 환경 변수가 `.env` 값보다 우선한다.

  ### 주요 옵션

  ```typescript
  ConfigModule.forRoot({
    isGlobal: true,                    // 전역 모듈로 등록 (매번 import 불필요)
    envFilePath: '.development.env',   // 커스텀 경로
    envFilePath: ['.env.development.local', '.env.development'], // 다중 파일 (첫 매칭 우선)
    ignoreEnvFile: true,               // .env 파일 무시 (프로덕션 등)
    cache: true,                       // 환경변수 접근 캐싱 (성능 최적화)
    expandVariables: true,             // 변수 확장 지원 (${VAR})
  })
  ```

  ### ConfigService 사용

  ```typescript
  @Injectable()
  export class AppService {
    constructor(private configService: ConfigService) {}

    getDatabaseHost(): string {
      return this.configService.get<string>('DATABASE_HOST');
    }

    // 기본값 지정
    getPort(): number {
      return this.configService.get<number>('PORT', 3000);
    }
  }
  ```

  ### 커스텀 설정 파일

  ```typescript
  // config/configuration.ts
  export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    },
  });
  ```

  ```typescript
  ConfigModule.forRoot({
    load: [configuration],
  })
  ```

  중첩 값 접근:

  ```typescript
  const dbHost = this.configService.get<string>('database.host');
  ```

  ### 설정 네임스페이스

  관련 설정을 그룹으로 묶는 강력한 패턴:

  ```typescript
  // config/database.config.ts
  import { registerAs } from '@nestjs/config';

  export default registerAs('database', () => ({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
  }));
  ```

  ```typescript
  // 모듈에서 로드
  ConfigModule.forRoot({
    load: [databaseConfig],
  })

  // 강타입 주입
  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {}
  ```

  ### 타입 안전한 ConfigService

  ```typescript
  interface EnvironmentVariables {
    PORT: number;
    DATABASE_HOST: string;
  }

  constructor(private configService: ConfigService<EnvironmentVariables>) {
    const port = this.configService.get('PORT', { infer: true });
    // port의 타입이 자동으로 number로 추론됨
  }
  ```

  ### 환경변수 유효성 검증 (Joi)

  ```bash
  npm install --save joi
  ```

  ```typescript
  ConfigModule.forRoot({
    validationSchema: Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
      PORT: Joi.number().port().default(3000),
    }),
    validationOptions: {
      allowUnknown: true,  // 정의되지 않은 키 허용
      abortEarly: false,   // 모든 에러 수집
    },
  })
  ```

  ### 환경변수 유효성 검증 (class-validator)

  ```typescript
  import { plainToInstance } from 'class-transformer';
  import { IsEnum, IsNumber, validateSync } from 'class-validator';

  enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
  }

  class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsNumber()
    PORT: number;
  }

  export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    });
    if (errors.length > 0) {
      throw new Error(errors.toString());
    }
    return validatedConfig;
  }
  ```

  ```typescript
  ConfigModule.forRoot({ validate })
  ```

  ### main.ts에서 ConfigService 사용

  ```typescript
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  await app.listen(port);
  ```

  ### 조건부 모듈 로딩

  ```typescript
  @Module({
    imports: [
      ConfigModule.forRoot(),
      ConditionalModule.registerWhen(FooModule, 'USE_FOO'),
      // USE_FOO가 .env에서 false가 아닐 때만 FooModule 로드
    ],
  })
  export class AppModule {}
  ```

  ### ⚠️ 자주 드는 의문: ConfigService vs process.env 직접 접근

  ```typescript
  // ❌ process.env 직접 접근 — 타입 없음, 테스트 어려움
  const port = process.env.PORT; // string | undefined

  // ✅ ConfigService 사용 — 타입 안전, 테스트 가능
  constructor(private configService: ConfigService) {}
  const port = this.configService.get<number>('PORT'); // number
  ```

  | 비교 항목 | `process.env` | `ConfigService` |
  |-----------|--------------|----------------|
  | 타입 안전성 | ❌ 항상 string | ✅ 제네릭으로 지정 |
  | 기본값 처리 | 수동 `?? 'default'` | `.get('KEY', 'default')` |
  | 테스트 시 교체 | ❌ 환경변수 직접 조작 | ✅ `overrideProvider` |
  | 네임스페이스 | ❌ 없음 | ✅ `config.database.host` |
  | 검증 | ❌ 없음 | ✅ Joi/class-validator 통합 |

  **환경변수 검증 (Joi):**

  ```typescript
  ConfigModule.forRoot({
    validationSchema: Joi.object({
      NODE_ENV: Joi.string().valid('development', 'production').required(),
      PORT: Joi.number().default(3000),
      DATABASE_URL: Joi.string().required(),
      JWT_SECRET: Joi.string().min(32).required(),
    }),
    validationOptions: {
      abortEarly: false, // 모든 에러를 한 번에 보고
    },
  })
  ```

  앱 시작 시 필수 환경변수가 없거나 잘못된 경우 **즉시 실패**하여 잘못된 설정으로 서버가 뜨는 상황을 방지한다.

  ---

  ## Validation — 유효성 검증 심화

  ### Auto-Validation (글로벌 ValidationPipe)

  ```typescript
  app.useGlobalPipes(new ValidationPipe());
  ```

  DTO에 class-validator 데코레이터를 붙이면 자동으로 검증된다:

  ```typescript
  import { IsEmail, IsNotEmpty } from 'class-validator';

  export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;
  }
  ```

  ### ValidationPipe 옵션

  ```typescript
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // 데코레이터가 없는 속성 자동 제거
      forbidNonWhitelisted: true,  // 허용되지 않은 속성이 있으면 400 에러
      transform: true,             // 자동 타입 변환 (string → number 등)
      disableErrorMessages: true,  // 프로덕션에서 에러 메시지 숨기기
    }),
  );
  ```

  ### whitelist가 중요한 이유

  `whitelist: true`를 설정하면 DTO에 정의되지 않은 속성이 자동으로 제거된다. 이는 **클라이언트가 의도치 않은 필드를 주입하는 것을 방지**한다.

  ```typescript
  // CreateUserDto에 name, email만 정의되어 있다면
  // { name: "John", email: "john@test.com", isAdmin: true }
  // → whitelist 적용 후: { name: "John", email: "john@test.com" }
  // isAdmin은 자동으로 제거됨!
  ```

  ### transform 옵션

  `transform: true`를 설정하면 URL 파라미터도 선언된 타입에 맞게 자동 변환된다:

  ```typescript
  @Get(':id')
  findOne(@Param('id') id: number) {
    // transform: true면 자동으로 number로 변환
    // transform: false면 여전히 string
  }
  ```

  ---

  ## TypeORM — 데이터베이스 연동

  NestJS에서 가장 널리 사용되는 ORM인 TypeORM과의 통합 방법.

  ### 설치

  ```bash
  # MySQL 예시
  npm install --save @nestjs/typeorm typeorm mysql2

  # PostgreSQL 예시
  npm install --save @nestjs/typeorm typeorm pg
  ```

  ### 기본 설정 (forRoot)

  ```typescript
  import { TypeOrmModule } from '@nestjs/typeorm';

  @Module({
    imports: [
      TypeOrmModule.forRoot({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root',
        database: 'test',
        entities: [],
        synchronize: true, // ⚠️ 프로덕션에서는 절대 사용 금지!
        autoLoadEntities: true, // forFeature()로 등록된 엔티티 자동 로드
      }),
    ],
  })
  export class AppModule {}
  ```

  > **`synchronize: true`는 개발 전용!** 프로덕션에서는 데이터 손실 위험이 있으므로 반드시 마이그레이션을 사용해야 한다.

  ### NestJS 전용 추가 옵션

  | 옵션 | 설명 | 기본값 |
  |------|------|--------|
  | `retryAttempts` | 연결 재시도 횟수 | 10 |
  | `retryDelay` | 재시도 간격 (ms) | 3000 |
  | `autoLoadEntities` | forFeature 엔티티 자동 로드 | false |

  ### 엔티티 정의

  ```typescript
  // user.entity.ts
  import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
  import { Photo } from '../photos/photo.entity';

  @Entity()
  export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Photo, (photo) => photo.user)
    photos: Photo[];
  }
  ```

  ### 기능 모듈에서 엔티티 등록 (forFeature)

  ```typescript
  // users.module.ts
  @Module({
    imports: [TypeOrmModule.forFeature([User])], // User 레포지토리 등록
    providers: [UsersService],
    controllers: [UsersController],
  })
  export class UsersModule {}
  ```

  ### 레포지토리 주입과 CRUD 구현

  ```typescript
  // users.service.ts
  import { Injectable } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { User } from './user.entity';

  @Injectable()
  export class UsersService {
    constructor(
      @InjectRepository(User)
      private usersRepository: Repository<User>,
    ) {}

    findAll(): Promise<User[]> {
      return this.usersRepository.find();
    }

    findOne(id: number): Promise<User | null> {
      return this.usersRepository.findOneBy({ id });
    }

    async create(userData: Partial<User>): Promise<User> {
      const user = this.usersRepository.create(userData);
      return this.usersRepository.save(user);
    }

    async remove(id: number): Promise<void> {
      await this.usersRepository.delete(id);
    }
  }
  ```

  ### 레포지토리를 다른 모듈에서 사용

  `TypeOrmModule`을 re-export하면 다른 모듈에서 레포지토리에 접근할 수 있다:

  ```typescript
  @Module({
    imports: [TypeOrmModule.forFeature([User])],
    exports: [TypeOrmModule], // re-export
  })
  export class UsersModule {}

  // 다른 모듈에서
  @Module({
    imports: [UsersModule], // UsersModule import하면 User 레포지토리 사용 가능
    providers: [ProfileService],
  })
  export class ProfileModule {}
  ```

  ### 관계 (Relations)

  | 타입 | 데코레이터 | 설명 |
  |------|-----------|------|
  | One-to-One | `@OneToOne()` | 1:1 관계 (예: User ↔ Profile) |
  | One-to-Many / Many-to-One | `@OneToMany()` / `@ManyToOne()` | 1:N 관계 (예: User ↔ Photos) |
  | Many-to-Many | `@ManyToMany()` | N:M 관계 (예: Student ↔ Courses) |

  ```typescript
  // photo.entity.ts
  @Entity()
  export class Photo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @ManyToOne(() => User, (user) => user.photos)
    user: User;
  }
  ```

  ### 트랜잭션

  **QueryRunner 방식 (완전한 제어)**:

  ```typescript
  @Injectable()
  export class UsersService {
    constructor(private dataSource: DataSource) {}

    async createMany(users: User[]) {
      const queryRunner = this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.manager.save(users[0]);
        await queryRunner.manager.save(users[1]);
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    }
  }
  ```

  **콜백 방식 (간단한 경우)**:

  ```typescript
  async createMany(users: User[]) {
    await this.dataSource.transaction(async (manager) => {
      await manager.save(users[0]);
      await manager.save(users[1]);
    });
  }
  ```

  ### 엔티티 구독자 (Subscriber)

  엔티티의 삽입, 수정, 삭제 등의 이벤트를 감지:

  ```typescript
  import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';

  @EventSubscriber()
  export class UserSubscriber implements EntitySubscriberInterface<User> {
    constructor(dataSource: DataSource) {
      dataSource.subscribers.push(this);
    }

    listenTo() {
      return User;
    }

    beforeInsert(event: InsertEvent<User>) {
      console.log(`BEFORE USER INSERTED: `, event.entity);
    }
  }
  ```

  모듈의 providers에 등록:

  ```typescript
  @Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [UsersService, UserSubscriber],
  })
  export class UsersModule {}
  ```

  > **주의**: Event subscriber는 request-scoped로 사용할 수 없다.

  ### 마이그레이션

  TypeORM CLI를 통해 스키마 변경을 관리한다. 마이그레이션 클래스는 NestJS 앱과 별개로 관리되며 DI를 사용할 수 없다.

  ```bash
  # 마이그레이션 생성
  npx typeorm migration:generate -d data-source.ts ./migrations/AddUserTable

  # 마이그레이션 실행
  npx typeorm migration:run -d data-source.ts

  # 마이그레이션 되돌리기
  npx typeorm migration:revert -d data-source.ts
  ```

  ### 다중 데이터베이스

  ```typescript
  @Module({
    imports: [
      TypeOrmModule.forRoot({
        ...defaultOptions,
        host: 'user_db_host',
        entities: [User],
      }),
      TypeOrmModule.forRoot({
        ...defaultOptions,
        name: 'albumsConnection', // 이름으로 구분
        host: 'album_db_host',
        entities: [Album],
      }),
    ],
  })
  export class AppModule {}
  ```

  특정 연결의 레포지토리 사용:

  ```typescript
  @Module({
    imports: [
      TypeOrmModule.forFeature([User]),                          // 기본 연결
      TypeOrmModule.forFeature([Album], 'albumsConnection'),     // 명명된 연결
    ],
  })
  export class AppModule {}

  // 서비스에서
  @Injectable()
  export class AlbumsService {
    constructor(
      @InjectDataSource('albumsConnection')
      private dataSource: DataSource,
      @InjectRepository(Album, 'albumsConnection')
      private albumsRepository: Repository<Album>,
    ) {}
  }
  ```

  ### 비동기 설정 (ConfigService 연동)

  ```typescript
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
      type: 'mysql',
      host: configService.get('DB_HOST'),
      port: +configService.get('DB_PORT'),
      username: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_DATABASE'),
      entities: [],
      autoLoadEntities: true,
      synchronize: false, // 프로덕션
    }),
    inject: [ConfigService],
  });
  ```

  ### 테스트에서 레포지토리 모킹

  ```typescript
  const moduleRef = await Test.createTestingModule({
    providers: [
      UsersService,
      {
        provide: getRepositoryToken(User),
        useValue: {
          find: jest.fn().mockResolvedValue([]),
          findOneBy: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
          delete: jest.fn(),
        },
      },
    ],
  }).compile();
  ```

  `getRepositoryToken(Entity)`으로 올바른 주입 토큰을 생성한다.

  ### ⚠️ 자주 드는 의문 1: N+1 문제

  관계 데이터를 조회할 때 가장 흔히 발생하는 성능 문제다.

  ```typescript
  // ❌ N+1 발생: User 10명 조회 후 각각 Post 조회 → 총 11번 쿼리
  const users = await userRepo.find();
  for (const user of users) {
    user.posts = await postRepo.find({ where: { userId: user.id } }); // N번 추가 쿼리
  }

  // ✅ relations 옵션 (단순한 경우)
  const users = await userRepo.find({ relations: ['posts'] });

  // ✅ QueryBuilder로 JOIN (조건이 복잡한 경우 — 권장)
  const users = await userRepo
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.posts', 'post')
    .where('user.isActive = :isActive', { isActive: true })
    .getMany();
  ```

  | 방법 | 장점 | 단점 |
  |------|------|------|
  | `relations` 옵션 | 간단 | 조건 추가 어려움, 불필요한 컬럼 포함 |
  | `QueryBuilder` JOIN | 유연, 최적화 가능 | 코드가 길어짐 |
  | Eager Loading (`eager: true`) | 자동 | 항상 로드 → 불필요한 쿼리 발생 가능 |
  | Lazy Loading (`lazy: true`) | 필요할 때만 | Promise 기반, 실수로 N+1 유발하기 쉬움 |

  > **실무 권장**: `relations`는 간단한 경우에, 복잡한 쿼리는 `QueryBuilder`를 사용하라. Eager/Lazy Loading은 예측하기 어려운 쿼리를 유발하므로 사용을 지양한다.

  ### ⚠️ 자주 드는 의문 2: 트랜잭션 범위를 어디까지 잡아야 하나?

  ```typescript
  // ❌ 여러 Repository 작업이 분리된 경우 — 중간 실패 시 불일치 발생
  async createOrderBad(dto: CreateOrderDto) {
    await this.orderRepo.save(order);      // 성공
    await this.stockRepo.decrement(dto.productId); // 실패 → 주문은 생성됐지만 재고는 안 줄어듦
  }

  // ✅ QueryRunner로 트랜잭션 묶기
  async createOrder(dto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(Order, order);
      await queryRunner.manager.decrement(Stock, { productId: dto.productId }, 'count', 1);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  ```

  **트랜잭션 범위 기준:**
  - **단일 테이블 단순 CRUD** → 트랜잭션 불필요
  - **여러 테이블에 걸친 상태 변경** → 반드시 트랜잭션으로 묶기
  - **외부 API 호출이 포함된 경우** → 외부 API는 트랜잭션으로 롤백 불가 → 보상 트랜잭션(Saga) 또는 이벤트 기반 처리 고려

  ---

  ## Serialization — 응답 직렬화

  `ClassSerializerInterceptor`와 `class-transformer`를 이용해 **응답 데이터를 자동으로 변환/필터링**하는 기법이다.

  ### 핵심 데코레이터

  **`@Exclude()`** — 응답에서 특정 필드 제거 (비밀번호 등 민감 데이터):

  ```typescript
  import { Exclude } from 'class-transformer';

  export class UserEntity {
    id: number;
    firstName: string;
    lastName: string;

    @Exclude()
    password: string;

    constructor(partial: Partial<UserEntity>) {
      Object.assign(this, partial);
    }
  }
  ```

  **`@Expose()`** — 계산된 속성 추가:

  ```typescript
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  ```

  **`@Transform()`** — 커스텀 변환:

  ```typescript
  @Transform(({ value }) => value.name)
  role: RoleEntity;
  // role 객체 대신 role.name 문자열이 반환됨
  ```

  ### 적용 방법

  ```typescript
  @Controller('users')
  @UseInterceptors(ClassSerializerInterceptor)
  export class UsersController {
    @Get(':id')
    findOne(@Param('id') id: number): UserEntity {
      return new UserEntity({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        password: 'secret123', // @Exclude()로 응답에서 자동 제거됨
      });
    }
  }
  ```

  ### @SerializeOptions()

  직렬화 동작을 세밀하게 제어:

  ```typescript
  @SerializeOptions({
    excludePrefixes: ['_'],     // _로 시작하는 속성 제외
    type: UserEntity,           // 플레인 객체를 UserEntity로 자동 변환
  })
  @Get()
  findOne(): UserEntity {}
  ```

  > `ClassSerializerInterceptor`는 WebSocket과 Microservice에서도 동일하게 동작한다.

  ---

  ## Logger — 로깅

  ### 내장 Logger

  ```typescript
  import { Logger, Injectable } from '@nestjs/common';

  @Injectable()
  class MyService {
    private readonly logger = new Logger(MyService.name);

    doSomething() {
      this.logger.log('Doing something...');     // [MyService] Doing something...
      this.logger.warn('Warning message');
      this.logger.error('Error occurred', error.stack);
      this.logger.debug('Debug info');
      this.logger.verbose('Verbose info');
    }
  }
  ```

  ### 로그 레벨 설정

  ```typescript
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],         // 특정 레벨만 활성화
    // logger: false,                  // 로깅 완전 비활성화
  });
  ```

  사용 가능한 레벨: `'log'`, `'fatal'`, `'error'`, `'warn'`, `'debug'`, `'verbose'`

  ### ConsoleLogger 옵션

  ```typescript
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,        // JSON 포맷 (로그 수집기 연동용)
      colors: false,     // 색상 비활성화
      timestamp: true,   // 타임스탬프 표시
      prefix: 'MyApp',   // 접두사 변경 (기본: "Nest")
      compact: true,     // 한 줄 포맷
    }),
  });
  ```

  ### JSON 로깅 (프로덕션 권장)

  AWS ECS, 로그 수집기 등과 연동할 때 유용하다:

  ```json
  {
    "level": "log",
    "pid": 19096,
    "timestamp": 1607370779834,
    "message": "Starting Nest application...",
    "context": "NestFactory"
  }
  ```

  ### 커스텀 로거

  기본 로거를 확장하여 커스터마이징:

  ```typescript
  import { ConsoleLogger } from '@nestjs/common';

  export class MyLogger extends ConsoleLogger {
    error(message: any, stack?: string, context?: string) {
      // 커스텀 로직 (예: 외부 모니터링 서비스로 전송)
      super.error(...arguments); // 기본 동작도 유지
    }
  }
  ```

  DI를 지원하는 커스텀 로거:

  ```typescript
  @Injectable({ scope: Scope.TRANSIENT })
  export class MyLogger extends ConsoleLogger {
    customLog() {
      this.log('Custom log message');
    }
  }

  // 모듈 정의
  @Module({
    providers: [MyLogger],
    exports: [MyLogger],
  })
  export class LoggerModule {}

  // 서비스에서 사용
  @Injectable()
  export class CatsService {
    constructor(private myLogger: MyLogger) {
      this.myLogger.setContext('CatsService');
    }
  }
  ```

  시스템 로깅에도 커스텀 로거 적용:

  ```typescript
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // 커스텀 로거 연결 전 로그를 버퍼링
  });
  app.useLogger(app.get(MyLogger));
  ```

  ### 외부 로깅 라이브러리

  프로덕션에서는 **Pino** (고성능) 또는 **Winston** (다기능)을 권장한다.

  Nest 공식 문서는 `LoggerService`를 구현한 커스텀 로거를 `app.useLogger()`로 붙이는 패턴을 권장한다.  
  아래 예제는 그 패턴 위에 Pino/Winston 공식 API를 얹은 실전형 구성이다.

  > **실무 추론**: 아래 예제의 뼈대인 `LoggerService` 구현과 `bufferLogs` + `app.useLogger()` 연결은 Nest 공식 문서 기반이다.  
  > 다만 Pino/Winston 클래스로 감싸는 구체적인 방식은 각 로거의 공식 API를 Nest 구조에 맞게 적용한 실무 패턴이다.

  ### Pino 연동 예제

  ```bash
  npm i pino
  ```

  ```typescript
  import { Injectable, LoggerService } from '@nestjs/common';
  import pino from 'pino';

  @Injectable()
  export class PinoLogger implements LoggerService {
    private readonly logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
    });

    log(message: any, ...optionalParams: any[]) {
      this.logger.info({ optionalParams }, String(message));
    }

    error(message: any, ...optionalParams: any[]) {
      const [stack, context] = optionalParams;
      this.logger.error({ stack, context }, String(message));
    }

    warn(message: any, ...optionalParams: any[]) {
      this.logger.warn({ optionalParams }, String(message));
    }

    debug(message: any, ...optionalParams: any[]) {
      this.logger.debug({ optionalParams }, String(message));
    }

    verbose(message: any, ...optionalParams: any[]) {
      this.logger.trace({ optionalParams }, String(message));
    }

    fatal(message: any, ...optionalParams: any[]) {
      this.logger.fatal({ optionalParams }, String(message));
    }
  }
  ```

  ```typescript
  @Module({
    providers: [PinoLogger],
    exports: [PinoLogger],
  })
  export class LoggerModule {}

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoLogger));
  ```

  ### Winston 연동 예제

  ```bash
  npm i winston
  ```

  ```typescript
  import { Injectable, LoggerService } from '@nestjs/common';
  import { createLogger, format, transports } from 'winston';

  @Injectable()
  export class WinstonLogger implements LoggerService {
    private readonly logger = createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      ),
      transports: [new transports.Console()],
    });

    log(message: any, ...optionalParams: any[]) {
      this.logger.info(String(message), { optionalParams });
    }

    error(message: any, ...optionalParams: any[]) {
      const [stack, context] = optionalParams;
      this.logger.error(String(message), { stack, context });
    }

    warn(message: any, ...optionalParams: any[]) {
      this.logger.warn(String(message), { optionalParams });
    }

    debug(message: any, ...optionalParams: any[]) {
      this.logger.debug(String(message), { optionalParams });
    }

    verbose(message: any, ...optionalParams: any[]) {
      this.logger.verbose(String(message), { optionalParams });
    }

    fatal(message: any, ...optionalParams: any[]) {
      this.logger.error(String(message), {
        severity: 'fatal',
        optionalParams,
      });
    }
  }
  ```

  ```typescript
  @Module({
    providers: [WinstonLogger],
    exports: [WinstonLogger],
  })
  export class LoggerModule {}

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(WinstonLogger));
  ```

  ### 무엇을 고르면 좋은가

  > **실무 추론**: 아래 판단은 Nest 공식 문서의 `LoggerService` 확장 패턴과 Pino/Winston 공식 API를 조합한 운영 기준이다.

  | 선택 | 유리한 상황 | trade-off |
  |------|-------------|-----------|
  | **Pino** | 고트래픽 JSON 로그, 낮은 오버헤드, 중앙 수집기 연동 | 포맷팅/다중 transport는 직접 설계가 더 필요 |
  | **Winston** | 파일/콘솔/외부 전송 등 transport 구성이 많을 때 | Pino보다 무겁고 설정이 길어지기 쉽다 |

  즉, "빠르고 단순한 구조화 로그"가 우선이면 Pino, "여러 출력 채널과 포맷 조합"이 중요하면 Winston이 더 잘 맞는다.

  ---

  ## HTTP Module — 외부 API 호출

  NestJS는 `@nestjs/axios` 패키지를 통해 Axios 기반의 HTTP 클라이언트를 제공한다. 외부 REST API 호출에 사용된다.

  ### 설치

  ```bash
  npm i @nestjs/axios axios
  ```

  ### 모듈 등록

  ```typescript
  @Module({
    imports: [HttpModule],
    providers: [CatsService],
  })
  export class CatsModule {}
  ```

  ### HttpService 사용

  `HttpService`의 모든 메서드는 **RxJS Observable**을 반환한다.

  ```typescript
  @Injectable()
  export class CatsService {
    constructor(private readonly httpService: HttpService) {}

    findAll(): Observable<AxiosResponse<Cat[]>> {
      return this.httpService.get('http://localhost:3000/cats');
    }
  }
  ```

  Promise가 필요하면 `firstValueFrom()`을 사용:

  ```typescript
  import { firstValueFrom } from 'rxjs';

  const { data } = await firstValueFrom(
    this.httpService.get('http://localhost:3000/cats'),
  );
  ```

  ### Axios 설정

  ```typescript
  @Module({
    imports: [
      HttpModule.register({
        timeout: 5000,
        maxRedirects: 5,
      }),
    ],
  })
  export class CatsModule {}
  ```

  ### 비동기 설정 (ConfigService 연동)

  ```typescript
  HttpModule.registerAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      timeout: configService.get('HTTP_TIMEOUT'),
      maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
    }),
    inject: [ConfigService],
  })
  ```

  ### Axios 인터셉터 활용

  요청/응답에 공통 로직을 적용할 수 있다 (토큰 첨부, 에러 변환 등):

  ```typescript
  @Injectable()
  export class ApiService implements OnModuleInit {
    constructor(private readonly httpService: HttpService) {}

    onModuleInit() {
      this.httpService.axiosRef.interceptors.request.use((config) => {
        config.headers['Authorization'] = `Bearer ${getToken()}`;
        return config;
      });
    }
  }
  ```

  ---

  ## File Upload — 파일 업로드

  NestJS는 Express의 **multer** 미들웨어를 기반으로 파일 업로드를 처리한다.

  ### 설치

  ```bash
  npm i -D @types/multer
  ```

  ### 단일 파일 업로드

  ```typescript
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }
  ```

  ### 파일 검증

  ```typescript
  @Post('file')
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 }),           // 최대 1KB
          new FileTypeValidator({ fileType: 'image/jpeg' }),     // JPEG만 허용
        ],
      }),
    )
    file: Express.Multer.File,
  ) {}
  ```

  ParseFilePipeBuilder로 더 간결하게:

  ```typescript
  @UploadedFile(
    new ParseFilePipeBuilder()
      .addFileTypeValidator({ fileType: 'jpeg' })
      .addMaxSizeValidator({ maxSize: 1000 })
      .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
  )
  file: Express.Multer.File,
  ```

  파일을 선택 사항으로 만들기: `build({ fileIsRequired: false })`

  ### 다중 파일 업로드

  ```typescript
  // 같은 필드의 여러 파일
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    console.log(files);
  }

  // 다른 필드의 파일들
  @Post('upload')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
    { name: 'background', maxCount: 1 },
  ]))
  uploadFiles(
    @UploadedFiles() files: {
      avatar?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {}

  // 어떤 필드든 상관없이
  @Post('upload')
  @UseInterceptors(AnyFilesInterceptor())
  uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {}
  ```

  ### Multer 모듈 설정

  ```typescript
  // 정적 설정
  MulterModule.register({
    dest: './upload',
  });

  // ConfigService 기반 비동기 설정
  MulterModule.registerAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      dest: configService.get<string>('MULTER_DEST'),
    }),
    inject: [ConfigService],
  });
  ```

  > **주의**: Multer는 `multipart/form-data` 형식만 처리 가능하며, FastifyAdapter와는 호환되지 않는다.

  ---

  ## Caching — 캐싱

  ### 설치

  ```bash
  npm install @nestjs/cache-manager cache-manager
  ```

  ### 기본 설정 (인메모리 캐시)

  ```typescript
  import { CacheModule } from '@nestjs/cache-manager';

  @Module({
    imports: [CacheModule.register({
      ttl: 5000,      // 기본 TTL (밀리초, 0이면 만료 없음)
      isGlobal: true,  // 전역 모듈로 등록
    })],
  })
  export class AppModule {}
  ```

  ### Cache Manager 직접 사용

  ```typescript
  import { CACHE_MANAGER } from '@nestjs/cache-manager';
  import { Cache } from 'cache-manager';

  @Injectable()
  export class CatsService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async getCat(id: string) {
      // 캐시 조회
      const cached = await this.cacheManager.get(`cat-${id}`);
      if (cached) return cached;

      // DB 조회 후 캐시 저장
      const cat = await this.findFromDb(id);
      await this.cacheManager.set(`cat-${id}`, cat, 10000); // 10초 TTL
      return cat;
    }

    async deleteCat(id: string) {
      await this.cacheManager.del(`cat-${id}`);  // 캐시 삭제
    }

    async clearAll() {
      await this.cacheManager.clear(); // 전체 캐시 초기화
    }
  }
  ```

  ### Auto-Caching (CacheInterceptor)

  GET 엔드포인트를 자동으로 캐싱:

  ```typescript
  // 컨트롤러 단위
  @Controller()
  @UseInterceptors(CacheInterceptor)
  export class AppController {
    @Get()
    findAll(): string[] {
      return [];
    }
  }

  // 글로벌 단위
  @Module({
    imports: [CacheModule.register()],
    providers: [{
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    }],
  })
  export class AppModule {}
  ```

  > **주의**: GET 엔드포인트만 캐싱되며, `@Res()`를 사용하는 라우트에서는 작동하지 않는다.

  ### 메서드별 캐시 설정

  ```typescript
  @Controller()
  @CacheTTL(50) // 컨트롤러 기본 TTL
  export class AppController {
    @CacheKey('custom_key')
    @CacheTTL(20)  // 메서드별 TTL (컨트롤러 설정보다 우선)
    @Get()
    findAll(): string[] {
      return [];
    }
  }
  ```

  ### Redis 캐시 스토어

  ```bash
  npm install @keyv/redis
  ```

  ```typescript
  import KeyvRedis from '@keyv/redis';

  CacheModule.registerAsync({
    useFactory: async () => ({
      stores: [
        new Keyv({ store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }) }),
        new KeyvRedis('redis://localhost:6379'),
      ],
    }),
  })
  ```

  > **비즈니스 로직을 수행하는 액션은 캐싱하지 말 것!** 단순히 데이터를 조회하는 경우에만 캐싱을 적용한다.

  ### ⚠️ 자주 드는 의문: 캐시 무효화(Cache Invalidation)는 어떻게?

  > "캐시 무효화는 컴퓨터 과학에서 가장 어려운 문제 중 하나다" — Phil Karlton

  캐시가 stale(낡은 데이터)해지는 상황을 어떻게 처리하나?

  #### 전략 1: TTL 만료 (가장 단순)
  ```typescript
  @CacheKey('all-products')
  @CacheTTL(60)  // 60초 후 자동 만료
  @UseInterceptors(CacheInterceptor)
  @Get()
  findAll() { return this.productsService.findAll(); }
  ```
  단점: 갱신 후에도 TTL이 지나야 반영 → 데이터 불일치 허용 범위가 있을 때만 사용

  #### 전략 2: 쓰기 시 직접 무효화 (Cache-aside + Eviction)
  ```typescript
  @Post()
  async create(dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    await this.cacheManager.del('all-products'); // 목록 캐시 즉시 삭제
    return product;
  }
  ```

  #### 전략 3: 이벤트 기반 무효화
  ```typescript
  @OnEvent('product.updated')
  async handleProductUpdated(event: ProductUpdatedEvent) {
    await this.cacheManager.del(`product:${event.id}`);
    await this.cacheManager.del('all-products');
  }
  ```

  | 전략 | 구현 난이도 | 일관성 | 적합한 경우 |
  |------|------------|--------|------------|
  | TTL 만료 | 쉬움 | 최종 일관성 | 실시간성이 낮아도 되는 데이터 (공지사항 등) |
  | 직접 무효화 | 중간 | 강한 일관성 | 자주 변경되는 데이터 |
  | 이벤트 기반 무효화 | 복잡 | 강한 일관성 | 여러 곳에서 같은 캐시를 무효화해야 할 때 |

  > **실무 권장**: 일반적으로 **TTL + 직접 무효화 조합**을 사용한다. 쓰기 시 `del()`을 호출하고, TTL은 안전망으로 설정한다.

  ---

  ## Queues — 작업 큐

  BullMQ(또는 Bull)를 사용하여 **비동기 작업 큐**를 처리한다. 이메일 발송, 이미지 처리, 데이터 동기화 등 시간이 오래 걸리는 작업을 백그라운드에서 처리할 때 유용하다.

  ### 설치

  ```bash
  npm i @nestjs/bullmq bullmq
  # Redis 필요 (큐 백엔드)
  ```

  ### 모듈 등록

  ```typescript
  @Module({
    imports: [
      BullModule.forRoot({
        connection: {
          host: 'localhost',
          port: 6379,
        },
      }),
      BullModule.registerQueue({
        name: 'audio',
      }),
    ],
  })
  export class AppModule {}
  ```

  ### Producer — 작업 추가

  ```typescript
  @Injectable()
  export class AudioService {
    constructor(@InjectQueue('audio') private audioQueue: Queue) {}

    async transcode() {
      await this.audioQueue.add('transcode', {
        file: 'audio.mp3',
      });
    }
  }
  ```

  ### Job 옵션

  ```typescript
  await this.audioQueue.add('transcode', { file: 'audio.mp3' }, {
    delay: 3000,              // 3초 후 실행
    attempts: 3,              // 최대 3회 재시도
    backoff: { type: 'exponential', delay: 1000 },
    priority: 1,              // 우선순위 (낮을수록 높음)
    removeOnComplete: true,   // 완료 후 삭제
  });
  ```

  ### Consumer — 작업 처리

  ```typescript
  @Processor('audio')
  export class AudioConsumer extends WorkerHost {
    async process(job: Job<any>): Promise<any> {
      let progress = 0;
      for (let i = 0; i < 100; i++) {
        // 변환 작업 수행
        progress += 1;
        await job.updateProgress(progress);
      }
      return { result: 'done' };
    }
  }
  ```

  ### 이벤트 리스너

  ```typescript
  @Processor('audio')
  export class AudioConsumer extends WorkerHost {
    async process(job: Job) { /* ... */ }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
      console.log(`Job ${job.id} completed`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
      console.error(`Job ${job.id} failed: ${error.message}`);
    }
  }
  ```

  > **핵심**: Producer는 큐에 작업을 넣기만 하고, Consumer가 별도로 처리한다. 이를 통해 **요청 응답 시간을 단축**하고 워커에서 무거운 작업을 수행할 수 있다.

  ---

  ## Task Scheduling — 작업 스케줄링

  ### 설치

  ```bash
  npm install --save @nestjs/schedule
  ```

  ```typescript
  @Module({
    imports: [ScheduleModule.forRoot()],
  })
  export class AppModule {}
  ```

  ### Cron Job (주기적 실행)

  ```typescript
  import { Injectable, Logger } from '@nestjs/common';
  import { Cron, CronExpression } from '@nestjs/schedule';

  @Injectable()
  export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    // 매분 45초에 실행
    @Cron('45 * * * * *')
    handleCron() {
      this.logger.debug('Called when the current second is 45');
    }

    // 편의 상수 사용
    @Cron(CronExpression.EVERY_30_SECONDS)
    handleEvery30Seconds() {
      this.logger.debug('Called every 30 seconds');
    }

    // 옵션 지정
    @Cron('0 0 * * * *', {
      name: 'notifications',
      timeZone: 'Asia/Seoul',
      waitForCompletion: true, // 이전 실행 완료 대기 (중복 방지)
    })
    triggerNotifications() {}
  }
  ```

  ### Cron 패턴

  ```
  * * * * * *
  │ │ │ │ │ │
  │ │ │ │ │ └── 요일 (0-7, 0과 7은 일요일)
  │ │ │ │ └──── 월 (1-12)
  │ │ │ └────── 일 (1-31)
  │ │ └──────── 시 (0-23)
  │ └────────── 분 (0-59)
  └──────────── 초 (0-59, 선택)
  ```

  | 패턴 | 설명 |
  |------|------|
  | `* * * * * *` | 매초 |
  | `45 * * * * *` | 매분 45초 |
  | `0 10 * * * *` | 매시 10분 |
  | `0 */30 9-17 * * *` | 오전 9시~오후 5시, 30분마다 |
  | `0 30 11 * * 1-5` | 평일 오전 11시 30분 |

  ### Interval (일정 간격 반복)

  ```typescript
  @Interval(10000) // 10초마다
  handleInterval() {
    this.logger.debug('Called every 10 seconds');
  }
  ```

  ### Timeout (일정 시간 후 1회 실행)

  ```typescript
  @Timeout(5000) // 5초 후 한 번만
  handleTimeout() {
    this.logger.debug('Called once after 5 seconds');
  }
  ```

  ### 동적 스케줄 관리

  `SchedulerRegistry`를 주입하여 런타임에 작업을 제어할 수 있다:

  ```typescript
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  // 크론 잡 제어
  const job = this.schedulerRegistry.getCronJob('notifications');
  job.stop();       // 중지
  job.start();      // 재시작
  job.lastDate();   // 마지막 실행 시각
  job.nextDate();   // 다음 실행 시각

  // 동적으로 크론 잡 생성
  addCronJob(name: string, seconds: string) {
    const job = new CronJob(`${seconds} * * * * *`, () => {
      this.logger.warn(`Job ${name} running!`);
    });
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }

  // 삭제
  this.schedulerRegistry.deleteCronJob('notifications');

  // 인터벌 제어
  const interval = this.schedulerRegistry.getInterval('myInterval');
  clearInterval(interval);
  this.schedulerRegistry.deleteInterval('myInterval');

  // 타임아웃 제어
  const timeout = this.schedulerRegistry.getTimeout('myTimeout');
  clearTimeout(timeout);
  this.schedulerRegistry.deleteTimeout('myTimeout');
  ```

  ### ⚠️ 멀티 인스턴스 환경에서의 중복 실행 문제

  `@nestjs/schedule`은 **프로세스 내부 타이머**로 동작한다. ECS, Kubernetes 등 다중 인스턴스 환경에서는 모든 인스턴스가 동시에 cron을 실행하여 **중복 처리**가 발생한다.

  ```
  ECS Task 1 ── @Cron('0 0 * * *') ── 실행 ✓
  ECS Task 2 ── @Cron('0 0 * * *') ── 실행 ✓  ← 중복!
  ECS Task 3 ── @Cron('0 0 * * *') ── 실행 ✓  ← 중복!
  ```

  #### 해결 방법 1: Redis 분산 락 (redlock)

  ```bash
  npm i redlock
  ```

  ```typescript
  import Redlock from 'redlock';

  @Injectable()
  export class TasksService {
    private redlock: Redlock;

    constructor(
      @InjectRedis() private readonly redis: Redis,
    ) {
      this.redlock = new Redlock([redis], { retryCount: 0 });
    }

    @Cron('0 0 * * *')
    async cleanExpiredCoupons() {
      try {
        // 락을 획득한 인스턴스만 실행, 나머지는 LockError로 건너뜀
        const lock = await this.redlock.acquire(['lock:cleanup-coupons'], 30_000);
        try {
          await this.couponService.deleteExpired();
        } finally {
          await lock.release();
        }
      } catch (e) {
        // 다른 인스턴스가 이미 실행 중 → 무시
      }
    }
  }
  ```

  #### 해결 방법 2: BullMQ jobId로 중복 방지 (권장)

  `@Cron`은 큐에 작업을 **추가**하기만 하고, 실제 실행은 BullMQ가 담당한다. 동일한 `jobId`가 이미 큐에 있으면 BullMQ가 자동으로 무시한다.

  ```typescript
  @Cron('0 0 * * *')
  async scheduleCouponCleanup() {
    // 3개 인스턴스가 모두 실행해도 jobId가 동일하면 1개만 큐에 유지
    await this.cleanupQueue.add(
      'cleanup-coupons',
      {},
      { jobId: 'cleanup-coupons-daily' },
    );
  }

  // Consumer (단일 처리 보장)
  @Processor('cleanup')
  export class CleanupConsumer extends WorkerHost {
    async process(job: Job) {
      await this.couponService.deleteExpired();
    }
  }
  ```

  #### 해결 방법 3: 스케줄러 인스턴스 분리

  ECS 서비스를 역할로 분리하여 스케줄러는 항상 1개만 유지:

  ```
  ECS Service: scheduler  (desiredCount: 1) ── @Cron 담당
  ECS Service: api        (desiredCount: N) ── HTTP 요청 담당
  ```

  #### 해결 방법 4: 외부 스케줄러로 위임

  앱 코드에서 `@Cron`을 완전히 제거하고 외부에서 HTTP로 트리거:

  ```
  AWS EventBridge (cron 표현식)
          │
          ▼
  POST /internal/jobs/cleanup  ── 단일 호출 → 단일 실행
  ```

  ```typescript
  // 외부 트리거용 내부 엔드포인트
  @Post('/internal/jobs/cleanup')
  @UseGuards(InternalApiKeyGuard) // 내부 서비스만 호출 가능
  async runCleanup() {
    await this.couponService.deleteExpired();
  }
  ```

  #### 방법 비교

  | 방법 | 복잡도 | 추천 상황 |
  |------|--------|----------|
  | Redis 분산 락 | 중 | 기존 Redis가 있을 때 |
  | BullMQ `jobId` 중복 방지 | 하 | 이미 BullMQ 사용 중일 때 |
  | 스케줄러 인스턴스 분리 | 중 | ECS 서비스를 역할별로 나눌 수 있을 때 |
  | AWS EventBridge → HTTP | 하 | AWS 인프라를 이미 활용 중일 때 |

  > **실무 권장**: Redis를 이미 쓰고 있다면 **BullMQ `jobId` 방식**이 추가 인프라 없이 가장 간단하다. AWS 환경이라면 **EventBridge → HTTP 트리거** 방식이 앱 코드를 단순하게 유지한다.

  ---

  ## Event Emitter — 이벤트 처리

  ### 설치

  ```bash
  npm i --save @nestjs/event-emitter
  ```

  ```typescript
  @Module({
    imports: [EventEmitterModule.forRoot()],
  })
  export class AppModule {}
  ```

  ### 이벤트 발행 (Emit)

  ```typescript
  import { EventEmitter2 } from '@nestjs/event-emitter';

  @Injectable()
  export class OrdersService {
    constructor(private eventEmitter: EventEmitter2) {}

    async createOrder(dto: CreateOrderDto) {
      const order = await this.saveOrder(dto);

      // 이벤트 발행
      this.eventEmitter.emit(
        'order.created',
        new OrderCreatedEvent({ orderId: order.id, payload: dto }),
      );

      return order;
    }
  }
  ```

  ### 이벤트 수신 (Listen)

  ```typescript
  @Injectable()
  export class NotificationsListener {
    @OnEvent('order.created')
    handleOrderCreatedEvent(payload: OrderCreatedEvent) {
      // 알림 발송, 로그 기록 등
    }

    // 비동기 처리
    @OnEvent('order.created', { async: true })
    async handleAsync(payload: OrderCreatedEvent) {
      await sendEmail(payload);
    }
  }
  ```

  ### 와일드카드 패턴

  ```typescript
  // 설정에서 활성화 필요: EventEmitterModule.forRoot({ wildcard: true })

  @OnEvent('order.*')
  handleAllOrderEvents(payload: any) {}

  @OnEvent('**')
  handleEverything(payload: any) {} // 모든 이벤트 수신
  ```

  ### 이벤트 유실 방지

  모듈 초기화 중에 발행된 이벤트가 유실되지 않도록:

  ```typescript
  await this.eventEmitterReadinessWatcher.waitUntilReady();
  this.eventEmitter.emit('order.created', payload);
  ```

  ### ⚠️ 자주 드는 의문: 멀티 인스턴스 환경에서 이벤트가 누락되지 않나?

  Task Scheduling이 **중복 실행** 문제라면, Event Emitter는 **반대 방향**의 문제다.

  `@nestjs/event-emitter`는 `eventemitter2` 기반 **인프로세스 이벤트**다. 발행한 이벤트는 같은 프로세스 안에서만 전파되고, **다른 인스턴스의 리스너에는 절대 도달하지 않는다.**

  ```
  클라이언트 → Instance 1: emit('order.created')
                 → Instance 1의 @OnEvent만 실행 ✓
                 → Instance 2의 @OnEvent에는 도달 안 함 ✗
  ```

  일반적인 요청 흐름(요청 받은 인스턴스에서 이벤트 발행 → 같은 인스턴스 리스너 처리)은 **문제없다.** 진짜 문제는 다음 두 경우다.

  #### 문제 케이스 1: 인메모리 캐시 무효화

  ```
  Instance 1: product.updated 이벤트 → Instance 1 캐시 삭제 ✓
  Instance 2: 이벤트 도달 안 함      → Instance 2 캐시는 여전히 stale ✗

  클라이언트가 Instance 2에 요청 → 오래된 데이터 반환
  ```

  #### 문제 케이스 2: WebSocket 알림 연동

  ```
  Instance 1: order.created 이벤트 → "WebSocket 알림 전송" 리스너 실행
              → 그런데 해당 사용자는 Instance 2의 WebSocket에 연결됨
              → 알림 도달 불가 ✗
  ```

  ---

  #### 해결 방법 1: 부수 효과는 BullMQ 큐로 위임 (권장)

  이벤트 핸들러에서 직접 처리하지 않고 큐에 작업을 추가한다. BullMQ는 Redis를 통해 **정확히 하나의 인스턴스만 처리**함을 보장한다.

  ```typescript
  // ❌ 인메모리 이벤트만으로 처리 — 이 인스턴스에서만 실행됨
  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedEvent) {
    await this.emailService.sendConfirmation(payload);
  }

  // ✅ 큐로 위임 — 어느 인스턴스든 단 한 번만 처리 보장
  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedEvent) {
    await this.emailQueue.add('send-confirmation', payload, {
      jobId: `order-confirm-${payload.orderId}`, // 동일 jobId → 중복 방지
    });
  }

  @Processor('email')
  export class EmailConsumer extends WorkerHost {
    async process(job: Job) {
      await this.emailService.sendConfirmation(job.data);
    }
  }
  ```

  #### 해결 방법 2: Redis Pub/Sub으로 교체 (크로스 인스턴스 이벤트 필요 시)

  모든 인스턴스의 리스너가 이벤트를 받아야 하는 경우 (예: 각 인스턴스의 인메모리 캐시 동시 무효화).

  ```typescript
  @Injectable()
  export class RedisEventService implements OnModuleInit {
    private pub: Redis;
    private sub: Redis;

    onModuleInit() {
      this.pub = new Redis(process.env.REDIS_URL);
      this.sub = new Redis(process.env.REDIS_URL);

      this.sub.subscribe('product.updated');
      this.sub.on('message', (channel, message) => {
        const payload = JSON.parse(message);
        this.clearLocalCache(payload.productId); // 각 인스턴스가 각자 실행
      });
    }

    publish(channel: string, payload: any) {
      this.pub.publish(channel, JSON.stringify(payload));
    }
  }
  ```

  ```
  Instance 1: publish('product.updated') → Redis Pub/Sub
                                                ↓
                                ┌───────────────┴───────────────┐
                         Instance 1 수신                 Instance 2 수신
                         캐시 무효화 ✓                   캐시 무효화 ✓
  ```

  #### 해결 방법 3: 인메모리 상태 자체를 없애기

  인메모리 캐시 동기화 문제는 **Redis 중앙 캐시**를 쓰면 근본적으로 해결된다.

  ```typescript
  // ❌ 인스턴스별 인메모리 캐시 → 인스턴스마다 다른 데이터
  private cache = new Map<string, Product>();

  // ✅ Redis 중앙 캐시 → 어느 인스턴스에서 조회해도 동일한 데이터
  @CacheKey('product:123')
  @UseInterceptors(CacheInterceptor)
  findOne(id: string) { ... }
  ```

  #### 방법 비교

  | 방법 | 처리 보장 | 복잡도 | 적합한 경우 |
  |------|---------|--------|------------|
  | BullMQ 큐 위임 | 정확히 1회 | 중간 | 이메일, 알림 등 부수 효과 처리 |
  | Redis Pub/Sub | 모든 인스턴스 1회씩 | 중간 | 각 인스턴스 인메모리 상태 동기화 |
  | Redis 중앙 캐시 | 해당 없음 | 낮음 | 인메모리 캐시 아예 제거 |

  #### 안전한 사용 범위 정리

  ```
  @nestjs/event-emitter 단독으로 안전한 경우 ✅
    - 같은 요청 흐름 안의 모듈 간 결합도 낮추기 (로깅, 감사 기록)
    - 외부 상태를 변경하지 않는 순수 내부 처리

  추가 대책 필요한 경우 ⚠️
    - 이메일/SMS 발송         → BullMQ 큐로 위임
    - 인메모리 캐시 무효화    → Redis 중앙 캐시로 교체
    - WebSocket 알림 트리거   → Redis Adapter + 큐 연동
    - 다른 서비스에 이벤트 전파 → Kafka / RabbitMQ / AWS SNS
  ```

  > **핵심 원칙**: `@nestjs/event-emitter`는 **같은 프로세스 안에서 모듈 간 결합도를 낮추는 도구**로만 쓴다. 프로세스 경계를 넘어야 하는 부수 효과는 반드시 외부 브로커(BullMQ, Redis Pub/Sub, MQ)를 통해 처리한다.

  ---

  ## Versioning — API 버전 관리

  API가 변경될 때 기존 클라이언트와의 호환성을 유지하면서 새 버전을 제공할 수 있다.

  ### 버전 관리 타입

  | 타입 | 예시 | 설정 |
  |------|------|------|
  | **URI** | `/v1/cats` | `VersioningType.URI` |
  | **Header** | `Custom-Header: 1` | `VersioningType.HEADER` |
  | **Media Type** | `Accept: application/json;v=1` | `VersioningType.MEDIA_TYPE` |

  ### 활성화 (main.ts)

  ```typescript
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,  // 가장 일반적
  });
  ```

  ### 컨트롤러/라우트 레벨 버전 지정

  ```typescript
  // 컨트롤러 전체에 버전 지정
  @Controller({ path: 'cats', version: '1' })
  export class CatsControllerV1 {
    @Get()
    findAll() { return 'v1 cats'; }
  }

  // 특정 라우트에만 버전 지정
  @Controller('cats')
  export class CatsController {
    @Version('1')
    @Get()
    findAllV1() { return 'v1 cats'; }

    @Version('2')
    @Get()
    findAllV2() { return 'v2 cats'; }
  }
  ```

  ### 다중 버전 지원

  ```typescript
  @Version(['1', '2'])
  @Get()
  findAll() { return 'v1 and v2 cats'; }
  ```

  ### 버전 중립 (VERSION_NEUTRAL)

  버전과 관계없이 항상 접근 가능한 라우트:

  ```typescript
  import { VERSION_NEUTRAL } from '@nestjs/common';

  @Controller({ path: 'cats', version: VERSION_NEUTRAL })
  export class CatsController {}
  ```

  ### 글로벌 기본 버전

  ```typescript
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    // defaultVersion: ['1', '2'],
  });
  ```

  > **팁**: URI 버전은 가장 직관적이고 디버깅이 쉽다. Header나 Media Type 방식은 클라이언트와의 계약이 더 중요하다.

---