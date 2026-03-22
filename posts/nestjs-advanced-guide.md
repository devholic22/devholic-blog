---
title: 'NestJS Advanced Guide'
date: '2026-03-22'
tags:
  - backend/nestjs
  - backend/testing
  - backend/websocket
  - backend/graphql
  - backend/microservices
  - backend/advanced
description: 'Testing, WebSocket, GraphQL, Microservices 등 고급 주제만 분리한 NestJS 가이드'
slug: nestjs-advanced-guide
content: |
  # NestJS Advanced Guide

  고급 주제와 학습 로드맵만 따로 읽고 싶을 때 보는 분할본이다. 범위는 Part 6이다.

  ## 읽기 경로

  - [Core](https://devholic.me/posts/nestjs-core-guide)
  - [Techniques](https://devholic.me/posts/nestjs-techniques-guide)
  - [Security + Recipes](https://devholic.me/posts/nestjs-security-recipes-guide)
  - [Advanced](https://devholic.me/posts/nestjs-advanced-guide)
  - [Guide Hub](https://devholic.me/posts/nestjs-beginner-guide)

  ## 함께 읽기

  - [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide): 테스트 더블, transaction scope, lazy relation 직렬화 같은 실전 문제를 같이 볼 때
  - [TypeORM Operations Guide](https://devholic.me/posts/typeorm-operations-guide): e2e 환경과 운영 migration 전략을 함께 점검할 때

  ## 이 문서에서 다루는 섹션

  - [Testing — 테스팅](#testing-—-테스팅)
  - [WebSocket — 실시간 통신](#websocket-—-실시간-통신)
  - [GraphQL — API 쿼리 언어](#graphql-—-api-쿼리-언어)
  - [Microservices — 마이크로서비스](#microservices-—-마이크로서비스)
  - [Lifecycle Events — 생명주기 이벤트](#lifecycle-events-—-생명주기-이벤트)
  - [요청 생명주기 (Request Lifecycle)](#요청-생명주기-(request-lifecycle))
  - [학습 로드맵](#학습-로드맵)

  ---

  # Part 6: 고급 (Advanced)

  ---

  ## Testing — 테스팅

  NestJS는 Jest와 Supertest를 기본 도구로 사용하며, `@nestjs/testing` 패키지를 통해 DI 환경에서의 테스트를 지원한다.

  ### 설치

  ```bash
  npm i --save-dev @nestjs/testing
  ```

  ### 유닛 테스트 — 기본 (수동 인스턴스)

  ```typescript
  // cats.controller.spec.ts
  import { CatsController } from './cats.controller';
  import { CatsService } from './cats.service';

  describe('CatsController', () => {
    let catsController: CatsController;
    let catsService: CatsService;

    beforeEach(() => {
      catsService = new CatsService();
      catsController = new CatsController(catsService);
    });

    describe('findAll', () => {
      it('should return an array of cats', async () => {
        const result = ['test'];
        jest.spyOn(catsService, 'findAll').mockImplementation(() => result);
        expect(await catsController.findAll()).toBe(result);
      });
    });
  });
  ```

  > 테스트 파일은 테스트 대상 클래스 근처에 `.spec.ts` 접미사로 배치한다.

  ### 유닛 테스트 — TestingModule (DI 활용)

  ```typescript
  import { Test } from '@nestjs/testing';
  import { CatsController } from './cats.controller';
  import { CatsService } from './cats.service';

  describe('CatsController', () => {
    let catsController: CatsController;
    let catsService: CatsService;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

      catsService = moduleRef.get(CatsService);
      catsController = moduleRef.get(CatsController);
    });

    describe('findAll', () => {
      it('should return an array of cats', async () => {
        const result = ['test'];
        jest.spyOn(catsService, 'findAll').mockImplementation(() => result);
        expect(await catsController.findAll()).toBe(result);
      });
    });
  });
  ```

  `Test.createTestingModule()`은 NestJS의 DI 컨테이너를 모킹한 환경을 제공한다.

  ### Provider 오버라이드

  테스트 시 실제 의존성을 목 객체로 교체:

  ```typescript
  const moduleRef = await Test.createTestingModule({
    imports: [CatsModule],
  })
    .overrideProvider(CatsService)
    .useValue({
      findAll: jest.fn().mockResolvedValue(['test']),
      create: jest.fn(),
    })
    .compile();
  ```

  오버라이드 가능한 대상:
  - `.overrideProvider()` — 서비스, 레포지토리 등
  - `.overrideGuard()` — 가드
  - `.overrideInterceptor()` — 인터셉터
  - `.overrideFilter()` — 예외 필터
  - `.overridePipe()` — 파이프
  - `.overrideModule()` — 모듈

  각각 `.useValue()`, `.useClass()`, `.useFactory()` 방식으로 대체한다.

  ### 자동 모킹 (useMocker)

  누락된 의존성을 자동으로 모킹:

  ```typescript
  import { ModuleMocker } from 'jest-mock';

  const moduleMocker = new ModuleMocker(global);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CatsController],
    })
      .useMocker((token) => {
        if (token === CatsService) {
          return { findAll: jest.fn().mockResolvedValue(['test1', 'test2']) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token);
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();
  });
  ```

  ### E2E (End-to-End) 테스트

  실제 HTTP 요청을 시뮬레이션하는 통합 테스트:

  ```typescript
  // cats.e2e-spec.ts
  import * as request from 'supertest';
  import { Test } from '@nestjs/testing';
  import { CatsModule } from '../../src/cats/cats.module';
  import { CatsService } from '../../src/cats/cats.service';
  import { INestApplication } from '@nestjs/common';

  describe('Cats', () => {
    let app: INestApplication;
    let catsService = { findAll: () => ['test'] };

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [CatsModule],
      })
        .overrideProvider(CatsService)
        .useValue(catsService)
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    it('/GET cats', () => {
      return request(app.getHttpServer())
        .get('/cats')
        .expect(200)
        .expect({ data: catsService.findAll() });
    });

    afterAll(async () => {
      await app.close();
    });
  });
  ```

  > E2E 테스트 파일은 `test/` 디렉토리에 `.e2e-spec.ts` 접미사로 배치한다.

  ### 글로벌 가드를 테스트에서 오버라이드

  글로벌 가드를 테스트에서 교체하려면 `useExisting` 패턴을 사용:

  ```typescript
  // app.module.ts에서
  @Module({
    providers: [
      { provide: APP_GUARD, useExisting: JwtAuthGuard },
      JwtAuthGuard,
    ],
  })
  export class AppModule {}

  // 테스트에서
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(JwtAuthGuard)
    .useClass(MockAuthGuard)
    .compile();
  ```

  ### TestingModule 주요 메서드

  | 메서드 | 용도 |
  |--------|------|
  | `compile()` | 모듈 컴파일 (빌드) |
  | `createNestApplication()` | HTTP 앱 인스턴스 생성 (E2E용) |
  | `get(Provider)` | 싱글톤 프로바이더 인스턴스 가져오기 |
  | `resolve(Provider)` | 스코프드 프로바이더 인스턴스 가져오기 |
  | `select(Module)` | 특정 모듈에서 프로바이더 검색 |

  ### ⚠️ 자주 드는 의문 1: Mock vs 실제 DB — 무엇으로 테스트해야 하나?

  ```typescript
  // Mock 테스트 — Repository를 가짜 객체로 대체
  const mockCatsRepo = { find: jest.fn(), save: jest.fn() };
  const module = await Test.createTestingModule({
    providers: [
      CatsService,
      { provide: getRepositoryToken(Cat), useValue: mockCatsRepo },
    ],
  }).compile();
  ```

  | 비교 항목 | Mock (단위 테스트) | 실제 DB (통합 테스트) |
  |----------|-----------------|-------------------|
  | 실행 속도 | ✅ 매우 빠름 | ❌ 느림 |
  | 환경 격리 | ✅ 외부 의존성 없음 | ❌ DB 필요 |
  | 쿼리 정확성 검증 | ❌ Mock은 실제 SQL 실행 안 함 | ✅ 실제 쿼리 검증 |
  | DB 마이그레이션 버그 탐지 | ❌ 불가 | ✅ 가능 |
  | 관계/인덱스 이슈 탐지 | ❌ 불가 | ✅ 가능 |

  **실제 사례:** Mock 테스트는 통과했지만 프로덕션에서 TypeORM 관계 설정 오류나 마이그레이션 실수로 쿼리가 실패하는 경우가 있다.

  **권장 전략 (Testing Trophy):**

  ```
       E2E 테스트 (소수)        ← 핵심 사용자 시나리오
    ──────────────────────
    통합 테스트 (핵심 경로)     ← 실제 DB, 실제 서비스 연동
    ──────────────────────
     단위 테스트 (다수)         ← 복잡한 도메인 로직, 유틸 함수
  ```

  - **단위 테스트**: 순수 함수, 복잡한 비즈니스 로직 → Mock으로 빠르게
  - **통합 테스트**: Repository 쿼리, 트랜잭션 → 실제 테스트 DB 사용
  - **E2E 테스트**: 로그인 → 주문 생성 같은 핵심 플로우 → Supertest

  ### ⚠️ 자주 드는 의문 2: 인증 Guard가 있는 라우트는 어떻게 E2E 테스트하나?

  ```typescript
  // 방법 1: Guard를 통째로 교체 (빠르지만 인증 로직 미검증)
  .overrideGuard(JwtAuthGuard)
  .useValue({ canActivate: () => true })

  // 방법 2: 실제 JWT 토큰 발급 후 헤더에 포함 (권장 — 실제 인증 흐름 검증)
  it('GET /cats (with auth)', async () => {
    // 1. 로그인해서 토큰 획득
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test', password: 'test' });
    const token = loginRes.body.access_token;

    // 2. 토큰으로 보호된 라우트 접근
    return request(app.getHttpServer())
      .get('/cats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
  ```

  ---

  ## WebSocket — 실시간 통신

  NestJS는 Socket.IO를 기반으로 WebSocket 게이트웨이를 제공한다.

  ### 설치

  ```bash
  npm i --save @nestjs/websockets @nestjs/platform-socket.io
  ```

  ### 기본 게이트웨이

  ```typescript
  import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';

  @WebSocketGateway(80, { namespace: 'events' })
  export class EventsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
  {
    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {
      console.log('WebSocket 서버 초기화');
    }

    handleConnection(client: Socket) {
      console.log(`클라이언트 연결: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
      console.log(`클라이언트 연결 해제: ${client.id}`);
    }

    @SubscribeMessage('events')
    handleEvent(
      @MessageBody() data: string,
      @ConnectedSocket() client: Socket,
    ): string {
      return data; // 클라이언트에 응답
    }
  }
  ```

  ### 데코레이터 설정 옵션

  ```typescript
  @WebSocketGateway(81, {
    namespace: 'events',
    transports: ['websocket'],
    cors: { origin: '*' },
  })
  ```

  ### 메시지 구독

  ```typescript
  // 단순 반환
  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: string): string {
    return data;
  }

  // 이벤트 이름과 함께 반환
  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: unknown): WsResponse<unknown> {
    return { event: 'events', data };
  }

  // 특정 프로퍼티 추출
  @SubscribeMessage('events')
  handleEvent(@MessageBody('id') id: number): number {
    return id;
  }

  // Acknowledgement 콜백
  @SubscribeMessage('events')
  handleEvent(
    @MessageBody() data: string,
    @Ack() ack: (response: any) => void,
  ) {
    ack({ status: 'received', data });
  }
  ```

  ### 비동기 & 스트리밍 응답

  ```typescript
  @SubscribeMessage('events')
  onEvent(@MessageBody() data: unknown): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      map(item => ({ event: 'events', data: item })),
    );
  }
  ```

  ### 서버에서 이벤트 브로드캐스트

  ```typescript
  @WebSocketServer()
  server: Server;

  // 모든 클라이언트에게 전송
  this.server.emit('notification', { message: 'Hello everyone!' });

  // 특정 룸에 전송
  this.server.to('room-1').emit('notification', { message: 'Room message' });
  ```

  ### 생명주기 훅

  | 인터페이스 | 메서드 | 시점 |
  |-----------|--------|------|
  | `OnGatewayInit` | `afterInit()` | 서버 초기화 후 |
  | `OnGatewayConnection` | `handleConnection()` | 클라이언트 연결 시 |
  | `OnGatewayDisconnect` | `handleDisconnect()` | 클라이언트 연결 해제 시 |

  ### 모듈 등록

  게이트웨이는 모듈의 providers에 등록한다:

  ```typescript
  @Module({
    providers: [EventsGateway],
  })
  export class EventsModule {}
  ```

  ### ⚠️ 자주 드는 의문: 멀티 인스턴스 환경에서 WebSocket은?

  WebSocket은 **특정 서버 인스턴스**에 연결된다. 멀티 인스턴스 환경에서는 클라이언트 A가 인스턴스 1에, 클라이언트 B가 인스턴스 2에 연결되면 서로 메시지를 주고받을 수 없다.

  ```
  인스턴스 1 ── 클라이언트 A
  인스턴스 2 ── 클라이언트 B
  → 인스턴스 1에서 broadcast() 호출 시 클라이언트 B에 도달 불가!
  ```

  #### 해결: Redis Adapter

  Redis를 Pub/Sub 브로커로 사용하여 인스턴스 간 메시지를 공유한다.

  ```bash
  npm i @socket.io/redis-adapter ioredis
  ```

  ```typescript
  // main.ts
  import { createAdapter } from '@socket.io/redis-adapter';
  import { createClient } from 'redis';

  const pubClient = createClient({ url: 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);

  const app = await NestFactory.create(AppModule);
  const server = app.get(Server); // Socket.IO Server 인스턴스
  server.adapter(createAdapter(pubClient, subClient));
  ```

  ```
  클라이언트 A ── 인스턴스 1 ──┐
                                ├── Redis Pub/Sub ──> 모든 인스턴스에 전파
  클라이언트 B ── 인스턴스 2 ──┘
  ```

  #### 추가 고려사항: Room 기반 메시지

  특정 사용자/채팅방에만 메시지를 보낼 때:

  ```typescript
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);
  }

  // 특정 방에 메시지 전송 (Redis Adapter와 함께 사용 시 모든 인스턴스에서 동작)
  this.server.to(roomId).emit('message', payload);
  ```

  | 접근 방식 | 복잡도 | 적합한 경우 |
  |----------|--------|------------|
  | 단일 인스턴스 | 쉬움 | 개발 환경, 소규모 |
  | Redis Adapter | 중간 | 멀티 인스턴스, 수평 확장 필요 시 |
  | 전용 WebSocket 서버 분리 | 복잡 | 대규모 실시간 서비스 (별도 팀 운영) |

  ---

  ## GraphQL — API 쿼리 언어

  NestJS는 **Code First**와 **Schema First** 두 가지 접근 방식을 지원한다.

  ### 설치 (Apollo + Express)

  ```bash
  npm i @nestjs/graphql @nestjs/apollo @apollo/server graphql
  ```

  ### Code First vs Schema First

  | | Code First | Schema First |
  |---|-----------|-------------|
  | **스키마 생성** | TypeScript 클래스/데코레이터에서 자동 생성 | `.graphql` SDL 파일에서 직접 정의 |
  | **장점** | TypeScript만으로 작업 가능 | GraphQL 스펙에 충실 |
  | **적합한 경우** | TypeScript에 익숙한 팀 | GraphQL 경험이 풍부한 팀 |

  ### Code First 설정

  ```typescript
  import { GraphQLModule } from '@nestjs/graphql';
  import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
  import { join } from 'path';

  @Module({
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // 스키마 자동 생성
        sortSchema: true,
      }),
    ],
  })
  export class AppModule {}
  ```

  인메모리 스키마 (파일 미생성):

  ```typescript
  GraphQLModule.forRoot<ApolloDriverConfig>({
    driver: ApolloDriver,
    autoSchemaFile: true, // 메모리에서만 유지
  })
  ```

  ### Schema First 설정

  ```typescript
  @Module({
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        typePaths: ['./**/*.graphql'],      // SDL 파일 위치
        definitions: {
          path: join(process.cwd(), 'src/graphql.ts'), // TypeScript 타입 자동 생성
          outputAs: 'class',  // 또는 'interface'
        },
      }),
    ],
  })
  export class AppModule {}
  ```

  ### GraphQL Playground

  기본적으로 `http://localhost:3000/graphql`에서 접근 가능.

  **GraphiQL 사용 (권장)**:

  ```typescript
  GraphQLModule.forRoot<ApolloDriverConfig>({
    driver: ApolloDriver,
    graphiql: true,
  })
  ```

  ### 비동기 설정

  ```typescript
  GraphQLModule.forRootAsync<ApolloDriverConfig>({
    driver: ApolloDriver,
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      autoSchemaFile: true,
      debug: configService.get('GRAPHQL_DEBUG'),
      playground: configService.get('GRAPHQL_PLAYGROUND'),
    }),
    inject: [ConfigService],
  })
  ```

  ### Mercurius 드라이버 (Fastify용 대안)

  ```typescript
  import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';

  GraphQLModule.forRoot<MercuriusDriverConfig>({
    driver: MercuriusDriver,
    graphiql: true,
  })
  ```

  > **참고 예제**: [Code First](https://github.com/nestjs/nest/tree/master/sample/23-graphql-code-first), [Schema First](https://github.com/nestjs/nest/tree/master/sample/12-graphql-schema-first)

  ### GraphQL Subscriptions 구현

  공식 문서는 `@Subscription()`과 `graphql-subscriptions`의 `PubSub`를 함께 보여준다.  
  또 기본 `PubSub` 구현은 production에 적합하지 않다고 경고하므로, 운영에선 외부 브로커 기반 구현으로 바꾸는 편이 안전하다.

  ```bash
  npm i graphql-subscriptions
  ```

  ```typescript
  import { Module } from '@nestjs/common';
  import { GraphQLModule } from '@nestjs/graphql';
  import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
  import { PubSub } from 'graphql-subscriptions';

  @Module({
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        subscriptions: {
          'graphql-ws': {
            path: '/graphql',
          },
        },
      }),
    ],
    providers: [
      CommentsResolver,
      CommentsService,
      {
        provide: 'PUB_SUB',
        useValue: new PubSub(),
      },
    ],
  })
  export class AppModule {}
  ```

  ```typescript
  import { Inject } from '@nestjs/common';
  import {
    Args,
    Field,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Resolver,
    Subscription,
  } from '@nestjs/graphql';
  import { PubSub } from 'graphql-subscriptions';

  @ObjectType()
  export class Comment {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    postId: number;

    @Field()
    body: string;
  }

  @InputType()
  class AddCommentInput {
    @Field(() => Int)
    postId: number;

    @Field()
    body: string;
  }

  @Resolver(() => Comment)
  export class CommentsResolver {
    constructor(
      @Inject('PUB_SUB') private readonly pubSub: PubSub,
      private readonly commentsService: CommentsService,
    ) {}

    @Mutation(() => Comment)
    async addComment(@Args('input') input: AddCommentInput) {
      const comment = await this.commentsService.create(input);

      await this.pubSub.publish('commentAdded', {
        commentAdded: comment,
      });

      return comment;
    }

    @Subscription(() => Comment, {
      filter: (payload, variables) =>
        payload.commentAdded.postId === variables.postId,
    })
    commentAdded(@Args('postId', { type: () => Int }) postId: number) {
      return this.pubSub.asyncIterableIterator('commentAdded');
    }
  }
  ```

  ### Subscription에서 자주 막히는 지점

  - publish payload shape는 subscription 반환 shape와 맞아야 한다.
  - 개발 환경에선 로컬 `PubSub`로 충분하지만, 멀티 인스턴스에선 이벤트가 다른 인스턴스로 전파되지 않는다.
  - Apollo 쪽은 `graphql-ws` 기준 설정을 잡는 편이 안전하다.

  > **실무 추론**: Redis/NATS/Kafka 같은 외부 브로커 기반 PubSub로 올리는 판단은 공식 문서의 "기본 PubSub는 production에 부적합" 경고를 운영 구조로 번역한 것이다.

  ### ⚠️ 자주 드는 의문 1: REST vs GraphQL — 언제 뭘 써야 하나?

  | 비교 항목 | REST | GraphQL |
  |----------|------|---------|
  | 데이터 과/불필요 조회 | Over/Under-fetching 발생 | 클라이언트가 필요한 필드만 요청 |
  | 엔드포인트 수 | 리소스별 다수 | 단일 (`/graphql`) |
  | 클라이언트 유연성 | 서버 스펙에 의존 | 클라이언트가 쿼리 형태 결정 |
  | 캐싱 | HTTP 캐시 (CDN 등) 활용 용이 | 복잡 (쿼리별 캐시 로직 필요) |
  | 파일 업로드 | 간단 | 별도 패키지 필요 (`graphql-upload`) |
  | 학습 곡선 | 낮음 | 높음 (스키마, 리졸버, 타입 시스템) |
  | 실시간 | 별도 WebSocket 구현 | Subscription으로 내장 지원 |

  **GraphQL이 적합한 경우:**
  - 모바일 앱처럼 **네트워크 효율이 중요**할 때
  - 프론트엔드 팀이 다양하고 각자 필요한 데이터가 다를 때 (BFF 패턴)
  - 스키마가 공식 계약 역할을 하는 **대규모 팀**

  **REST가 더 나은 경우:**
  - 단순 CRUD, 파일 업로드가 많을 때
  - CDN 캐싱이 중요한 공개 API
  - 팀이 GraphQL에 익숙하지 않을 때

  > **실무 현실**: 대부분의 서비스는 REST로 충분하다. GraphQL은 **"여러 팀이 다른 데이터 요구사항을 가질 때"** 빛을 발한다. REST API 위에 GraphQL 레이어만 추가하는 하이브리드 전략도 많이 쓰인다.

  ### ⚠️ 자주 드는 의문 2: Code First vs Schema First

  | 비교 항목 | Code First | Schema First |
  |----------|-----------|-------------|
  | 스키마 정의 방법 | TypeScript 클래스 + 데코레이터 | `.graphql` SDL 파일 직접 작성 |
  | 타입 공유 | TypeScript 타입과 자동 동기화 | 별도 타입 생성 도구 필요 |
  | 스키마 파악 용이성 | 코드 분산 | 스키마 파일 한 곳에서 확인 |
  | 추천 상황 | TypeScript 중심 팀 | 프론트-백 스키마 공동 설계 시 |

  ---

  ## Microservices — 마이크로서비스

  NestJS는 HTTP 이외의 **전송 계층(Transport Layer)**을 통해 마이크로서비스 아키텍처를 지원한다.

  ### 설치

  ```bash
  npm i @nestjs/microservices
  ```

  ### 지원 전송 계층

  | Transport | 패키지 | 설명 |
  |-----------|--------|------|
  | **TCP** | 내장 | 기본, 프로토타이핑용 |
  | **Redis** | `ioredis` | Pub/Sub 기반 |
  | **NATS** | `nats` | 경량, 고성능 |
  | **MQTT** | `mqtt` | IoT에 적합 |
  | **RabbitMQ** | `amqplib` | 엔터프라이즈급 메시지 큐 |
  | **Kafka** | `kafkajs` | 대용량 스트리밍 |
  | **gRPC** | `@grpc/grpc-js` | Protocol Buffers 기반 |

  ### Transport 선택 기준

  > **실무 추론**: 아래 표는 Nest 공식 문서의 transport 목록과 각 transporter 특성을 바탕으로 정리한 선택 가이드다.  
  > 공식 문서가 "이 상황엔 RabbitMQ를 써라"처럼 직접 처방하는 것은 아니다.

  | Transport | 먼저 고를 상황 | 조심할 점 |
  |-----------|----------------|-----------|
  | **TCP** | Nest-to-Nest 내부 통신, 로컬 개발, 빠른 프로토타입 | 브로커 기능, 내구성, 외부 언어 호환성 기대는 약함 |
  | **Redis** | 단순 Pub/Sub, 캐시 무효화 알림, 가벼운 이벤트 팬아웃 | durable queue가 아니므로 유실/재처리 요구엔 약함 |
  | **NATS** | 경량 고성능 이벤트 버스, request-reply, 단순 운영 | Kafka/RabbitMQ급 저장·재처리·복잡 라우팅은 약할 수 있음 |
  | **MQTT** | IoT, 모바일/엣지 장치, 연결이 불안정한 환경 | 일반 백엔드 내부 RPC엔 과한 경우가 많음 |
  | **RabbitMQ** | 작업 큐, ack/retry, routing key, DLQ가 중요한 업무 처리 | 운영 복잡도와 모델링 난이도 증가 |
  | **Kafka** | 이벤트 스트리밍, replay, consumer group, 대용량 비동기 파이프라인 | 운영 비용이 크고, 단순 RPC 대체재로 쓰면 과함 |
  | **gRPC** | 타입 계약이 중요한 동기식 서비스 간 통신, polyglot 환경 | 브라우저 직접 연동은 불편하고 이벤트 버스 역할은 아님 |

  ### 아주 짧은 판단 규칙

  - "응답이 필요한 서비스 간 호출"이면 `gRPC`나 `TCP`를 먼저 본다.
  - "재처리/ack/DLQ가 중요한 작업 큐"면 `RabbitMQ`를 먼저 본다.
  - "이벤트 로그를 오래 보관하고 여러 consumer가 독립적으로 읽어야" 하면 `Kafka`가 맞다.
  - "가벼운 실시간 브로드캐스트/무효화 알림"이면 `Redis`나 `NATS`가 단순하다.

  ### 마이크로서비스 서버 생성

  ```typescript
  // main.ts
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { host: '0.0.0.0', port: 3001 },
    },
  );
  await app.listen();
  ```

  ### 하이브리드 애플리케이션 (HTTP + 마이크로서비스)

  ```typescript
  const app = await NestFactory.create(AppModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { port: 3001 },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
  ```

  ### 메시지 패턴 (@MessagePattern)

  **요청-응답** 방식. 클라이언트가 응답을 기다린다.

  ```typescript
  @Controller()
  export class MathController {
    @MessagePattern({ cmd: 'sum' })
    accumulate(data: number[]): number {
      return (data || []).reduce((a, b) => a + b, 0);
    }
  }
  ```

  ### 이벤트 패턴 (@EventPattern)

  **이벤트 기반** 방식. 응답을 기다리지 않는다 (fire-and-forget).

  ```typescript
  @EventPattern('user_created')
  async handleUserCreated(data: CreateUserEvent) {
    // 이벤트 처리 (이메일 발송, 로그 기록 등)
    console.log('User created:', data);
  }
  ```

  ### 클라이언트 (다른 서비스 호출)

  ```typescript
  @Module({
    imports: [
      ClientsModule.register([
        {
          name: 'MATH_SERVICE',
          transport: Transport.TCP,
          options: { host: 'localhost', port: 3001 },
        },
      ]),
    ],
  })
  export class AppModule {}
  ```

  ```typescript
  @Injectable()
  export class AppService {
    constructor(
      @Inject('MATH_SERVICE') private client: ClientProxy,
    ) {}

    // 요청-응답
    getSum(): Observable<number> {
      return this.client.send<number>({ cmd: 'sum' }, [1, 2, 3]);
    }

    // 이벤트 발행
    emitUserCreated(user: CreateUserEvent) {
      this.client.emit('user_created', user);
    }
  }
  ```

  ### Redis 전송 예시

  ```typescript
  // 서버
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: { host: 'localhost', port: 6379 },
    },
  );

  // 클라이언트
  ClientsModule.register([
    {
      name: 'REDIS_SERVICE',
      transport: Transport.REDIS,
      options: { host: 'localhost', port: 6379 },
    },
  ])
  ```

  ### `RpcException`과 예외 처리

  공식 문서 기준 microservice 예외 계층에서는 `HttpException` 대신 `RpcException`을 던져야 한다.

  ```typescript
  import { Controller } from '@nestjs/common';
  import {
    MessagePattern,
    Payload,
    RpcException,
  } from '@nestjs/microservices';

  @Controller()
  export class ItemsMessageController {
    constructor(private readonly itemsService: ItemsService) {}

    @MessagePattern({ cmd: 'find_item' })
    async findOne(@Payload() id: number) {
      const item = await this.itemsService.findOne(id);

      if (!item) {
        throw new RpcException({
          statusCode: 404,
          message: 'Item not found',
        });
      }

      return item;
    }
  }
  ```

  문자열 하나만 던져도 되지만, 실무에선 객체 형태가 디버깅과 클라이언트 처리에 더 낫다.

  ### `RpcExceptionFilter`

  ```typescript
  import { ArgumentsHost, Catch, UseFilters } from '@nestjs/common';
  import {
    MessagePattern,
    RpcException,
    RpcExceptionFilter,
  } from '@nestjs/microservices';
  import { throwError } from 'rxjs';

  @Catch(RpcException)
  export class RpcErrorsFilter
    implements RpcExceptionFilter<RpcException>
  {
    catch(exception: RpcException, host: ArgumentsHost) {
      return throwError(() => exception.getError());
    }
  }

  @UseFilters(new RpcErrorsFilter())
  @MessagePattern({ cmd: 'sum' })
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b, 0);
  }
  ```

  ### 자주 놓치는 주의점

  - HTTP 쪽 `HttpException` 감각으로 그대로 던지면 client가 기대한 형태로 받지 못할 수 있다.
  - hybrid app에서는 global microservice exception filter가 기본 활성화가 아니다.
  - 요청-응답 패턴(`send`)과 이벤트 패턴(`emit`)은 오류 전파 방식이 다르므로, "응답이 필요한가"를 먼저 구분해야 한다.

  > **핵심 차이**: `@MessagePattern`은 요청-응답(RPC), `@EventPattern`은 이벤트(fire-and-forget). 응답이 필요한지에 따라 선택한다.

  ---

  ## Lifecycle Events — 생명주기 이벤트

  NestJS는 앱이 부팅되고 종료되는 과정에서 호출되는 **생명주기 훅**을 제공한다.

  ### 생명주기 순서

  ```
  부팅 시:
    1. onModuleInit()          ← 모듈 의존성 해결 후
    2. onApplicationBootstrap() ← 모든 모듈 초기화 후, 리스닝 시작 전

  종료 시:
    3. onModuleDestroy()        ← SIGTERM 등 종료 신호 수신 후
    4. beforeApplicationShutdown() ← onModuleDestroy 완료 후
    5. onApplicationShutdown()  ← 연결 종료 (app.close()) 후
  ```

  ### 사용법

  ```typescript
  import { Injectable, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';

  @Injectable()
  export class UsersService implements OnModuleInit, OnApplicationBootstrap {
    onModuleInit() {
      console.log('모듈 초기화 완료');
    }

    onApplicationBootstrap() {
      console.log('앱 부트스트랩 완료');
    }
  }
  ```

  비동기도 지원:

  ```typescript
  async onModuleInit(): Promise<void> {
    await this.fetch();
  }
  ```

  ### 셧다운 훅 활성화

  셧다운 관련 훅은 **명시적으로 활성화**해야 한다:

  ```typescript
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableShutdownHooks();
    await app.listen(3000);
  }
  ```

  ### 제약 사항
  - Request-scoped 클래스는 생명주기 훅을 트리거하지 않는다
  - 셧다운 훅은 Windows에서 제한적이다 (SIGTERM 미지원)
  - `app.close()`는 Node.js 프로세스를 종료하지 않는다 — 백그라운드 작업은 계속 실행된다

  ---

  ## 요청 생명주기 (Request Lifecycle)

  NestJS에서 요청이 처리되는 전체 순서를 정리하면:

  ```
  1. Incoming Request
  2. Middleware (글로벌 → 모듈 순)
  3. Guard (글로벌 → 컨트롤러 → 라우트 순)
  4. Interceptor - 전처리 (글로벌 → 컨트롤러 → 라우트 순)
  5. Pipe (글로벌 → 컨트롤러 → 라우트 → 파라미터 순)
  6. Controller (라우트 핸들러)
  7. Service (비즈니스 로직)
  8. Interceptor - 후처리 (라우트 → 컨트롤러 → 글로벌 순, 역순!)
  9. Exception Filter (라우트 → 컨트롤러 → 글로벌 순)
  10. Response
  ```

  > 핵심: 전처리는 글로벌 → 로컬 순서, 후처리는 로컬 → 글로벌 순서 (역순)

  ### 바인딩 범위 패턴 비교

  모든 핵심 컴포넌트는 3가지 레벨에서 바인딩 가능하다:

  | 범위 | 방법 | DI 지원 |
  |------|------|---------|
  | **글로벌** (main.ts) | `app.useGlobal*()` | X |
  | **글로벌** (모듈) | `APP_GUARD`, `APP_PIPE` 등 토큰 사용 | O |
  | **컨트롤러** | `@UseGuards()`, `@UseFilters()` 등 | O |
  | **메서드** | 핸들러에 직접 데코레이터 | O |

  ---

  ## 학습 로드맵

  ### Phase 1: 기초 (1-2주)
  - [ ] 프로젝트 생성 및 구조 이해
  - [ ] `nest g resource`로 CRUD API 만들기
  - [ ] Module로 기능별 코드 분리
  - [ ] DTO와 ValidationPipe로 입력 검증 (whitelist, transform)
  - [ ] ConfigModule로 환경변수 관리

  ### Phase 2: 핵심 기능 (2-3주)
  - [ ] Guard로 인증/인가 구현
  - [ ] Interceptor로 로깅, 응답 변환
  - [ ] Exception Filter로 에러 처리 표준화
  - [ ] Middleware 활용 (CORS, Helmet 등)
  - [ ] Logger 설정 및 커스텀 로거 만들기

  ### Phase 3: 실전 통합 (3-4주)
  - [ ] TypeORM 또는 Prisma로 DB 연동
  - [ ] JWT 인증 구현 (`@nestjs/jwt`, Public 데코레이터)
  - [ ] Authorization (RBAC, CASL) 적용
  - [ ] Swagger 문서화 (`@nestjs/swagger`)
  - [ ] 보안 적용 (CORS, Helmet, Rate Limiting, CSRF)
  - [ ] 파일 업로드 처리 (Multer, ParseFilePipe)
  - [ ] 캐싱 적용 (cache-manager, Redis)
  - [ ] Serialization으로 응답 가공
  - [ ] 유닛 테스트와 E2E 테스트 작성

  ### Phase 4: 고급 (이후)
  - [ ] Custom Provider와 팩토리 패턴
  - [ ] Dynamic Module 설계
  - [ ] CQRS 패턴 (Command/Query/Event 분리)
  - [ ] Task Scheduling으로 배치 작업
  - [ ] Queues (BullMQ)로 비동기 작업 처리
  - [ ] Event Emitter로 이벤트 기반 아키텍처
  - [ ] HTTP Module로 외부 API 연동
  - [ ] API Versioning 전략
  - [ ] Health Check (Terminus) 구성
  - [ ] WebSocket 실시간 통신
  - [ ] GraphQL (Code First / Schema First)
  - [ ] 마이크로서비스 아키텍처

---