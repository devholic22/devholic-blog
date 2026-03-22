---
title: TypeScript Advanced Types Guide
date: '2026-03-22'
tags:
- typescript/language
- programming/type-system
- programming/metaprogramming
description: indexed access, mapped type, conditional type, infer, utility type 등
  고급 타입 조작 문법을 정리한 가이드
slug: typescript-advanced-types-guide
---

# TypeScript Advanced Types Guide

실무에서 “타입스크립트가 갑자기 어려워지는 지점”만 따로 모은 문서다. 범위는 `타입 조작하기`, `조건부 타입`, `유틸리티 타입`이다.

## 읽기 경로

- [Core](https://devholic.me/posts/typescript-core-guide)
- [Type System](https://devholic.me/posts/typescript-type-system-guide)
- [Abstractions](https://devholic.me/posts/typescript-abstractions-guide)
- [Advanced Types](https://devholic.me/posts/typescript-advanced-types-guide)
- [Guide Hub](https://devholic.me/posts/typescript-beginner-guide)

## 함께 읽기

- [NestJS Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide): DTO 파생 타입, 부분 업데이트 DTO, 응답 가공 타입에서 utility type이 많이 등장한다.
- [TypeORM Core Guide](https://devholic.me/posts/typeorm-core-guide): entity 입력/출력 구조를 분리할 때 mapped type과 Pick/Omit 감각이 중요하다.
- [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide): optional filter DTO, transaction helper, pagination 응답 타입을 설계할 때 조건부 타입과 유틸리티 타입이 자주 쓰인다.

## 이 문서에서 다루는 섹션

### Part 8: 타입 조작하기

- [타입 조작이란](#타입-조작이란)
- [인덱스드 엑세스 타입](#인덱스드-엑세스-타입)
- [keyof & typeof 연산자](#keyof-&-typeof-연산자)
- [맵드 타입](#맵드-타입)
- [템플릿 리터럴 타입](#템플릿-리터럴-타입)

### Part 9: 조건부 타입

- [조건부 타입](#조건부-타입)
- [분산적인 조건부 타입](#분산적인-조건부-타입)
- [infer](#infer)

### Part 10: 유틸리티 타입

- [유틸리티 타입 소개](#유틸리티-타입-소개)
- [Partial, Required, Readonly](#partial,-required,-readonly)
- [Record, Pick, Omit](#record,-pick,-omit)
- [Exclude, Extract, ReturnType](#exclude,-extract,-returntype)
- [원본 핸드북 반영 체크리스트](#원본-핸드북-반영-체크리스트)

# Part 8: 타입 조작하기

---

## 타입 조작이란

고급 타입 문법은 새로운 값을 만드는 문법이 아니라, **이미 있는 타입을 가공하고 조합하는 문법**이다.

### 왜 필요한가

- DTO에서 일부 필드만 뽑고 싶을 때
- entity에서 읽기 전용 응답 타입을 만들고 싶을 때
- API 응답이나 폼 상태를 규칙적으로 파생하고 싶을 때

### 핵심 감각

타입 조작은 “한 번 정의한 구조를 반복해서 손으로 다시 쓰지 않게 만드는 도구”라고 보면 된다.

## 인덱스드 엑세스 타입

타입에서 특정 속성의 타입만 꺼내올 수 있다.

```typescript
type User = {
  id: number;
  name: string;
  address: {
    city: string;
  };
};

type UserName = User["name"]; // string
type City = User["address"]["city"]; // string
```

### 어디서 유용한가

- 기존 타입의 필드 타입을 재사용할 때
- 함수 파라미터 타입을 특정 속성과 맞출 때
- 중첩 객체 구조에서 일부만 떼어낼 때

## keyof & typeof 연산자

### `keyof`

객체 타입의 키를 유니온으로 뽑는다.

```typescript
type User = {
  id: number;
  name: string;
};

type UserKey = keyof User; // "id" | "name"
```

### `typeof`

값에서 타입을 뽑아낸다.

```typescript
const user = {
  id: 1,
  name: "winter",
};

type User = typeof user;
```

### 함께 쓰기

```typescript
const config = {
  darkMode: true,
  locale: "ko",
};

type Config = typeof config;
type ConfigKey = keyof Config;
```

### 실무 메모

- 하드코딩된 문자열을 줄이는 데 매우 유용하다.
- 값과 타입을 한 번에 동기화할 수 있어 유지보수가 쉬워진다.

## 맵드 타입

기존 타입의 모든 속성을 순회하며 새로운 타입을 만든다.

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

type PartialUser = {
  [K in keyof User]?: User[K];
};
```

### 어떤 문제를 해결하나

- 모든 속성을 선택적으로 바꾸기
- 모든 속성을 읽기 전용으로 바꾸기
- 속성 이름 규칙을 유지한 채 값 타입만 바꾸기

### 핵심 포인트

- `keyof`로 키 집합을 얻고
- `[K in ...]`로 순회하고
- `User[K]`로 각 속성 타입을 재사용한다

이 흐름을 이해하면 utility type의 대부분이 읽힌다.

## 템플릿 리터럴 타입

문자열 타입도 조합할 수 있다.

```typescript
type Color = "red" | "blue";
type Size = "sm" | "lg";

type Variant = `${Color}-${Size}`;
// "red-sm" | "red-lg" | "blue-sm" | "blue-lg"
```

### 어디서 체감되나

- 이벤트 이름 규칙
- CSS variant 이름
- API route key
- 국제화 key prefix

### trade-off

- 규칙이 명확한 문자열 집합에 매우 강하다.
- 하지만 남용하면 오류 메시지가 길어지고, 사람이 읽기 어려운 타입이 만들어질 수 있다.

# Part 9: 조건부 타입

---

## 조건부 타입

타입 수준에서 `if`를 쓸 수 있게 해주는 문법이다.

```typescript
type StringNumberSwitch<T> = T extends string ? number : boolean;

type A = StringNumberSwitch<string>; // number
type B = StringNumberSwitch<number>; // boolean
```

### 언제 유용한가

- 입력 타입에 따라 다른 출력 타입을 만들 때
- 특정 타입을 필터링할 때
- 라이브러리 helper 타입을 만들 때

## 분산적인 조건부 타입

조건부 타입은 유니온 타입에 적용될 때 각 원소별로 분산 평가되는 경우가 많다.

```typescript
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// string[] | number[]
```

### 처음엔 왜 헷갈리나

“유니온 전체에 한 번 적용될 것”이라고 기대하지만, 실제로는 각 멤버에 따로 적용되는 경우가 많기 때문이다.

### 실무 메모

- `Exclude`, `Extract`가 바로 이 특성을 이용한다.
- 분산을 막고 싶으면 튜플로 감싸는 패턴을 많이 쓴다.

```typescript
type NoDistribute<T> = [T] extends [string] ? number : boolean;
```

## infer

조건부 타입 안에서 타입 일부를 추론해 꺼내는 문법이다.

```typescript
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type R = GetReturnType<() => string>; // string
```

### 자주 쓰는 패턴

```typescript
type AwaitedValue<T> = T extends Promise<infer R> ? R : T;

type A = AwaitedValue<Promise<string>>; // string
type B = AwaitedValue<number>; // number
```

```typescript
type ElementType<T> = T extends readonly (infer E)[] ? E : never;

type E1 = ElementType<string[]>; // string
type E2 = ElementType<readonly [number, string]>; // number | string
```

```typescript
type FirstParam<T> =
  T extends (first: infer F, ...args: any[]) => any ? F : never;

type P = FirstParam<(id: number, includePosts: boolean) => Promise<void>>;
// number
```

### 어디서 자주 보이나

- 함수 반환 타입 추출
- Promise 내부 타입 추출
- 배열/튜플 원소 타입 추출
- 라이브러리 helper 타입 구현

### 왜 어렵게 느껴지나

`infer`는 독립 문법처럼 보이지만, 실제로는  
“이 타입이 이 패턴과 맞으면 그 안의 일부를 이름 붙여 꺼낸다”는 규칙이다.

즉 아래처럼 읽으면 된다.

- 함수 패턴이면 반환 타입을 꺼낸다
- Promise 패턴이면 내부 결과 타입을 꺼낸다
- 배열 패턴이면 원소 타입을 꺼낸다

### 실무 메모

- `AwaitedValue<T>`류 패턴은 async service 결과 타입을 재사용할 때 자주 보인다.
- `ElementType<T>`는 배열 DTO, 응답 리스트, 폼 필드 배열 타입을 다룰 때 유용하다.
- `FirstParam<T>`는 handler, callback, helper 함수 시그니처에서 일부만 재사용할 때 꽤 실용적이다.

### 실무 감각

`infer`는 처음에는 마법처럼 보이지만, 결국 “패턴 매칭으로 타입 일부를 뽑아내는 문법”이라고 보면 된다.

# Part 10: 유틸리티 타입

---

## 유틸리티 타입 소개

유틸리티 타입은 타입스크립트가 기본 제공하는 재사용 가능한 타입 조작 도구다.  
핵심 문법을 이미 배운 뒤에 보면 대부분은 `mapped type`과 `conditional type`의 조합이다.

### 자주 쓰는 이유

- 반복되는 타입 가공을 줄인다.
- 코드 의도가 바로 보인다.
- 팀 코드에서 공통 표현이 쉬워진다.

## Partial, Required, Readonly

### `Partial<T>`

모든 속성을 선택적으로 만든다.

```typescript
type User = {
  id: number;
  name: string;
};

type UserPatch = Partial<User>;
```

PATCH DTO나 폼 임시 상태에서 매우 자주 쓴다.

### `Required<T>`

모든 속성을 필수로 만든다.

```typescript
type FullUser = Required<UserPatch>;
```

### `Readonly<T>`

모든 속성을 읽기 전용으로 만든다.

```typescript
type ReadonlyUser = Readonly<User>;
```

### 실무 메모

- `Partial`은 편리하지만, “무조건 부분 업데이트 가능”처럼 의미를 흐릴 수 있다.
- 중요한 입력 DTO에서는 `Partial`보다 명시적 설계가 더 나은 경우도 많다.

## Record, Pick, Omit

### `Record<K, V>`

키 집합과 값 타입으로 객체 타입을 만든다.

```typescript
type Role = "admin" | "user";
type RoleLabel = Record<Role, string>;
```

### `Pick<T, K>`

기존 타입에서 일부 속성만 뽑는다.

```typescript
type UserPreview = Pick<User, "id" | "name">;
```

### `Omit<T, K>`

기존 타입에서 일부 속성을 제거한다.

```typescript
type UserWithoutId = Omit<User, "id">;
```

### 추천 기준

- “딱 몇 개만 쓴다”면 `Pick`
- “몇 개만 뺀다”면 `Omit`
- “키 집합이 먼저다”면 `Record`

## Exclude, Extract, ReturnType

### `Exclude<T, U>`

유니온 `T`에서 `U`에 해당하는 항목을 제거한다.

```typescript
type A = Exclude<"a" | "b" | "c", "a">;
// "b" | "c"
```

### `Extract<T, U>`

유니온 `T`에서 `U`에 해당하는 항목만 남긴다.

```typescript
type B = Extract<"a" | "b" | "c", "a" | "b">;
// "a" | "b"
```

### `ReturnType<T>`

함수의 반환 타입을 뽑는다.

```typescript
function createUser() {
  return { id: 1, name: "winter" };
}

type CreatedUser = ReturnType<typeof createUser>;
```

### 실무 메모

- `ReturnType<typeof fn>`은 service/helper 함수 결과 타입을 따로 다시 쓰지 않게 해준다.
- 다만 함수 결과가 지나치게 복잡해지면 오히려 타입 별칭으로 한 번 이름을 붙이는 편이 읽기 쉽다.

## 원본 핸드북 반영 체크리스트

### 0. 들어가며

- [x] 개발 환경 설정하기

### 1. 타입스크립트 개론

- [x] 타입스크립트를 소개합니다
- [x] JS의 단점과 TS의 장점
- [x] 타입스크립트의 동작 원리
- [x] Hello TS World
- [x] 타입스크립트 컴파일러 옵션 설정하기

### 2. 타입스크립트 기본

- [x] 기본타입이란
- [x] 원시타입과 리터럴타입
- [x] 배열과 튜플
- [x] 객체
- [x] 타입 별칭과 인덱스 시그니쳐
- [x] 열거형 타입
- [x] any와 unknown
- [x] void와 never

### 3. 타입스크립트 이해하기

- [x] 타입스크립트 이해하기
- [x] 타입은 집합이다
- [x] 타입 계층도와 함께 기본타입 살펴보기
- [x] 객체 타입의 호환성
- [x] 대수 타입
- [x] 타입 추론
- [x] 타입 단언
- [x] 타입 좁히기
- [x] 서로소 유니온 타입

### 4. 함수와 타입

- [x] 함수 타입
- [x] 함수 타입 표현식과 호출 시그니쳐
- [x] 함수 타입의 호환성
- [x] 함수 오버로딩
- [x] 사용자 정의 타입가드

### 5. 인터페이스

- [x] 인터페이스
- [x] 인터페이스 확장하기
- [x] 인터페이스 선언 합치기

### 6. 클래스

- [x] 자바스크립트의 클래스 소개
- [x] 타입스크립트의 클래스
- [x] 접근 제어자
- [x] 인터페이스와 클래스

### 7. 제네릭

- [x] 제네릭 소개
- [x] 타입 변수 응용하기
- [x] map, forEach 메서드 타입 정의하기
- [x] 제네릭 인터페이스, 제네릭 타입 별칭
- [x] 제네릭 클래스
- [x] 프로미스와 제네릭

### 8. 타입 조작하기

- [x] 타입 조작이란
- [x] 인덱스드 엑세스 타입
- [x] keyof & typeof 연산자
- [x] 맵드 타입
- [x] 템플릿 리터럴 타입

### 9. 조건부 타입

- [x] 조건부 타입
- [x] 분산적인 조건부 타입
- [x] infer

### 10. 유틸리티 타입

- [x] 유틸리티 타입 소개
- [x] Partial, Required, Readonly
- [x] Record, Pick, Omit
- [x] Exclude, Extract, ReturnType

### 검증 메모

- 원본 핸드북의 11개 섹션, 53개 챕터를 기준으로 대조했다.
- 설명은 원문을 그대로 복제하지 않고, 학습용 요약과 실무 메모 중심으로 다시 정리했다.
- NestJS, TypeORM 문서와 함께 읽을 수 있도록 교차 링크와 실무 관점을 추가했다.
