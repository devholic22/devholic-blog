---
title: 'NestJS Core Guide'
date: '2026-03-22'
tags:
  - backend/nestjs
  - typescript/framework
  - backend/core
  - backend/nodejs
  - backend/architecture
description: 'NestJS 기초 아키텍처와 fundamentals만 읽기 쉽게 분리한 코어 가이드'
slug: nestjs-core-guide
content: |
  # NestJS Core Guide

  NestJS의 기초 구조와 핵심 구성 요소만 먼저 읽고 싶을 때 보는 분할본이다. 범위는 Part 1~2다.

  ## 읽기 경로

  - [Core](https://devholic.me/posts/nestjs-core-guide)
  - [Techniques](https://devholic.me/posts/nestjs-techniques-guide)
  - [Security + Recipes](https://devholic.me/posts/nestjs-security-recipes-guide)
  - [Advanced](https://devholic.me/posts/nestjs-advanced-guide)
  - [Guide Hub](https://devholic.me/posts/nestjs-beginner-guide)

  ## 이 문서에서 다루는 섹션

  - [NestJS란?](#nestjs란?)
  - [프로젝트 시작하기](#프로젝트-시작하기)
  - [핵심 아키텍처 개요](#핵심-아키텍처-개요)
  - [Module — 앱의 구조를 잡는 단위](#module-—-앱의-구조를-잡는-단위)
  - [Controller — 요청을 받아 응답하기](#controller-—-요청을-받아-응답하기)
  - [Provider & Service — 비즈니스 로직과 DI](#provider-&-service-—-비즈니스-로직과-di)
  - [Middleware — 요청 전처리](#middleware-—-요청-전처리)
  - [Pipe — 데이터 변환과 유효성 검증](#pipe-—-데이터-변환과-유효성-검증)
  - [Guard — 인가(Authorization) 처리](#guard-—-인가(authorization)-처리)
  - [Interceptor — 요청/응답 가로채기](#interceptor-—-요청/응답-가로채기)
  - [Exception Filter — 예외 처리](#exception-filter-—-예외-처리)
  - [Custom Decorator — 나만의 데코레이터](#custom-decorator-—-나만의-데코레이터)
  - [Provider Scopes — 인스턴스 생명주기](#provider-scopes-—-인스턴스-생명주기)
  - [Circular Dependency — 순환 의존성 해결](#circular-dependency-—-순환-의존성-해결)

  ---

  # Part 1: 기초 (Overview)

  ---

  ## NestJS란?

  NestJS는 **Node.js 위에서 동작하는 서버 사이드 프레임워크**로, TypeScript를 기본으로 사용한다. Angular에서 영감을 받은 **모듈 기반 아키텍처**와 **데코레이터 패턴**을 통해 구조적이고 확장 가능한 백엔드 애플리케이션을 만들 수 있다.

  ### 왜 NestJS인가?

  | 특징 | 설명 |
  |------|------|
  | **구조화된 아키텍처** | Module/Controller/Service 패턴으로 코드 구조가 명확 |
  | **TypeScript 네이티브** | 타입 안전성과 IDE 자동완성 지원 |
  | **DI(의존성 주입)** | 클래스 간 느슨한 결합, 테스트 용이 |
  | **플랫폼 독립적** | Express(기본) 또는 Fastify 선택 가능 |
  | **풍부한 생태계** | ORM, GraphQL, WebSocket, 마이크로서비스 등 공식 지원 |

  ---

  ## 프로젝트 시작하기

  ### 설치 및 생성

  ```bash
  # NestJS CLI 전역 설치
  npm i -g @nestjs/cli

  # 새 프로젝트 생성
  nest new my-project
  ```

  > **요구사항**: Node.js 20 이상

  ### 생성되는 프로젝트 구조

  ```
  src/
  ├── app.controller.ts      # 기본 컨트롤러
  ├── app.controller.spec.ts # 컨트롤러 테스트
  ├── app.module.ts          # 루트 모듈
  ├── app.service.ts         # 기본 서비스
  └── main.ts                # 앱 진입점 (부트스트랩)
  ```

  ### 엔트리 포인트: main.ts

  ```typescript
  import { NestFactory } from '@nestjs/core';
  import { AppModule } from './app.module';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3000);
  }
  bootstrap();
  ```

  `NestFactory.create()`가 앱 인스턴스를 만들고, `listen()`으로 HTTP 서버를 시작한다.

  ### 개발 명령어

  ```bash
  npm run start        # 일반 실행
  npm run start:dev    # watch 모드 (파일 변경 시 자동 재시작)
  npm run lint         # 린트 검사
  npm run format       # 코드 포맷팅
  ```

  ---

  ## 핵심 아키텍처 개요

  NestJS의 요청 처리 흐름을 이해하는 것이 가장 중요하다. 아래 구성 요소들이 **레이어처럼 쌓여** 요청을 처리한다.

  ```
  클라이언트 요청
       │
       ▼
   Middleware      ← 요청 전처리 (로깅, CORS 등)
       │
       ▼
     Guard         ← 인가 검사 (접근 권한 확인)
       │
       ▼
   Interceptor     ← 요청 가로채기 (전처리)
       │
       ▼
     Pipe           ← 데이터 변환/유효성 검증
       │
       ▼
   Controller      ← 라우트 핸들러 실행
       │
       ▼
    Service         ← 비즈니스 로직 처리
       │
       ▼
   Interceptor     ← 응답 가로채기 (후처리)
       │
       ▼
  Exception Filter ← 예외 발생 시 에러 응답 가공
       │
       ▼
  클라이언트 응답
  ```

  ---

  ## Module — 앱의 구조를 잡는 단위

  모듈은 **관련 기능을 하나로 묶는 조직 단위**다. 모든 NestJS 앱에는 최소 하나의 **루트 모듈**(AppModule)이 필요하다.

  ### `@Module()` 데코레이터의 4가지 속성

  | 속성 | 역할 |
  |------|------|
  | `providers` | 모듈 내에서 사용할 서비스 (DI 컨테이너가 관리) |
  | `controllers` | 이 모듈이 가진 컨트롤러 |
  | `imports` | 이 모듈이 필요로 하는 외부 모듈 |
  | `exports` | 다른 모듈에 공개할 프로바이더 |

  ### 기본 모듈 예시

  ```typescript
  // cats.module.ts
  @Module({
    controllers: [CatsController],
    providers: [CatsService],
  })
  export class CatsModule {}
  ```

  ### 모듈 공유 (Shared Module)

  모듈은 기본적으로 **싱글톤**이다. `exports`에 등록하면 다른 모듈에서 같은 인스턴스를 공유할 수 있다.

  ```typescript
  @Module({
    controllers: [CatsController],
    providers: [CatsService],
    exports: [CatsService], // 외부에 공개
  })
  export class CatsModule {}
  ```

  이제 `CatsModule`을 import하는 모든 모듈에서 `CatsService`를 주입받아 사용할 수 있다.

  ### 모듈 리-익스포트

  import한 모듈을 다시 export하여 상위 모듈에 전파할 수 있다.

  ```typescript
  @Module({
    imports: [CommonModule],
    exports: [CommonModule], // CommonModule을 import하는 쪽에서도 사용 가능
  })
  export class CoreModule {}
  ```

  ### 글로벌 모듈

  `@Global()` 데코레이터를 붙이면 어디서든 import 없이 사용 가능하다. 단, **남용은 금물** — `imports` 배열을 통한 명시적 의존성 관리가 더 좋은 설계다.

  ```typescript
  @Global()
  @Module({
    providers: [CatsService],
    exports: [CatsService],
  })
  export class CatsModule {}
  ```

  ### 동적 모듈 (Dynamic Module)

  런타임에 설정을 주입해서 모듈을 유연하게 구성할 수 있다. 대표적으로 DB 연결 설정에 활용된다.

  ```typescript
  export class DatabaseModule {
    static forRoot(entities = [], options?): DynamicModule {
      const providers = createDatabaseProviders(options, entities);
      return {
        module: DatabaseModule,
        providers: providers,
        exports: providers,
      };
    }
  }

  // 사용
  @Module({
    imports: [DatabaseModule.forRoot([User])],
  })
  export class AppModule {}
  ```

  > **`forRoot()` vs `forFeature()` 패턴**: `forRoot()`는 루트 모듈에서 한 번 호출하여 전역 설정을, `forFeature()`는 각 기능 모듈에서 호출하여 모듈별 설정을 한다.

  ### 모듈에서의 DI

  모듈 클래스 자체도 프로바이더를 주입받을 수 있다 (설정용도).

  ```typescript
  @Module({
    controllers: [CatsController],
    providers: [CatsService],
  })
  export class CatsModule {
    constructor(private catsService: CatsService) {}
  }
  ```

  단, 모듈 클래스 자체는 순환 의존성 제약 때문에 다른 곳에 주입될 수 없다.

  ### ⚠️ 자주 드는 의문 1: Global 모듈이 편한데 왜 남용하면 안 되나?

  ```typescript
  // 유혹: 다 Global로 만들면 imports 배열 안 써도 되잖아?
  @Global()
  @Module({ providers: [UserService, OrderService, ProductService], exports: [...] })
  export class EverythingModule {}
  ```

  **문제점:**
  - **의존성 추적 불가**: 어떤 모듈이 무엇을 쓰는지 `imports` 배열로 파악할 수 없음
  - **테스트 격리 불가**: 특정 모듈만 독립적으로 테스트하기 어려워짐
  - **순환 의존성 위험 증가**: 전역 모듈이 많아지면 암묵적 결합이 생김

  **Global 모듈이 적합한 경우:**
  - `ConfigModule`, `LoggerModule`, `DatabaseModule` 처럼 **앱 전역에서 항상 필요한 인프라성 모듈** 1~3개

  ### ⚠️ 자주 드는 의문 2: 모듈이 많아지면 어떻게 구조화하나?

  ```
  // 권장 모듈 구조
  AppModule
  ├── CoreModule (Global)       ← DB, Config, Logger 등 인프라
  ├── SharedModule (exports)    ← 공통 유틸, 공통 Guard/Pipe
  └── Feature Modules
      ├── UsersModule
      ├── ProductsModule
      └── OrdersModule
  ```

  ```typescript
  // shared.module.ts — 공통 기능을 한 곳에서 관리
  @Module({
    providers: [JwtAuthGuard, RolesGuard],
    exports: [JwtAuthGuard, RolesGuard],
  })
  export class SharedModule {}

  // feature 모듈에서
  @Module({ imports: [SharedModule] })
  export class OrdersModule {}
  ```

  | 모듈 종류 | 역할 | `@Global()` 여부 |
  |----------|------|-----------------|
  | `AppModule` | 루트, 전체 조립 | 불필요 |
  | `CoreModule` | DB, Config, Logger | ✅ 적합 |
  | `SharedModule` | Guard, Pipe, 공통 서비스 | 선택 (imports가 번거로우면 Global) |
  | Feature Module | 비즈니스 도메인 | ❌ 절대 Global 금지 |

  ---

  ## Controller — 요청을 받아 응답하기

  컨트롤러는 **HTTP 요청을 받아서 응답을 보내는 역할**을 한다. 라우팅 메커니즘이 어떤 컨트롤러가 어떤 요청을 처리할지 결정한다.

  ### 기본 컨트롤러

  ```typescript
  import { Controller, Get, Post, Body, Param, Query, HttpCode, Header } from '@nestjs/common';

  @Controller('cats') // 라우트 prefix: /cats
  export class CatsController {

    @Get() // GET /cats
    findAll(): string {
      return 'This action returns all cats';
    }

    @Get(':id') // GET /cats/:id
    findOne(@Param('id') id: string): string {
      return `This action returns a #${id} cat`;
    }

    @Post() // POST /cats
    @HttpCode(201)
    @Header('Cache-Control', 'no-store')
    create(@Body() createCatDto: CreateCatDto) {
      return 'This action adds a new cat';
    }
  }
  ```

  ### HTTP 메서드 데코레이터

  `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`, `@Options()`, `@Head()`, `@All()`

  ### 매개변수 데코레이터

  | 데코레이터 | Express 대응 |
  |------------|-------------|
  | `@Req()` | `req` |
  | `@Res()` | `res` |
  | `@Param(key?)` | `req.params` / `req.params[key]` |
  | `@Body(key?)` | `req.body` / `req.body[key]` |
  | `@Query(key?)` | `req.query` / `req.query[key]` |
  | `@Headers(name?)` | `req.headers` / `req.headers[name]` |
  | `@Ip()` | `req.ip` |

  ### DTO (Data Transfer Object)

  요청 데이터의 형태를 정의하는 객체. **class로 선언**해야 런타임에도 타입 정보가 유지된다 (interface는 컴파일 후 사라짐).

  ```typescript
  export class CreateCatDto {
    name: string;
    age: number;
    breed: string;
  }
  ```

  ### 비동기 핸들러

  Promise와 RxJS Observable 모두 지원한다.

  ```typescript
  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
  ```

  ### 응답 처리 방식

  **표준 방식 (권장)**: 객체/배열을 반환하면 자동으로 JSON 직렬화. GET은 200, POST는 201이 기본 상태 코드.

  **라이브러리 방식**: `@Res()`로 네이티브 응답 객체에 직접 접근. 플랫폼 호환성이 떨어지므로 비권장. 두 방식을 혼합하려면 `@Res({ passthrough: true })` 사용.

  ### 서브도메인 라우팅

  ```typescript
  @Controller({ host: 'admin.example.com' })
  export class AdminController {
    @Get()
    index(): string {
      return 'Admin page';
    }
  }
  ```

  ---

  ## Provider & Service — 비즈니스 로직과 DI

  ### Provider란?

  Provider는 NestJS의 **의존성 주입(DI) 시스템**에서 관리되는 클래스다. 서비스, 리포지토리, 팩토리, 헬퍼 등 다양한 클래스가 Provider가 될 수 있다.

  핵심 아이디어: **객체 간의 관계(의존성)를 NestJS 런타임이 자동으로 연결**해준다.

  ### Service 만들기

  `@Injectable()` 데코레이터가 이 클래스가 DI 컨테이너에 의해 관리됨을 선언한다.

  ```typescript
  import { Injectable } from '@nestjs/common';
  import { Cat } from './interfaces/cat.interface';

  @Injectable()
  export class CatsService {
    private readonly cats: Cat[] = [];

    create(cat: Cat) {
      this.cats.push(cat);
    }

    findAll(): Cat[] {
      return this.cats;
    }
  }
  ```

  ### 의존성 주입 (Dependency Injection)

  **생성자 주입**이 가장 일반적인 방법이다. TypeScript의 타입 시스템을 이용해 자동으로 의존성을 해결한다.

  ```typescript
  @Controller('cats')
  export class CatsController {
    // CatsService가 자동으로 주입됨
    constructor(private catsService: CatsService) {}

    @Get()
    async findAll(): Promise<Cat[]> {
      return this.catsService.findAll();
    }
  }
  ```

  > **DI가 왜 좋은가?**
  > - 컨트롤러는 서비스를 직접 생성하지 않는다 → **느슨한 결합**
  > - 테스트 시 목(mock) 서비스를 쉽게 주입 가능 → **테스트 용이**
  > - 싱글톤으로 관리되어 **메모리 효율적**

  ### 프로퍼티 기반 주입

  생성자 대신 프로퍼티에 직접 주입하는 것도 가능하다.

  ```typescript
  @Injectable()
  export class HttpService<T> {
    @Inject('HTTP_OPTIONS')
    private readonly httpClient: T;
  }
  ```

  ### Custom Provider 패턴

  `providers` 배열의 축약형 `[CatsService]`는 실제로 다음과 동일하다:

  ```typescript
  providers: [
    {
      provide: CatsService,
      useClass: CatsService,
    },
  ]
  ```

  이를 확장하면 다양한 커스텀 프로바이더를 만들 수 있다:

  ```typescript
  // Value Provider — 상수, 외부 라이브러리, mock 객체 주입
  providers: [
    { provide: 'API_KEY', useValue: 'my-secret-key' },
  ]

  // Factory Provider — 조건부/동적 프로바이더 생성
  providers: [
    {
      provide: 'CONNECTION',
      useFactory: (optionsProvider: OptionsProvider) => {
        const options = optionsProvider.get();
        return new DatabaseConnection(options);
      },
      inject: [OptionsProvider], // 팩토리 함수에 주입될 의존성
    },
  ]

  // Alias Provider — 기존 프로바이더를 다른 이름으로 참조
  providers: [
    { provide: 'AliasedService', useExisting: CatsService },
  ]
  ```

  ### 모듈에 등록

  Provider는 반드시 모듈의 `providers` 배열에 등록해야 한다.

  ```typescript
  @Module({
    controllers: [CatsController],
    providers: [CatsService],
  })
  export class AppModule {}
  ```

  ---

  ## Middleware — 요청 전처리

  미들웨어는 **라우트 핸들러가 실행되기 전**에 실행되는 함수다. Express의 미들웨어와 동일한 개념이다.

  ### 미들웨어가 할 수 있는 것
  - 코드 실행
  - 요청/응답 객체 변경
  - 요청-응답 사이클 종료
  - `next()` 호출로 다음 미들웨어에 제어 전달
  - `next()`를 호출하지 않으면 요청이 **멈춘다** (hang)

  ### 클래스 기반 미들웨어

  DI를 활용해야 할 때 사용한다.

  ```typescript
  import { Injectable, NestMiddleware } from '@nestjs/common';
  import { Request, Response, NextFunction } from 'express';

  @Injectable()
  export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
      console.log(`[${req.method}] ${req.url}`);
      next();
    }
  }
  ```

  ### 함수형 미들웨어

  의존성이 필요 없는 단순한 경우에 사용한다.

  ```typescript
  export function logger(req: Request, res: Response, next: NextFunction) {
    console.log(`Request...`);
    next();
  }
  ```

  ### 미들웨어 적용

  모듈의 `configure()` 메서드에서 `MiddlewareConsumer`를 통해 적용한다.

  ```typescript
  @Module({ imports: [CatsModule] })
  export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(LoggerMiddleware)
        .forRoutes('cats'); // 특정 라우트에만 적용
    }
  }
  ```

  ### 다양한 적용 방법

  ```typescript
  // 특정 HTTP 메서드에만
  consumer
    .apply(LoggerMiddleware)
    .forRoutes({ path: 'cats', method: RequestMethod.GET });

  // 특정 컨트롤러에
  consumer
    .apply(LoggerMiddleware)
    .forRoutes(CatsController);

  // 특정 라우트 제외
  consumer
    .apply(LoggerMiddleware)
    .exclude(
      { path: 'cats', method: RequestMethod.GET },
      { path: 'cats', method: RequestMethod.POST },
      'cats/{*splat}',
    )
    .forRoutes(CatsController);

  // 여러 미들웨어 체이닝
  consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);

  // 와일드카드 라우트
  consumer
    .apply(LoggerMiddleware)
    .forRoutes({ path: 'abcd/*splat', method: RequestMethod.ALL });
  ```

  ### 글로벌 미들웨어

  ```typescript
  const app = await NestFactory.create(AppModule);
  app.use(logger); // 모든 라우트에 적용 (DI 사용 불가)
  await app.listen(3000);
  ```

  > **주의**: `app.use()`로 등록한 글로벌 미들웨어는 DI 컨테이너에 접근할 수 없다. 클래스 미들웨어를 글로벌하게 쓰려면 `.forRoutes('*')`를 사용하자.

  ---

  ## Pipe — 데이터 변환과 유효성 검증

  파이프는 **컨트롤러 핸들러의 인자를 처리**하는 데 사용된다. 두 가지 핵심 역할이 있다:

  1. **변환(Transformation)**: 입력 데이터를 원하는 형태로 변환 (예: 문자열 → 숫자)
  2. **검증(Validation)**: 입력 데이터가 유효한지 확인, 유효하지 않으면 예외 발생

  ### 내장 파이프

  NestJS가 기본 제공하는 파이프들:

  | 파이프 | 역할 |
  |--------|------|
  | `ValidationPipe` | DTO 기반 유효성 검증 |
  | `ParseIntPipe` | 문자열 → 정수 변환 |
  | `ParseFloatPipe` | 문자열 → 실수 변환 |
  | `ParseBoolPipe` | 문자열 → 불리언 변환 |
  | `ParseArrayPipe` | 배열 파싱 |
  | `ParseUUIDPipe` | UUID 검증 |
  | `ParseEnumPipe` | 열거형 검증 |
  | `DefaultValuePipe` | 기본값 설정 |
  | `ParseFilePipe` | 파일 업로드 검증 |
  | `ParseDatePipe` | 날짜 파싱 |

  ### 파이프 사용 예시

  ```typescript
  // 파라미터에 직접 바인딩
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catsService.findOne(id);
  }
  // GET /cats/abc → 400 Bad Request (숫자가 아니므로)
  // GET /cats/1   → id = 1 (number 타입)

  // 에러 상태 코드 커스터마이징
  @Get(':id')
  async findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number,
  ) {}

  // 기본값 + 파이프 체이닝
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly: boolean,
  ) {}
  ```

  ### 커스텀 파이프 만들기

  `PipeTransform` 인터페이스를 구현한다. `transform(value, metadata)` 메서드가 핵심이다.

  ```typescript
  import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

  @Injectable()
  export class ParseIntPipe implements PipeTransform<string, number> {
    transform(value: string, metadata: ArgumentMetadata): number {
      const val = parseInt(value, 10);
      if (isNaN(val)) {
        throw new BadRequestException('Validation failed');
      }
      return val;
    }
  }
  ```

  `ArgumentMetadata`의 구조:
  - `type`: `'body' | 'query' | 'param' | 'custom'`
  - `metatype`: 인자의 타입 (예: `String`, `CreateCatDto`)
  - `data`: 데코레이터에 전달된 문자열 (예: `@Body('name')`의 `'name'`)

  ### class-validator를 이용한 DTO 검증

  실무에서 가장 많이 사용되는 검증 패턴이다.

  ```bash
  npm i class-validator class-transformer
  ```

  ```typescript
  // DTO 정의
  import { IsString, IsInt } from 'class-validator';

  export class CreateCatDto {
    @IsString()
    name: string;

    @IsInt()
    age: number;

    @IsString()
    breed: string;
  }
  ```

  ```typescript
  // 글로벌 ValidationPipe 등록 (가장 간편한 방법)
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(3000);
  }
  ```

  이렇게 하면 **모든 엔드포인트에서 DTO 데코레이터 기반 자동 검증**이 적용된다.

  ### Zod를 이용한 스키마 기반 검증

  ```typescript
  import { z } from 'zod';

  export const createCatSchema = z.object({
    name: z.string(),
    age: z.number(),
    breed: z.string(),
  }).required();

  export type CreateCatDto = z.infer<typeof createCatSchema>;
  ```

  ```typescript
  export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) {}

    transform(value: unknown, metadata: ArgumentMetadata) {
      try {
        return this.schema.parse(value);
      } catch (error) {
        throw new BadRequestException('Validation failed');
      }
    }
  }

  // 사용
  @Post()
  @UsePipes(new ZodValidationPipe(createCatSchema))
  async create(@Body() createCatDto: CreateCatDto) {}
  ```

  ### 글로벌 파이프 등록 (모듈 방식, DI 지원)

  ```typescript
  @Module({
    providers: [
      {
        provide: APP_PIPE,
        useClass: ValidationPipe,
      },
    ],
  })
  export class AppModule {}
  ```

  ---

  ## Guard — 인가(Authorization) 처리

  가드는 **요청이 라우트 핸들러에 도달할 수 있는지 결정**한다. 주로 인증/인가(역할 기반 접근 제어)에 사용한다.

  > **미들웨어와의 핵심 차이**: 미들웨어는 `next()`만 알고 다음에 어떤 핸들러가 실행될지 모른다. 가드는 `ExecutionContext`에 접근 가능하여 **다음에 어떤 핸들러가 실행될지 정확히 알 수 있다.** 이것이 선언적이고 DRY한 인가 처리를 가능하게 한다.

  ### 실행 순서

  ```
  Middleware → Guard → Interceptor → Pipe → Handler
  ```

  ### 기본 가드

  `CanActivate` 인터페이스를 구현한다. `true` 반환 시 요청 진행, `false` 시 403 Forbidden.

  ```typescript
  import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

  @Injectable()
  export class AuthGuard implements CanActivate {
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest();
      return validateRequest(request); // 인증 로직
    }
  }
  ```

  ### 역할 기반 접근 제어 (RBAC)

  **1단계: 역할 데코레이터 만들기**

  ```typescript
  import { Reflector } from '@nestjs/core';

  export const Roles = Reflector.createDecorator<string[]>();
  ```

  **2단계: 핸들러에 역할 지정**

  ```typescript
  @Post()
  @Roles(['admin'])
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }
  ```

  **3단계: 가드에서 역할 확인**

  ```typescript
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
      const roles = this.reflector.get(Roles, context.getHandler());
      if (!roles) return true; // 역할 지정 안 된 라우트는 통과

      const request = context.switchToHttp().getRequest();
      const user = request.user;
      return matchRoles(roles, user.roles);
    }
  }
  ```

  ### 가드 바인딩

  ```typescript
  // 컨트롤러 레벨
  @Controller('cats')
  @UseGuards(RolesGuard)
  export class CatsController {}

  // 글로벌 레벨 (DI 미지원)
  app.useGlobalGuards(new RolesGuard());

  // 모듈 레벨 (DI 지원)
  @Module({
    providers: [{ provide: APP_GUARD, useClass: RolesGuard }],
  })
  export class AppModule {}
  ```

  ### 에러 응답

  권한 부족 시 자동으로 403 응답이 반환된다:

  ```json
  {
    "statusCode": 403,
    "message": "Forbidden resource",
    "error": "Forbidden"
  }
  ```

  커스텀 예외로 변경 가능: `throw new UnauthorizedException();`

  ### ⚠️ 자주 드는 의문: Guard vs Middleware — 인증은 어디서?

  Guard와 Middleware 모두 요청을 차단할 수 있다. 어디서 인증 검증을 해야 할까?

  | 비교 항목 | Middleware | Guard |
  |-----------|-----------|-------|
  | 실행 위치 | 라우팅 전 | 라우팅 후, 핸들러 직전 |
  | DI 컨테이너 접근 | ❌ 불가 | ✅ 가능 |
  | ExecutionContext 접근 | ❌ 불가 | ✅ 가능 (HTTP/WS/RPC 구분) |
  | 반환값 | `next()` 호출 | `boolean` 또는 `Observable<boolean>` |
  | 사용 목적 | 로깅, CORS, 바디 파싱 등 | 인증, 인가, 역할 검사 |

  **결론**: JWT 검증처럼 `JwtService`나 `UserService`를 주입받아야 하는 로직은 반드시 **Guard**에서 처리해야 한다. Middleware는 DI가 안 되기 때문에 서비스를 주입받을 수 없다.

  ```typescript
  // ❌ Middleware에서 JWT 검증 — 불가능
  export class AuthMiddleware implements NestMiddleware {
    // JwtService를 주입받을 수 없음!
    use(req: Request, res: Response, next: NextFunction) {
      // jwt.verify()를 직접 호출해야 하므로 설정값을 하드코딩해야 함
    }
  }

  // ✅ Guard에서 JWT 검증 — DI 정상 작동
  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private jwtService: JwtService) { super(); }
  }
  ```

  > **실무 패턴**: Middleware는 요청 로깅, IP 추출, 요청 ID 부여처럼 **비즈니스 로직과 무관한 전처리**에, Guard는 **인증/인가**에 사용한다.

  ---

  ## Interceptor — 요청/응답 가로채기

  인터셉터는 **AOP(관점 지향 프로그래밍)** 에서 영감을 받은 개념으로, 핸들러 실행 전후에 로직을 삽입할 수 있다.

  ### 인터셉터로 할 수 있는 것
  - 핸들러 실행 전/후에 로직 추가
  - 반환 값 변환
  - 예외 변환
  - 함수 동작 확장
  - 조건부로 함수 오버라이드 (예: 캐싱)

  ### 핵심 개념: CallHandler

  `CallHandler`의 `handle()` 메서드가 라우트 핸들러를 호출한다. **`handle()`을 호출하지 않으면 핸들러는 아예 실행되지 않는다.** 반환값은 RxJS Observable이므로 RxJS 연산자를 이용해 응답 스트림을 자유롭게 조작할 수 있다.

  ### 1. 로깅 인터셉터

  ```typescript
  import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';

  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      console.log('Before...');
      const now = Date.now();
      return next
        .handle() // 핸들러 실행
        .pipe(
          tap(() => console.log(`After... ${Date.now() - now}ms`)),
        );
    }
  }
  ```

  ### 2. 응답 변환 인터셉터

  모든 응답을 `{ data: ... }` 형태로 감싸기:

  ```typescript
  @Injectable()
  export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
      return next.handle().pipe(map(data => ({ data })));
    }
  }
  ```

  ### 3. 예외 변환 인터셉터

  ```typescript
  @Injectable()
  export class ErrorsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        catchError(err => throwError(() => new BadGatewayException())),
      );
    }
  }
  ```

  ### 4. 캐시 인터셉터

  조건에 따라 핸들러를 아예 건너뛰기:

  ```typescript
  @Injectable()
  export class CacheInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const isCached = true;
      if (isCached) {
        return of([]); // 핸들러를 호출하지 않고 캐시된 데이터 반환
      }
      return next.handle();
    }
  }
  ```

  ### 5. 타임아웃 인터셉터

  ```typescript
  @Injectable()
  export class TimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        timeout(5000),
        catchError(err => {
          if (err instanceof TimeoutError) {
            return throwError(() => new RequestTimeoutException());
          }
          return throwError(() => err);
        }),
      );
    }
  }
  ```

  ### 인터셉터 바인딩

  ```typescript
  // 컨트롤러 레벨
  @UseInterceptors(LoggingInterceptor)
  export class CatsController {}

  // 글로벌 레벨
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 모듈 레벨 (DI 지원)
  @Module({
    providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }],
  })
  export class AppModule {}
  ```

  ### ⚠️ 자주 드는 의문: RxJS Observable이 익숙하지 않다면?

  NestJS Interceptor는 RxJS `Observable`을 반환한다. Promise에 익숙한 개발자라면 이게 낯설 수 있다.

  **Promise로 변환하는 방법:**

  ```typescript
  import { firstValueFrom } from 'rxjs';

  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const start = Date.now();
      return next.handle().pipe(
        tap(() => console.log(`응답 시간: ${Date.now() - start}ms`)),
      );
    }
  }

  // 또는 async/await 스타일로 작성
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return new Observable(observer => {
      (async () => {
        try {
          const data = await firstValueFrom(next.handle());
          // async 로직 처리
          observer.next(data);
          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      })();
    });
  }
  ```

  **Observable을 유지해야 하는 이유:**

  | 항목 | Promise | Observable |
  |------|---------|-----------|
  | 취소 가능 | ❌ | ✅ (`unsubscribe`) |
  | 스트리밍 응답 | ❌ | ✅ |
  | RxJS 연산자 체이닝 | ❌ | ✅ (`pipe`, `tap`, `map`, `catchError`) |
  | 에러 변환 | try/catch만 | `catchError` 연산자로 선언적 처리 |

  > **결론**: 단순한 로깅/변환이면 `tap`, `map`만 써도 충분하다. Observable을 억지로 Promise로 바꾸면 스트리밍, 취소 같은 장점을 잃는다.

  ---

  ## Exception Filter — 예외 처리

  NestJS는 처리되지 않은 예외를 자동으로 잡아서 적절한 HTTP 응답으로 변환하는 **내장 예외 레이어**를 갖고 있다.

  ### 기본 동작

  인식되지 않는 예외가 발생하면:
  ```json
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

  ### 기본 HttpException

  ```typescript
  @Get()
  async findAll() {
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }
  // → { "statusCode": 403, "message": "Forbidden" }
  ```

  응답 본문 커스터마이징:

  ```typescript
  throw new HttpException({
    status: HttpStatus.FORBIDDEN,
    error: 'This is a custom message',
  }, HttpStatus.FORBIDDEN, {
    cause: error, // 로깅용 원인 에러
  });
  ```

  ### 내장 예외 클래스

  자주 사용하는 HTTP 에러에 대해 편의 클래스를 제공한다:

  | 클래스 | 상태 코드 |
  |--------|----------|
  | `BadRequestException` | 400 |
  | `UnauthorizedException` | 401 |
  | `ForbiddenException` | 403 |
  | `NotFoundException` | 404 |
  | `MethodNotAllowedException` | 405 |
  | `RequestTimeoutException` | 408 |
  | `ConflictException` | 409 |
  | `PayloadTooLargeException` | 413 |
  | `UnprocessableEntityException` | 422 |
  | `InternalServerErrorException` | 500 |
  | `BadGatewayException` | 502 |
  | `ServiceUnavailableException` | 503 |
  | `GatewayTimeoutException` | 504 |

  ```typescript
  throw new NotFoundException('Cat not found');
  throw new BadRequestException('Something bad happened', {
    cause: new Error(),
    description: 'Some error description',
  });
  ```

  ### 커스텀 예외 만들기

  ```typescript
  export class ForbiddenException extends HttpException {
    constructor() {
      super('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
  ```

  ### 커스텀 예외 필터

  응답 형태를 완전히 제어하고 싶을 때 사용한다.

  ```typescript
  import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
  import { Request, Response } from 'express';

  @Catch(HttpException)
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
  ```

  ### 모든 예외 잡기

  `@Catch()` 에 인자를 생략하면 모든 종류의 예외를 처리한다.

  ```typescript
  @Catch()
  export class CatchEverythingFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost): void {
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();
      const httpStatus = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

      httpAdapter.reply(ctx.getResponse(), {
        statusCode: httpStatus,
        timestamp: new Date().toISOString(),
        path: httpAdapter.getRequestUrl(ctx.getRequest()),
      }, httpStatus);
    }
  }
  ```

  ### 내장 필터 확장

  기본 필터 동작을 유지하면서 부분적으로 오버라이드:

  ```typescript
  @Catch()
  export class AllExceptionsFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      // 커스텀 로직 추가
      super.catch(exception, host); // 기본 동작 위임
    }
  }
  ```

  ### 필터 바인딩

  ```typescript
  // 메서드 레벨
  @Post()
  @UseFilters(HttpExceptionFilter)
  async create() {}

  // 컨트롤러 레벨
  @Controller()
  @UseFilters(HttpExceptionFilter)
  export class CatsController {}

  // 글로벌 레벨
  app.useGlobalFilters(new HttpExceptionFilter());

  // 모듈 레벨 (DI 지원)
  @Module({
    providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
  })
  export class AppModule {}
  ```

  ### ⚠️ 자주 드는 의문: 도메인 예외를 HTTP 예외와 분리해야 하나?

  서비스 레이어에서 `NotFoundException` 같은 HTTP 예외를 직접 던지면, **서비스가 HTTP에 강하게 결합**된다. 나중에 같은 서비스를 WebSocket이나 gRPC에서 쓰면 HTTP 상태 코드가 의미 없어진다.

  ```typescript
  // ❌ 서비스가 HTTP에 종속됨
  @Injectable()
  export class UserService {
    async findOne(id: number) {
      const user = await this.repo.findOne(id);
      if (!user) throw new NotFoundException('User not found'); // HTTP 예외
    }
  }

  // ✅ 도메인 예외 분리
  // exceptions/user-not-found.exception.ts
  export class UserNotFoundException extends Error {
    constructor(id: number) {
      super(`User #${id} not found`);
    }
  }

  // user.service.ts
  async findOne(id: number) {
    const user = await this.repo.findOne(id);
    if (!user) throw new UserNotFoundException(id); // 도메인 예외
  }
  ```

  ```typescript
  // exception.filter.ts — 도메인 예외를 HTTP 응답으로 매핑
  @Catch(UserNotFoundException)
  export class UserNotFoundFilter implements ExceptionFilter {
    catch(exception: UserNotFoundException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      ctx.getResponse().status(404).json({
        statusCode: 404,
        message: exception.message,
      });
    }
  }
  ```

  | 방식 | 장점 | 단점 |
  |------|------|------|
  | 서비스에서 HTTP 예외 직접 throw | 간단, 코드 적음 | HTTP 종속, 재사용성 낮음 |
  | 도메인 예외 + Filter 매핑 | 계층 분리, 재사용 가능 | 코드 많아짐 |

  > **실무 기준**: 단순한 CRUD 서비스라면 HTTP 예외를 직접 써도 무방하다. **같은 서비스를 여러 전송 계층에서 쓰거나, 도메인 복잡도가 높다면** 도메인 예외를 분리하는 것이 좋다.

  ---

  ## Custom Decorator — 나만의 데코레이터

  NestJS는 데코레이터를 활용한 프로그래밍을 적극적으로 지원한다. 반복되는 패턴을 커스텀 데코레이터로 추출할 수 있다.

  ### 커스텀 파라미터 데코레이터

  ```typescript
  import { createParamDecorator, ExecutionContext } from '@nestjs/common';

  // 요청에서 user 객체를 추출하는 데코레이터
  export const User = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const user = request.user;
      return data ? user?.[data] : user; // data가 있으면 특정 필드만 반환
    },
  );
  ```

  ```typescript
  // 사용
  @Get()
  async findOne(@User() user: UserEntity) {}        // user 전체
  async findOne(@User('firstName') name: string) {}  // user.firstName만
  ```

  ### 데코레이터 합성

  여러 데코레이터를 하나로 묶어 재사용할 수 있다.

  ```typescript
  import { applyDecorators } from '@nestjs/common';

  export function Auth(...roles: Role[]) {
    return applyDecorators(
      SetMetadata('roles', roles),
      UseGuards(AuthGuard, RolesGuard),
      ApiBearerAuth(),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
  }

  // 사용: 4개의 데코레이터를 하나로
  @Get('users')
  @Auth('admin')
  findAllUsers() {}
  ```

  ---

  # Part 2: Fundamentals (심화 기초)

  ---

  ## Provider Scopes — 인스턴스 생명주기

  기본적으로 NestJS의 모든 프로바이더는 싱글톤이지만, 요청별 또는 소비자별로 인스턴스를 생성할 수도 있다.

  ### 3가지 스코프

  | 스코프 | 설명 | 사용 시기 |
  |--------|------|----------|
  | `DEFAULT` (싱글톤) | 앱 전체에서 하나의 인스턴스 공유 | 대부분의 경우 (권장) |
  | `REQUEST` | HTTP 요청마다 새 인스턴스 생성, 요청 완료 후 GC | 요청별 캐싱, 멀티테넌시 |
  | `TRANSIENT` | 주입받는 소비자마다 새 인스턴스 | 소비자별 독립 상태 필요 시 |

  ### 사용법

  ```typescript
  import { Injectable, Scope } from '@nestjs/common';

  @Injectable({ scope: Scope.REQUEST })
  export class CatsService {}

  // 커스텀 프로바이더
  {
    provide: 'CACHE_MANAGER',
    useClass: CacheManager,
    scope: Scope.TRANSIENT,
  }

  // 컨트롤러에도 적용 가능
  @Controller({ path: 'cats', scope: Scope.REQUEST })
  export class CatsController {}
  ```

  ### 스코프 버블링

  REQUEST 스코프는 의존성 체인을 따라 위로 전파된다:

  ```
  CatsController ← CatsService(REQUEST) ← CatsRepository
  ```

  `CatsService`가 REQUEST 스코프면, 이를 주입받는 `CatsController`도 자동으로 REQUEST 스코프가 된다. 반면 TRANSIENT 스코프는 전파되지 않는다.

  ### 요청 컨텍스트 접근

  REQUEST 스코프에서 원본 요청 객체에 접근:

  ```typescript
  @Injectable({ scope: Scope.REQUEST })
  export class CatsService {
    constructor(@Inject(REQUEST) private request: Request) {}
  }
  ```

  ### 성능 고려

  REQUEST 스코프는 매 요청마다 인스턴스를 생성하므로 성능에 영향을 줄 수 있다 (약 5% 지연). **특별한 이유가 없으면 DEFAULT(싱글톤) 사용을 권장.**

  ### Durable Provider (멀티테넌시)

  멀티테넌트 앱에서 같은 테넌트의 요청끼리 프로바이더 인스턴스를 공유:

  ```typescript
  @Injectable({ scope: Scope.REQUEST, durable: true })
  export class CatsService {}
  ```

  ---

  ## Circular Dependency — 순환 의존성 해결

  두 클래스가 서로를 의존할 때 발생하는 순환 의존성 문제를 해결하는 방법.

  ### forwardRef()로 해결

  양쪽 모두 `forwardRef()`를 사용해야 한다:

  ```typescript
  // cats.service.ts
  @Injectable()
  export class CatsService {
    constructor(
      @Inject(forwardRef(() => CommonService))
      private commonService: CommonService,
    ) {}
  }

  // common.service.ts
  @Injectable()
  export class CommonService {
    constructor(
      @Inject(forwardRef(() => CatsService))
      private catsService: CatsService,
    ) {}
  }
  ```

  ### 모듈 간 순환 의존성

  ```typescript
  @Module({
    imports: [forwardRef(() => CommonModule)],
  })
  export class CatsModule {}

  @Module({
    imports: [forwardRef(() => CatsModule)],
  })
  export class CommonModule {}
  ```

  ### 실무 팁

  - `forwardRef()`는 응급 처치에 가깝다. 가능하면 공통 책임을 분리해서 순환 자체를 없애는 편이 낫다.
  - 모듈 간 참조가 커질수록 테스트와 유지보수가 어려워지므로, 공통 도메인 서비스나 이벤트 기반 흐름으로 끊는 방법을 먼저 검토한다.
  - 한쪽 의존성만 늦게 해결하면 되는 경우에는 `ModuleRef`로 런타임 조회하는 편이 더 명확할 수 있다.

---