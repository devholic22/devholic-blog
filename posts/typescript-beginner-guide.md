---
title: TypeScript 학습 가이드 허브
date: '2026-03-22'
tags:
- typescript/language
- backend/typescript
- frontend/typescript
- programming/type-system
description: 한 입 크기로 잘라먹는 타입스크립트 핸드북을 기준으로 Core, Type System, Abstractions, Advanced
  Types 분할본을 묶어 소개하는 허브 문서
slug: typescript-beginner-guide
---

# TypeScript 학습 가이드

이 문서는 전체 내용을 한 파일에 길게 복제한 전체판이 아니다.  
`한 입 크기로 잘라먹는 타입스크립트` 핸드북을 기준으로 만든 분할 문서들을 엮어 소개하는 허브 문서다.

## 문서 구성

- [Core Guide](https://devholic.me/posts/typescript-core-guide)
  개발 환경, 컴파일러 옵션, 기본 타입, 객체, 튜플, enum, any/unknown 같은 기초를 다룬다.
- [Type System Guide](https://devholic.me/posts/typescript-type-system-guide)
  타입 계층도, 호환성, 타입 추론, 타입 단언, 좁히기, 함수 타입 같은 핵심 타입 시스템을 다룬다.
- [Abstractions Guide](https://devholic.me/posts/typescript-abstractions-guide)
  인터페이스, 클래스, 접근 제어자, 제네릭처럼 추상화와 재사용을 담당하는 문법을 다룬다.
- [Advanced Types Guide](https://devholic.me/posts/typescript-advanced-types-guide)
  indexed access, mapped type, conditional type, infer, utility type처럼 실전형 타입 조작 문법을 다룬다.

## 추천 읽기 순서

1. [Core Guide](https://devholic.me/posts/typescript-core-guide)
2. [Type System Guide](https://devholic.me/posts/typescript-type-system-guide)
3. [Abstractions Guide](https://devholic.me/posts/typescript-abstractions-guide)
4. [Advanced Types Guide](https://devholic.me/posts/typescript-advanced-types-guide)

## 이런 식으로 읽으면 된다

- 처음 배우면: `Core -> Type System`
- 실무에서 타입 에러를 제대로 읽고 싶다면: `Type System -> Abstractions`
- 라이브러리 타입이나 고급 DTO 타입을 다루려면: `Advanced Types`까지 읽는다
- NestJS/TypeORM 프로젝트를 바로 안정화하려면: `Core -> Type System -> TypeORM/NestJS 문서` 순서가 효율적이다

## 함께 읽기

- [NestJS Core Guide](https://devholic.me/posts/nestjs-core-guide): module, provider, DI 구조를 읽을 때 타입스크립트 클래스/데코레이터 감각이 같이 필요하다.
- [NestJS Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide): DTO, validation, serialization, TypeORM 연동에서 타입 좁히기와 유틸리티 타입이 자주 등장한다.
- [TypeORM Core Guide](https://devholic.me/posts/typeorm-core-guide): entity/repository를 읽을 때 클래스, 인터페이스, 제네릭, 유니온 감각이 같이 필요하다.
- [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide): DTO와 entity를 분리하고 transaction helper를 설계할 때 제네릭과 utility type 활용이 많다.

## 범위 메모

- 원본 핸드북의 11개 섹션, 53개 챕터를 기준으로 다시 정리했다.
- 설명만 옮기지 않고, 실무에서 자주 드는 의문과 trade-off를 함께 적었다.
- 원본의 학습 순서는 유지하되, Obsidian에서 다시 보기 쉽게 분할본과 허브 구조로 재구성했다.
- 마지막 분할본에는 원본 핸드북 반영 체크리스트를 넣었다.

## 원본 핸드북

- [한 입 크기로 잘라먹는 타입스크립트](https://ts.winterlood.com/)
