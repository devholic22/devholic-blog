---
title: TypeORM 학습 가이드 허브
date: '2026-03-22'
tags:
- backend/typeorm
- backend/orm
- backend/database
- backend/postgresql
- backend/mysql
- backend/sqlite
- backend/migrations
- backend/query-builder
- backend/nestjs
- typescript/library
description: TypeORM 분할 가이드를 묶어 소개하는 허브 문서. Core, Advanced, Operations, NestJS 분할본으로
  학습할 수 있다.
slug: typeorm-beginner-guide
---

# TypeORM 학습 가이드

이 문서는 더 이상 전체 내용을 중복해서 담는 전체판이 아니다.  
이제는 TypeORM 분할 문서들을 엮어 소개하는 허브 문서로 사용한다.

## 문서 구성

- [Core Guide](https://devholic.me/posts/typeorm-core-guide)
  `DataSource`, `Entity`, relation, `Repository`, CRUD 같은 핵심 흐름을 다룬다.
- [Advanced Guide](https://devholic.me/posts/typeorm-advanced-guide)
  `QueryBuilder`, `QueryRunner`, driver 차이, FAQ, v1 변경점 같은 심화 내용을 다룬다.
- [Operations Guide](https://devholic.me/posts/typeorm-operations-guide)
  migration, CLI, Git 충돌, DBA 체크리스트, 운영 배포 관점을 다룬다.
- [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide)
  `TypeOrmModule`, transaction scope, 테스트, subscriber, 운영 함정을 NestJS 기준으로 묶었다.

## 추천 읽기 순서

1. [Core Guide](https://devholic.me/posts/typeorm-core-guide)
2. [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide)
3. [Operations Guide](https://devholic.me/posts/typeorm-operations-guide)
4. [Advanced Guide](https://devholic.me/posts/typeorm-advanced-guide)

## 이런 식으로 읽으면 된다

- 처음 배우면: `Core -> TypeORM + NestJS`
- 이미 CRUD는 해봤다면: `Operations -> Advanced`
- NestJS 프로젝트에 바로 붙인다면: `TypeORM + NestJS -> Operations`
- migration, 배포, Git conflict가 궁금하면: `Operations`부터 봐도 된다

## NestJS와 함께 읽기

- [NestJS Core Guide](https://devholic.me/posts/nestjs-core-guide): module, provider, DI 구조를 먼저 다시 잡을 때
- [NestJS Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide): `TypeOrmModule`, validation, serialization과 함께 실제 앱 흐름으로 볼 때
- [NestJS Advanced Guide](https://devholic.me/posts/nestjs-advanced-guide): 테스트, e2e, 운영 장애 대응까지 이어서 볼 때

## 범위 메모

- TypeORM 공식 문서 전 범위를 분할본 기준으로 재정리했다.
- 개념 요약만이 아니라 code example, trade-off, 자주 드는 의문, NestJS 조합 포인트를 포함한다.
- migration, `REQUIRES_NEW` 유사 패턴, Git conflict, 운영 주의점은 `Operations`와 `TypeORM + NestJS`에 모아두었다.

## 공식 문서

- [TypeORM Docs](https://typeorm.io/docs/)
