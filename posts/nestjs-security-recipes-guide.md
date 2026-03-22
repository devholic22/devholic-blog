---
title: 'NestJS Security + Recipes Guide'
date: '2026-03-22'
tags:
  - backend/nestjs
  - backend/security
  - backend/authentication
  - backend/authorization
  - backend/swagger
  - backend/cqrs
description: '보안 파트와 실전 레시피를 함께 묶어 읽기 쉽게 분리한 NestJS 가이드'
slug: nestjs-security-recipes-guide
content: |
  # NestJS Security + Recipes Guide

  보안과 실전 레시피를 한 흐름으로 읽고 싶을 때 보는 분할본이다. 범위는 Part 4~5다.

  ## 읽기 경로

  - [Core](https://devholic.me/posts/nestjs-core-guide)
  - [Techniques](https://devholic.me/posts/nestjs-techniques-guide)
  - [Security + Recipes](https://devholic.me/posts/nestjs-security-recipes-guide)
  - [Advanced](https://devholic.me/posts/nestjs-advanced-guide)
  - [Guide Hub](https://devholic.me/posts/nestjs-beginner-guide)

  ## 이 문서에서 다루는 섹션

  - [CORS — 교차 출처 리소스 공유](#cors-—-교차-출처-리소스-공유)
  - [Helmet — HTTP 보안 헤더](#helmet-—-http-보안-헤더)
  - [CSRF — 교차 사이트 요청 위조 방어](#csrf-—-교차-사이트-요청-위조-방어)
  - [Rate Limiting — 요청 제한](#rate-limiting-—-요청-제한)
  - [Encryption & Hashing — 암호화와 해싱](#encryption-&-hashing-—-암호화와-해싱)
  - [Authentication — JWT 인증 구현](#authentication-—-jwt-인증-구현)
  - [Authorization — 인가 (RBAC, CASL)](#authorization-—-인가-(rbac,-casl))
  - [Swagger/OpenAPI — API 문서화](#swagger/openapi-—-api-문서화)
  - [CRUD Generator — 리소스 자동 생성](#crud-generator-—-리소스-자동-생성)
  - [CQRS — 명령과 조회 분리 패턴](#cqrs-—-명령과-조회-분리-패턴)
  - [Prisma — 차세대 ORM](#prisma-—-차세대-orm)
  - [Health Check (Terminus) — 헬스 체크](#health-check-(terminus)-—-헬스-체크)

  ---

  # Part 4: 보안 (Security)

  ---

  ## CORS — 교차 출처 리소스 공유

  CORS는 다른 도메인의 프론트엔드에서 API를 호출할 수 있도록 허용하는 메커니즘이다.

  ### 활성화

  ```typescript
  // 기본 설정 (모든 출처 허용)
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // 세부 설정
  app.enableCors({
    origin: ['http://localhost:3000', 'https://myapp.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,  // 쿠키 전송 허용
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  ```

  > **주의**: 프로덕션에서 `origin: '*'`(모든 출처)은 보안 위험. 반드시 허용할 도메인을 명시적으로 지정할 것.

  ---

  ## Helmet — HTTP 보안 헤더

  Helmet은 HTTP 헤더를 적절히 설정하여 일반적인 웹 취약점을 방어한다.

  ### 설치 및 적용

  ```bash
  npm i helmet
  ```

  ```typescript
  import helmet from 'helmet';

  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  ```

  Helmet은 `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` 등 여러 보안 헤더를 자동으로 설정한다.

  > **주의**: `NestFactory.create()`에서 `cors: true` 옵션을 사용하는 경우 Helmet보다 먼저 CORS를 적용해야 한다.

  ---

  ## CSRF — 교차 사이트 요청 위조 방어

  CSRF 공격은 인증된 사용자의 브라우저를 이용해 악의적인 요청을 보내는 것이다.

  ### csrf-csrf 패키지 사용

  ```bash
  npm i csrf-csrf cookie-parser
  ```

  ```typescript
  import cookieParser from 'cookie-parser';
  import { doubleCsrf } from 'csrf-csrf';

  const { doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET,
    cookieName: '__csrf',
    cookieOptions: { sameSite: 'strict', secure: true },
  });

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(doubleCsrfProtection);
  ```

  > **참고**: SPA + JWT 토큰 인증을 사용하는 경우 CSRF 보호가 불필요할 수 있다 (쿠키를 사용하지 않기 때문).

  ---

  ## Rate Limiting — 요청 제한

  과도한 요청으로부터 API를 보호하기 위해 요청 속도를 제한한다.

  ### 설치

  ```bash
  npm i @nestjs/throttler
  ```

  ### 글로벌 설정

  ```typescript
  @Module({
    imports: [
      ThrottlerModule.forRoot({
        throttlers: [
          { name: 'short', ttl: 1000, limit: 3 },   // 1초에 3회
          { name: 'long', ttl: 60000, limit: 100 },  // 1분에 100회
        ],
      }),
    ],
    providers: [
      { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
  })
  export class AppModule {}
  ```

  ### 컨트롤러/라우트별 설정

  ```typescript
  @Controller('cats')
  @Throttle({ short: { ttl: 1000, limit: 1 } }) // 이 컨트롤러만 1초 1회
  export class CatsController {}

  // 특정 라우트에서 제한 해제
  @SkipThrottle()
  @Get('health')
  healthCheck() { return 'ok'; }
  ```

  ### 커스텀 키 (IP 외 기준)

  ```typescript
  @Injectable()
  export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
      return req.user?.id || req.ip;  // 로그인 사용자는 user ID 기준
    }
  }
  ```

  ---

  ## Encryption & Hashing — 암호화와 해싱

  ### 비밀번호 해싱 (bcrypt)

  ```bash
  npm i bcrypt
  npm i -D @types/bcrypt
  ```

  ```typescript
  import * as bcrypt from 'bcrypt';

  // 해싱
  const saltRounds = 10;
  const hash = await bcrypt.hash('myPassword', saltRounds);

  // 검증
  const isMatch = await bcrypt.compare('myPassword', hash);
  ```

  ### 대칭 암호화 (AES)

  Node.js 내장 `crypto` 모듈 활용:

  ```typescript
  import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

  const algorithm = 'aes-256-ctr';
  const key = scryptSync(password, 'salt', 32);
  const iv = randomBytes(16);

  // 암호화
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  // 복호화
  const decipher = createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  ```

  > **핵심 원칙**: 비밀번호는 반드시 **해싱** (bcrypt, argon2), 민감 데이터는 **암호화**, 토큰/세션은 **HMAC** 또는 JWT 서명으로 처리한다.

  ---

  ---

  ## Authentication — JWT 인증 구현

  ### 전체 흐름

  ```
  1. 클라이언트 → POST /auth/login (username + password)
  2. 서버 → 검증 후 JWT 발급 (access_token)
  3. 클라이언트 → 이후 요청 시 Authorization: Bearer <token> 헤더 포함
  4. 서버 → Guard에서 JWT 검증 → 통과 시 요청 처리
  ```

  ### 설치

  ```bash
  npm install --save @nestjs/jwt
  ```

  ### 1단계: Users 모듈

  ```typescript
  @Injectable()
  export class UsersService {
    private readonly users = [
      { userId: 1, username: 'john', password: 'changeme' },
      { userId: 2, username: 'maria', password: 'guess' },
    ];

    async findOne(username: string): Promise<User | undefined> {
      return this.users.find(user => user.username === username);
    }
  }

  @Module({
    providers: [UsersService],
    exports: [UsersService], // AuthModule에서 사용할 수 있도록 export
  })
  export class UsersModule {}
  ```

  ### 2단계: Auth 서비스

  ```typescript
  import { Injectable, UnauthorizedException } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';

  @Injectable()
  export class AuthService {
    constructor(
      private usersService: UsersService,
      private jwtService: JwtService,
    ) {}

    async signIn(username: string, pass: string): Promise<{ access_token: string }> {
      const user = await this.usersService.findOne(username);
      if (user?.password !== pass) {
        throw new UnauthorizedException();
      }
      const payload = { sub: user.userId, username: user.username };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    }
  }
  ```

  > **실제 프로덕션에서는 비밀번호를 평문으로 저장하지 말 것!** bcrypt 같은 라이브러리로 해싱해야 한다.

  ### 3단계: Auth 모듈

  ```typescript
  import { JwtModule } from '@nestjs/jwt';

  @Module({
    imports: [
      UsersModule,
      JwtModule.register({
        global: true,  // 글로벌 등록
        secret: jwtConstants.secret,
        signOptions: { expiresIn: '60s' },
      }),
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [AuthService],
  })
  export class AuthModule {}
  ```

  > **시크릿 키는 코드에 하드코딩하지 말 것!** 환경 변수나 ConfigService를 사용하자.

  ### 4단계: Auth 컨트롤러

  ```typescript
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() signInDto: Record<string, any>) {
      return this.authService.signIn(signInDto.username, signInDto.password);
    }

    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
      return req.user;
    }
  }
  ```

  ### 5단계: Auth Guard (JWT 검증)

  ```typescript
  @Injectable()
  export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException();
      }
      try {
        const payload = await this.jwtService.verifyAsync(token);
        request['user'] = payload; // 요청 객체에 사용자 정보 주입
      } catch {
        throw new UnauthorizedException();
      }
      return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }
  ```

  ### 6단계: 글로벌 인증 + Public 데코레이터

  모든 라우트를 기본적으로 보호하고, 특정 라우트만 공개:

  ```typescript
  // 글로벌 가드 등록
  @Module({
    providers: [{
      provide: APP_GUARD,
      useClass: AuthGuard,
    }],
  })
  export class AppModule {}

  // Public 데코레이터
  export const IS_PUBLIC_KEY = 'isPublic';
  export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

  // 가드에서 Public 체크
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    // ... 기존 JWT 검증 로직
  }

  // 사용
  @Public()
  @Get()
  findAll() {
    return []; // 인증 없이 접근 가능
  }
  ```

  ### 테스트

  ```bash
  # 인증 없이 접근 → 401
  curl http://localhost:3000/auth/profile

  # 로그인 → JWT 발급
  curl -X POST http://localhost:3000/auth/login \
    -d '{"username": "john", "password": "changeme"}' \
    -H "Content-Type: application/json"
  # → {"access_token":"eyJhbGciOi..."}

  # JWT로 보호된 라우트 접근
  curl http://localhost:3000/auth/profile \
    -H "Authorization: Bearer eyJhbGciOi..."
  # → {"sub":1,"username":"john","iat":...,"exp":...}
  ```

  ### ⚠️ 자주 드는 의문 1: Access Token 만료 후 Refresh Token 처리

  Access Token의 만료 시간이 짧으면 사용자가 자주 로그인해야 한다. Refresh Token 패턴으로 해결한다.

  ```
  흐름:
  1. 로그인 → access_token(15분) + refresh_token(7일) 발급
  2. access_token 만료 → POST /auth/refresh + refresh_token 전송
  3. 서버 → refresh_token 검증 → 새 access_token 발급
  4. refresh_token도 만료 → 재로그인 요구
  ```

  ```typescript
  // auth.service.ts
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.usersService.findOne(payload.sub);

      return {
        access_token: this.jwtService.sign(
          { sub: user.id, username: user.username },
          { expiresIn: '15m' },
        ),
      };
    } catch {
      throw new UnauthorizedException('Refresh token expired');
    }
  }
  ```

  **Refresh Token Rotation**: 보안 강화를 위해 refresh 요청 시 refresh_token도 새로 발급하고, 이전 토큰은 무효화한다.

  ### ⚠️ 자주 드는 의문 2: 토큰을 어디에 저장해야 하나?

  | 저장 위치 | XSS 취약 | CSRF 취약 | 권장 상황 |
  |-----------|---------|---------|---------|
  | `localStorage` | ✅ 취약 | ❌ 안전 | 권장하지 않음 |
  | `sessionStorage` | ✅ 취약 | ❌ 안전 | 단기 세션에만 |
  | `httpOnly Cookie` | ❌ 안전 | ✅ 취약 | **서버가 직접 쿠키 설정 시 권장** |
  | `메모리(변수)` | ❌ 안전 | ❌ 안전 | SPA + Refresh Token은 httpOnly로 관리 |

  > **실무 권장**: Access Token은 메모리(JS 변수)에, Refresh Token은 `httpOnly + Secure` 쿠키에 저장하는 방식이 가장 안전하다. CSRF 방어는 `SameSite=Strict` 쿠키 옵션 또는 CSRF 토큰으로 해결한다.

  ---

  ## Authorization — 인가 (RBAC, CASL)

  인증(Authentication)은 "누구인지 확인", 인가(Authorization)는 "무엇을 할 수 있는지 결정"이다.

  ### 역할 기반 접근 제어 (RBAC)

  ```typescript
  // roles.enum.ts
  export enum Role {
    User = 'user',
    Admin = 'admin',
  }

  // roles.decorator.ts
  import { SetMetadata } from '@nestjs/common';
  export const ROLES_KEY = 'roles';
  export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
  ```

  ### RolesGuard 구현

  ```typescript
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!requiredRoles) return true; // 역할 미지정 → 접근 허용

      const { user } = context.switchToHttp().getRequest();
      return requiredRoles.some((role) => user.roles?.includes(role));
    }
  }
  ```

  ### 사용 예시

  ```typescript
  @Post()
  @Roles(Role.Admin)  // Admin만 접근 가능
  @UseGuards(AuthGuard, RolesGuard)
  create(@Body() createCatDto: CreateCatDto) {
    return this.catsService.create(createCatDto);
  }
  ```

  ### Claims 기반 인가

  역할 대신 권한(Permission) 단위로 제어:

  ```typescript
  export enum Permission {
    CREATE_CAT = 'create_cat',
    DELETE_CAT = 'delete_cat',
  }

  export const RequirePermissions = (...permissions: Permission[]) =>
    SetMetadata('permissions', permissions);
  ```

  ### CASL 통합 (고급)

  **CASL**은 "누가 무엇을 어떤 조건에서 할 수 있는가"를 선언적으로 정의하는 라이브러리다.

  ```bash
  npm i @casl/ability
  ```

  ```typescript
  // ability.factory.ts
  @Injectable()
  export class CaslAbilityFactory {
    createForUser(user: User) {
      const { can, cannot, build } = new AbilityBuilder(
        createMongoAbility,
      );

      if (user.isAdmin) {
        can(Action.Manage, 'all'); // 관리자는 모든 것 가능
      } else {
        can(Action.Read, 'all');
        can(Action.Update, Article, { authorId: user.id }); // 자기 글만 수정
        cannot(Action.Delete, Article);
      }

      return build();
    }
  }
  ```

  ```typescript
  // policies.guard.ts
  @Injectable()
  export class PoliciesGuard implements CanActivate {
    constructor(
      private reflector: Reflector,
      private caslAbilityFactory: CaslAbilityFactory,
    ) {}

    canActivate(context: ExecutionContext): boolean {
      const policyHandlers = this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY, context.getHandler(),
      ) || [];

      const { user } = context.switchToHttp().getRequest();
      const ability = this.caslAbilityFactory.createForUser(user);

      return policyHandlers.every((handler) =>
        typeof handler === 'function'
          ? handler(ability)
          : handler.handle(ability),
      );
    }
  }
  ```

  > **가이드라인**: 단순한 역할 구분이면 RBAC, 리소스별 세밀한 권한이 필요하면 CASL을 추천한다.

  ---

  # Part 5: 레시피 (Recipes)

  ---

  ## Swagger/OpenAPI — API 문서화

  ### 설치

  ```bash
  npm install --save @nestjs/swagger
  ```

  ### 기본 설정

  ```typescript
  import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
      .setTitle('Cats example')
      .setDescription('The cats API description')
      .setVersion('1.0')
      .addTag('cats')
      .addBearerAuth()  // JWT Bearer 인증 추가
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    await app.listen(process.env.PORT ?? 3000);
  }
  ```

  ### 접근 URL

  - Swagger UI: `http://localhost:3000/api`
  - JSON 스펙: `http://localhost:3000/api-json`
  - YAML 스펙: `http://localhost:3000/api-yaml`

  ### DocumentBuilder 주요 메서드

  | 메서드 | 역할 |
  |--------|------|
  | `.setTitle()` | API 제목 |
  | `.setDescription()` | API 설명 |
  | `.setVersion()` | API 버전 |
  | `.addTag()` | 태그 추가 (그룹핑) |
  | `.addBearerAuth()` | Bearer Token 인증 |
  | `.addOAuth2()` | OAuth2 인증 |
  | `.build()` | 설정 객체 생성 |

  ### SwaggerModule 옵션

  ```typescript
  // 특정 모듈만 포함
  const options: SwaggerDocumentOptions = {
    include: [CatsModule, DogsModule],
    deepScanRoutes: true,
    operationIdFactory: (controllerKey, methodKey) => methodKey,
  };

  // UI 커스터마이징
  const customOptions: SwaggerCustomOptions = {
    customSiteTitle: 'My API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
    swaggerOptions: { persistAuthorization: true },
  };

  SwaggerModule.setup('api', app, documentFactory, customOptions);
  ```

  > **Tip**: DTO에 `@ApiProperty()` 데코레이터를 추가하면 Swagger 문서에 필드 설명이 자동으로 표시된다. CLI 플러그인을 설정하면 `@ApiProperty()`를 수동으로 추가하지 않아도 자동 생성된다.

  ---

  ## CRUD Generator — 리소스 자동 생성

  NestJS CLI의 `nest g resource` 명령으로 CRUD 보일러플레이트를 자동 생성할 수 있다.

  ### 사용법

  ```bash
  nest g resource users
  ```

  실행 시 선택 옵션:
  - **REST API** (HTTP)
  - GraphQL (code-first)
  - GraphQL (schema-first)
  - Microservice (non-HTTP)
  - WebSocket

  ### 생성되는 파일

  ```
  src/users/
  ├── dto/
  │   ├── create-user.dto.ts
  │   └── update-user.dto.ts
  ├── entities/
  │   └── user.entity.ts
  ├── users.controller.ts      # CRUD 라우트 핸들러
  ├── users.controller.spec.ts # 테스트
  ├── users.module.ts           # 모듈
  └── users.service.ts          # 비즈니스 로직
  ```

  ### 생성되는 컨트롤러 코드 (REST)

  ```typescript
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
      return this.usersService.create(createUserDto);
    }

    @Get()
    findAll() {
      return this.usersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.usersService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
      return this.usersService.update(+id, updateUserDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.usersService.remove(+id);
    }
  }
  ```

  ### 생성되는 GraphQL 코드 (code-first)

  ```typescript
  @Resolver(() => User)
  export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}

    @Mutation(() => User)
    createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
      return this.usersService.create(createUserInput);
    }

    @Query(() => [User], { name: 'users' })
    findAll() {
      return this.usersService.findAll();
    }

    @Query(() => User, { name: 'user' })
    findOne(@Args('id', { type: () => Int }) id: number) {
      return this.usersService.findOne(id);
    }

    @Mutation(() => User)
    updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
      return this.usersService.update(updateUserInput.id, updateUserInput);
    }

    @Mutation(() => User)
    removeUser(@Args('id', { type: () => Int }) id: number) {
      return this.usersService.remove(id);
    }
  }
  ```

  ### 옵션

  ```bash
  nest g resource users --no-spec   # 테스트 파일 없이 생성
  ```

  > **중요**: 생성된 서비스는 **특정 ORM이나 데이터 소스에 의존하지 않는다.** 메서드 내부는 플레이스홀더이므로 TypeORM, Prisma 등으로 직접 구현해야 한다.

  ---

  ## CQRS — 명령과 조회 분리 패턴

  CQRS(Command Query Responsibility Segregation)는 **읽기(Query)와 쓰기(Command)를 별도 모델로 분리**하는 아키텍처 패턴이다. 복잡한 도메인 로직이 있는 애플리케이션에서 유용하다.

  ### 장점
  - **관심사 분리**: 읽기와 쓰기 모델이 독립적
  - **독립적 확장**: 읽기/쓰기를 각각 최적화 가능
  - **다른 데이터 저장소**: 읽기에는 캐시/읽기전용 복제본, 쓰기에는 마스터 DB

  ### 설치

  ```bash
  npm install --save @nestjs/cqrs
  ```

  ```typescript
  @Module({
    imports: [CqrsModule.forRoot()],
  })
  export class AppModule {}
  ```

  ### 핵심 구성 요소

  ```
  Command (쓰기 요청)  →  CommandBus  →  CommandHandler  →  상태 변경
  Query (읽기 요청)    →  QueryBus    →  QueryHandler    →  데이터 반환
  Event (상태 변경 알림) →  EventBus   →  EventHandler    →  부수 효과 처리
  Saga (장기 프로세스)  →  이벤트 감시 → 새 Command 발행
  ```

  ### Command (쓰기)

  ```typescript
  // kill-dragon.command.ts
  export class KillDragonCommand extends Command<{ actionId: string }> {
    constructor(
      public readonly heroId: string,
      public readonly dragonId: string,
    ) {
      super();
    }
  }
  ```

  ```typescript
  // kill-dragon.handler.ts
  @CommandHandler(KillDragonCommand)
  export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
    constructor(private repository: HeroesRepository) {}

    async execute(command: KillDragonCommand) {
      const hero = this.repository.findOneById(+command.heroId);
      hero.killEnemy(command.dragonId);
      await this.repository.persist(hero);
      return { actionId: crypto.randomUUID() };
    }
  }
  ```

  컨트롤러에서 CommandBus를 통해 디스패치:

  ```typescript
  @Controller('heroes')
  export class HeroesController {
    constructor(private commandBus: CommandBus) {}

    @Post(':heroId/kill/:dragonId')
    async killDragon(@Param() params) {
      return this.commandBus.execute(
        new KillDragonCommand(params.heroId, params.dragonId),
      );
    }
  }
  ```

  ### Query (읽기)

  ```typescript
  // get-hero.query.ts
  export class GetHeroQuery extends Query<Hero> {
    constructor(public readonly heroId: string) {
      super();
    }
  }

  // get-hero.handler.ts
  @QueryHandler(GetHeroQuery)
  export class GetHeroHandler implements IQueryHandler<GetHeroQuery> {
    constructor(private repository: HeroesRepository) {}

    async execute(query: GetHeroQuery) {
      return this.repository.findOneById(query.heroId);
    }
  }

  // 컨트롤러에서
  const hero = await this.queryBus.execute(new GetHeroQuery(heroId));
  ```

  ### Event (이벤트)

  도메인 모델이 `AggregateRoot`를 확장하여 이벤트를 발행한다:

  ```typescript
  // hero-killed-dragon.event.ts
  export class HeroKilledDragonEvent {
    constructor(
      public readonly heroId: string,
      public readonly dragonId: string,
    ) {}
  }

  // hero.model.ts
  export class Hero extends AggregateRoot {
    constructor(private id: string) {
      super();
    }

    killEnemy(enemyId: string) {
      // 도메인 로직
      this.apply(new HeroKilledDragonEvent(this.id, enemyId)); // 이벤트 발행
    }
  }
  ```

  Command Handler에서 `EventPublisher`로 이벤트를 커밋:

  ```typescript
  @CommandHandler(KillDragonCommand)
  export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
    constructor(
      private repository: HeroesRepository,
      private publisher: EventPublisher,
    ) {}

    async execute(command: KillDragonCommand) {
      const hero = this.publisher.mergeObjectContext(
        await this.repository.findOneById(+command.heroId),
      );
      hero.killEnemy(command.dragonId);
      hero.commit(); // 이벤트 커밋 → EventBus로 전파
    }
  }
  ```

  Event Handler에서 부수 효과 처리:

  ```typescript
  @EventsHandler(HeroKilledDragonEvent)
  export class HeroKilledDragonHandler implements IEventHandler<HeroKilledDragonEvent> {
    constructor(private repository: HeroesRepository) {}

    handle(event: HeroKilledDragonEvent) {
      // 업적 달성, 알림 발송, 통계 갱신 등 부수 효과
    }
  }
  ```

  ### Saga (장기 프로세스)

  이벤트를 감시하고 새로운 Command를 발행하는 장기 프로세스:

  ```typescript
  @Injectable()
  export class HeroesGameSagas {
    @Saga()
    dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
      return events$.pipe(
        ofType(HeroKilledDragonEvent),
        map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
      );
    }
  }
  ```

  > Saga는 RxJS Observable을 사용하므로 복잡한 이벤트 조합과 비동기 흐름을 선언적으로 처리할 수 있다.

  ### 예외 처리

  이벤트 핸들러는 비동기 실행되므로 예외를 반드시 처리해야 한다:

  ```typescript
  constructor(private unhandledExceptionsBus: UnhandledExceptionBus) {
    this.unhandledExceptionsBus
      .pipe(takeUntil(this.destroy$))
      .subscribe((exceptionInfo) => {
        // 처리되지 않은 예외 로깅/처리
      });
  }
  ```

  ### 모듈 등록

  ```typescript
  @Module({
    imports: [CqrsModule.forRoot()],
    controllers: [HeroesController],
    providers: [
      // Handlers
      KillDragonHandler,
      GetHeroHandler,
      HeroKilledDragonHandler,
      // Sagas
      HeroesGameSagas,
      // Repository
      HeroesRepository,
    ],
  })
  export class HeroesModule {}
  ```

  ### ⚠️ 자주 드는 의문: CQRS는 언제 써야 하고, 언제 쓰면 안 되나?

  CQRS는 강력하지만 복잡성 비용이 크다. 무조건 적용하면 오히려 독이 된다.

  **쓰면 좋은 경우:**
  - 읽기/쓰기 **비율 차이가 극단적**일 때 (읽기 90%, 쓰기 10%)
  - 쓰기 로직이 복잡한 **도메인** (주문, 결제, 예약 등)
  - **이벤트 소싱(Event Sourcing)** 과 함께 쓸 때
  - 마이크로서비스에서 서비스 간 통신을 이벤트로 처리할 때

  **쓰면 안 되는 경우:**
  - 단순 CRUD 서비스 → Command/Query 파일만 늘어남
  - 팀 규모가 작고 빠른 개발이 필요할 때 → 오버엔지니어링

  ```
  일반 서비스                    CQRS 적용 시
  ─────────────                ─────────────────────────────
  UserService                  CreateUserCommand
    create()          →         CreateUserHandler
    findAll()                   GetUsersQuery
    findOne()                   GetUsersHandler
    update()                    UpdateUserCommand
    delete()                    UpdateUserHandler
                                DeleteUserCommand
                                DeleteUserHandler
                                UserCreatedEvent
                                UserCreatedHandler
  ```

  단순 CRUD에 CQRS를 적용하면 파일 수가 **10배** 늘어난다.

  | 상황 | 권장 아키텍처 |
  |------|------------|
  | 단순 CRUD | Service 패턴 |
  | 복잡한 도메인 로직 | Service + Domain Model |
  | 읽기/쓰기 최적화 필요 | CQRS |
  | 이벤트 기반 분산 시스템 | CQRS + Event Sourcing |

  > **실무 권장**: 먼저 Service 패턴으로 시작하고, 도메인이 복잡해질 때 CQRS로 전환하는 것이 현실적이다. NestJS의 `@nestjs/cqrs`는 도입이 쉬워서 점진적 적용이 가능하다.

  ---

  ## Prisma — 차세대 ORM

  Prisma는 **타입 안전한 쿼리**, **자동 마이그레이션**, **직관적인 스키마 정의**를 제공하는 차세대 Node.js ORM이다.

  ### 설치

  ```bash
  npm i prisma @prisma/client
  npx prisma init
  ```

  ### 스키마 정의 (prisma/schema.prisma)

  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }

  model User {
    id    Int     @id @default(autoincrement())
    email String  @unique
    name  String?
    posts Post[]
  }

  model Post {
    id        Int     @id @default(autoincrement())
    title     String
    content   String?
    published Boolean @default(false)
    author    User    @relation(fields: [authorId], references: [id])
    authorId  Int
  }
  ```

  ### 마이그레이션

  ```bash
  npx prisma migrate dev --name init   # 개발 마이그레이션 생성 & 적용
  npx prisma generate                  # Prisma Client 생성
  ```

  ### PrismaService 작성

  ```typescript
  import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
  import { PrismaClient } from '@prisma/client';

  @Injectable()
  export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
      await this.$connect();
    }

    async onModuleDestroy() {
      await this.$disconnect();
    }
  }
  ```

  ### 서비스에서 사용

  ```typescript
  @Injectable()
  export class UserService {
    constructor(private prisma: PrismaService) {}

    async user(id: number): Promise<User | null> {
      return this.prisma.user.findUnique({ where: { id } });
    }

    async users(): Promise<User[]> {
      return this.prisma.user.findMany();
    }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
      return this.prisma.user.create({ data });
    }

    async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
      return this.prisma.user.update({ where: { id }, data });
    }

    async deleteUser(id: number): Promise<User> {
      return this.prisma.user.delete({ where: { id } });
    }
  }
  ```

  ### 관계 쿼리 (include/select)

  ```typescript
  // 유저 + 게시글 함께 조회
  const userWithPosts = await this.prisma.user.findUnique({
    where: { id: 1 },
    include: { posts: true },
  });

  // 특정 필드만 선택
  const userEmail = await this.prisma.user.findUnique({
    where: { id: 1 },
    select: { email: true, name: true },
  });
  ```

  > **TypeORM vs Prisma**: TypeORM은 Active Record/Data Mapper 패턴, 데코레이터 기반. Prisma는 자체 스키마 언어, 완전한 타입 안전성, 더 직관적인 쿼리 API. 새 프로젝트라면 Prisma가 DX(개발자 경험) 면에서 유리하다.

  ---

  ## Health Check (Terminus) — 헬스 체크

  Kubernetes 등 오케스트레이션 환경에서 **애플리케이션 상태를 모니터링**하기 위한 헬스 체크 엔드포인트를 제공한다.

  ### 설치

  ```bash
  npm i @nestjs/terminus
  ```

  ### 기본 설정

  ```typescript
  @Controller('health')
  export class HealthController {
    constructor(
      private health: HealthCheckService,
      private http: HttpHealthIndicator,
      private db: TypeOrmHealthIndicator,
      private memory: MemoryHealthIndicator,
      private disk: DiskHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    check() {
      return this.health.check([
        // HTTP 외부 서비스 확인
        () => this.http.pingCheck('docs', 'https://docs.nestjs.com'),

        // DB 연결 확인
        () => this.db.pingCheck('database'),

        // 메모리 사용량 확인 (150MB 이하)
        () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

        // 디스크 사용량 확인 (90% 이하)
        () => this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
      ]);
    }
  }
  ```

  ### 모듈 등록

  ```typescript
  @Module({
    imports: [TerminusModule, HttpModule],
    controllers: [HealthController],
  })
  export class HealthModule {}
  ```

  ### 응답 예시

  ```json
  {
    "status": "ok",
    "info": {
      "docs": { "status": "up" },
      "database": { "status": "up" }
    },
    "details": { /* ... */ }
  }
  ```

  ### 커스텀 Health Indicator

  ```typescript
  @Injectable()
  export class RedisHealthIndicator extends HealthIndicator {
    async isHealthy(key: string): Promise<HealthIndicatorResult> {
      const isHealthy = await this.checkRedisConnection();
      const result = this.getStatus(key, isHealthy);
      if (isHealthy) return result;
      throw new HealthCheckError('Redis check failed', result);
    }
  }
  ```

  > **팁**: Kubernetes에서는 `livenessProbe`와 `readinessProbe`를 분리해 연결하면 더 안전하게 운영할 수 있다.

---