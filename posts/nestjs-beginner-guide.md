---
title: NestJS 학습 가이드 허브
date: '2026-03-22'
tags:
- backend/nestjs
- typescript/framework
- backend/nodejs
- backend/authentication
- backend/swagger
- backend/typeorm
- backend/graphql
- backend/websocket
- backend/testing
- backend/cqrs
description: NestJS 분할 가이드를 묶어 소개하는 허브 문서. Core, Techniques, Security + Recipes, Advanced
  분할본으로 학습할 수 있다.
slug: nestjs-beginner-guide
---

# NestJS 학습 가이드

이 문서는 더 이상 전체 내용을 길게 복제한 전체판이 아니다.  
이제는 NestJS 분할 문서들을 엮어 소개하는 허브 문서로 사용한다.

## 문서 구성

- [Core Guide](https://devholic.me/posts/nestjs-core-guide)
  module, controller, provider, DI, middleware, pipe, guard, interceptor, exception filter 같은 기초 구조를 다룬다.
- [Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide)
  configuration, validation, TypeORM, caching, queue, scheduler, versioning 같은 실전 기법을 다룬다.
- [Security + Recipes Guide](https://devholic.me/posts/nestjs-security-recipes-guide)
  인증/인가, 보안 설정, Swagger, CQRS, Prisma, health check 같은 응용 주제를 다룬다.
- [Advanced Guide](https://devholic.me/posts/nestjs-advanced-guide)
  testing, WebSocket, GraphQL, microservices 같은 고급 주제를 다룬다.

## 추천 읽기 순서

1. [Core Guide](https://devholic.me/posts/nestjs-core-guide)
2. [Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide)
3. [Security + Recipes Guide](https://devholic.me/posts/nestjs-security-recipes-guide)
4. [Advanced Guide](https://devholic.me/posts/nestjs-advanced-guide)

## 이런 식으로 읽으면 된다

- 처음 배우면: `Core -> Techniques`
- API 서버를 빨리 만들고 싶다면: `Core -> Techniques -> Security + Recipes`
- 테스트와 운영 안정성까지 보려면: `Advanced`까지 이어서 읽는다
- DB 연동이 중요하면: `Techniques`에서 TypeORM 파트를 보고 아래 TypeORM 분할본으로 이어간다

## TypeORM과 함께 읽기

- [TypeORM Core Guide](https://devholic.me/posts/typeorm-core-guide): entity, relation, repository 감각을 같이 잡을 때
- [TypeORM Operations Guide](https://devholic.me/posts/typeorm-operations-guide): migration, CLI, 운영 배포까지 연결할 때
- [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide): `@InjectRepository()`, transaction, 테스트 함정, request scope 이슈를 같이 볼 때

## 범위 메모

- NestJS 공식 문서 전 범위를 분할본 기준으로 재정리했다.
- 각 분할본은 단순 요약보다 실전 예제와 학습 메모 성격이 강하다.
- TypeORM, 인증/인가, 테스트, GraphQL, WebSocket, microservices는 관련 분할본에서 집중적으로 다룬다.

## 공식 문서

- [NestJS Docs](https://docs.nestjs.com/)
