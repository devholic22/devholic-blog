---
title: TypeScript Core Guide
date: '2026-03-22'
tags:
- typescript/language
- programming/basics
- programming/compiler
- programming/type-system
description: 개발 환경, 컴파일러 옵션, 기본 타입, 객체, 튜플, enum, any/unknown 등 타입스크립트의 기초를 분리한 코어
  가이드
slug: typescript-core-guide
---

# TypeScript Core Guide

타입스크립트를 처음 시작할 때 가장 먼저 읽어야 하는 기초 파트만 모아 둔 분할본이다. 범위는 `들어가며`, `타입스크립트 개론`, `타입스크립트 기본`이다.

## 읽기 경로

- [Core](https://devholic.me/posts/typescript-core-guide)
- [Type System](https://devholic.me/posts/typescript-type-system-guide)
- [Abstractions](https://devholic.me/posts/typescript-abstractions-guide)
- [Advanced Types](https://devholic.me/posts/typescript-advanced-types-guide)
- [Guide Hub](https://devholic.me/posts/typescript-beginner-guide)

## 함께 읽기

- [NestJS Core Guide](https://devholic.me/posts/nestjs-core-guide): class, decorator, module 구조를 읽기 전에 타입스크립트 기본 문법을 먼저 잡을 때
- [TypeORM Core Guide](https://devholic.me/posts/typeorm-core-guide): entity 클래스와 relation 모델링을 읽기 전에 객체 타입과 클래스 감각을 먼저 잡을 때

## 이 문서에서 다루는 섹션

### Part 0: 들어가며

- [개발 환경 설정하기](#개발-환경-설정하기)

### Part 1: 타입스크립트 개론

- [타입스크립트를 소개합니다](#타입스크립트를-소개합니다)
- [JS의 단점과 TS의 장점](#js의-단점과-ts의-장점)
- [타입스크립트의 동작 원리](#타입스크립트의-동작-원리)
- [Hello TS World](#hello-ts-world)
- [타입스크립트 컴파일러 옵션 설정하기](#타입스크립트-컴파일러-옵션-설정하기)

### Part 2: 타입스크립트 기본

- [기본타입이란](#기본타입이란)
- [원시타입과 리터럴타입](#원시타입과-리터럴타입)
- [배열과 튜플](#배열과-튜플)
- [객체](#객체)
- [타입 별칭과 인덱스 시그니쳐](#타입-별칭과-인덱스-시그니쳐)
- [열거형 타입](#열거형-타입)
- [any와 unknown](#any와-unknown)
- [void와 never](#void와-never)

# Part 0: 들어가며

---

## 개발 환경 설정하기

타입스크립트 학습은 문법보다 먼저 실행 환경을 안정적으로 잡는 것부터 시작하는 편이 좋다.  
실무에서도 `tsc`, `node`, `package.json`, `tsconfig.json`의 관계를 이해하지 못하면 나중에 빌드나 테스트에서 쉽게 막힌다.

### 최소 시작 세팅

```bash
npm init -y
npm install -D typescript ts-node @types/node
npx tsc --init
```

### 가장 단순한 실행 예시

```typescript
// src/index.ts
const message: string = "Hello TypeScript";
console.log(message);
```

```bash
npx ts-node src/index.ts
```

### 실무 메모

- 학습 단계에서는 `ts-node`로 빠르게 실행해도 되지만, 서비스 코드에서는 보통 `tsc`로 컴파일한 뒤 실행한다.
- `@types/node`를 빼면 `process`, `__dirname`, `fs` 같은 Node 전역 타입이 제대로 잡히지 않을 수 있다.
- 프레임워크를 쓰더라도 결국 핵심은 `tsconfig.json`이다. NestJS, Vite, Next.js도 내부에서 이 설정의 영향을 받는다.

# Part 1: 타입스크립트 개론

---

## 타입스크립트를 소개합니다

타입스크립트는 자바스크립트에 타입 시스템을 추가한 언어다.  
정확히 말하면 런타임을 바꾸는 언어가 아니라, **개발 단계에서 오류를 더 빨리 발견하게 해 주는 정적 분석 도구이자 컴파일 언어**에 가깝다.

### 핵심 포인트

- 자바스크립트 문법을 그대로 사용할 수 있다.
- 실행 전에 타입 오류를 찾을 수 있다.
- 최종적으로는 자바스크립트로 변환되어 실행된다.
- IDE 자동완성과 리팩터링 지원이 크게 좋아진다.

### 가장 흔한 오해

`타입스크립트를 쓰면 런타임 에러가 없어지는가?`  
그렇지는 않다. 타입스크립트는 **많은 종류의 실수를 미리 막아줄 뿐**이고, 네트워크 오류, 외부 입력 오류, 잘못된 비즈니스 로직까지 자동으로 해결해주진 않는다.

## JS의 단점과 TS의 장점

자바스크립트는 유연하다. 그런데 그 유연함이 규모가 커질수록 오히려 위험이 되기도 한다.

### 자바스크립트에서 흔한 문제

```javascript
function add(a, b) {
  return a + b;
}

add(1, 2);      // 3
add("1", 2);    // "12"
add({}, []);    // "[object Object]"
```

런타임까지 가기 전에는 이 코드가 의도에 맞는지 확실히 알기 어렵다.

### 타입스크립트로 같은 의도 표현하기

```typescript
function add(a: number, b: number): number {
  return a + b;
}

add(1, 2);
add("1", 2); // error
```

### trade-off

- 타입을 적는 비용은 늘어난다.
- 하지만 규모가 커질수록 실수 탐지와 리팩터링 안정성에서 얻는 이익이 더 크다.
- 특히 팀 프로젝트, 라이브러리 개발, 장기 유지보수 코드에서는 체감 차이가 크다.

## 타입스크립트의 동작 원리

타입스크립트 코드는 직접 실행되지 않는다. 먼저 타입 검사와 변환 과정을 거쳐 자바스크립트가 된다.

### 흐름

1. `.ts` 파일 작성
2. 타입 검사 수행
3. 자바스크립트로 변환
4. Node.js 또는 브라우저에서 실행

### 중요한 점

- 타입 정보는 대부분 컴파일 후 사라진다.
- 그래서 런타임에는 `number`, `string`, `interface` 같은 타입 개념이 그대로 남아 있지 않다.
- 런타임 검증이 필요하면 `zod`, `class-validator`, `io-ts` 같은 별도 도구가 필요하다.

### 자주 드는 의문

`타입이 사라지는데 왜 유용한가?`  
대부분의 버그는 작성 단계에서 잡히는 편이 훨씬 싸다. 타입스크립트는 이 비용을 앞당겨 줄여준다.

## Hello TS World

기본 감각은 실제 파일을 만들고 컴파일해 보는 과정에서 가장 빨리 잡힌다.

```typescript
const hello: string = "TS World";
console.log(hello);
```

```bash
npx tsc src/index.ts
node src/index.js
```

### 실무 메모

- 학습 초기에는 `ts-node`가 편하지만, 최종적으로는 `tsc`가 실제로 무엇을 생성하는지 한 번은 보는 편이 좋다.
- 프레임워크 뒤에 가려져 있더라도 컴파일 산출물이 JS라는 사실을 잊지 않는 것이 중요하다.

## 타입스크립트 컴파일러 옵션 설정하기

`tsconfig.json`은 타입스크립트 프로젝트의 성격을 결정하는 핵심 파일이다.

### 자주 보는 옵션

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "rootDir": "src",
    "outDir": "dist",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### 꼭 이해해야 하는 옵션

| 옵션 | 의미 | 실무 메모 |
|------|------|-----------|
| `target` | 어떤 버전의 JS로 변환할지 | 런타임 환경과 맞춰야 한다 |
| `module` | 모듈 시스템 | Node ESM/CJS와 직접 연결된다 |
| `strict` | 엄격한 타입 검사 묶음 | 학습 단계부터 켜두는 편이 좋다 |
| `rootDir`, `outDir` | 소스/출력 경로 | 빌드 결과 정리에 중요하다 |
| `esModuleInterop` | import 호환성 | CommonJS 패키지와 자주 부딪힌다 |
| `skipLibCheck` | 라이브러리 타입 검사 생략 | 빌드 속도는 좋아지지만, 라이브러리 타입 문제를 가릴 수 있다 |

### 추천 기준

- 개인 학습과 실무 모두 `strict: true` 권장
- 라이브러리 작성 시 `declaration` 옵션도 자주 고려
- NestJS/Node 환경에서는 `module`, `moduleResolution`, `emitDecoratorMetadata` 같은 옵션도 함께 확인

# Part 2: 타입스크립트 기본

---

## 기본타입이란

타입은 값이 어떤 형태인지 설명하는 약속이다.  
타입스크립트의 기본 타입은 이후 모든 고급 기능의 재료가 된다.

### 자주 쓰는 타입

- `number`
- `string`
- `boolean`
- `null`
- `undefined`
- `object`
- `symbol`
- `bigint`

### 예시

```typescript
let age: number = 28;
let userName: string = "winter";
let isAdmin: boolean = false;
```

## 원시타입과 리터럴타입

원시 타입은 큰 범주고, 리터럴 타입은 그 안의 더 구체적인 단일 값 타입이다.

```typescript
let status: "success" | "error" = "success";
let direction: "left" | "right" = "left";
```

### 왜 중요한가

- 문자열 몇 개만 허용되는 API 상태값 표현에 유용하다.
- enum 없이도 안전한 분기 처리가 가능하다.
- 나중에 배우는 서로소 유니온의 기반이 된다.

### trade-off

- 자유로운 문자열보다 안전하다.
- 하지만 값 집합이 너무 자주 바뀌는 경우에는 관리 비용이 늘 수 있다.

## 배열과 튜플

배열은 같은 타입의 값을 여러 개 담는 구조고, 튜플은 길이와 순서까지 타입으로 고정하는 구조다.

### 배열 예시

```typescript
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["a", "b", "c"];
```

### 튜플 예시

```typescript
let user: [number, string] = [1, "winter"];
let rgb: [number, number, number] = [255, 255, 0];
```

### 자주 드는 의문

`튜플을 언제 써야 하나?`  
각 요소의 의미가 위치로 구분될 때만 쓰는 편이 좋다. 의미가 복잡해지면 객체가 더 읽기 쉽다.

## 객체

객체 타입은 속성의 이름과 각 속성의 타입을 함께 표현한다.

```typescript
let user: { id: number; name: string; isAdmin?: boolean } = {
  id: 1,
  name: "winter",
};
```

### 핵심 포인트

- 속성마다 타입을 지정할 수 있다.
- 선택적 속성은 `?`를 붙인다.
- `readonly`로 변경 불가 속성을 만들 수 있다.

```typescript
let config: { readonly appName: string; debug: boolean } = {
  appName: "my-app",
  debug: true,
};
```

### 실무 메모

- 간단한 한두 번짜리 구조는 inline object type으로 충분하다.
- 여러 곳에서 재사용되면 `type` 또는 `interface`로 분리하는 편이 좋다.

## 타입 별칭과 인덱스 시그니쳐

`type`은 기존 타입에 이름을 붙여 재사용하기 쉽게 만든다.

```typescript
type User = {
  id: number;
  name: string;
};
```

### 인덱스 시그니처

키의 이름은 고정되지 않았지만, 값의 타입은 일정한 객체를 표현할 때 쓴다.

```typescript
type ScoreBoard = {
  [studentName: string]: number;
};

const scores: ScoreBoard = {
  alice: 90,
  bob: 85,
};
```

### 주의할 점

- 인덱스 시그니처를 너무 넓게 열면 오히려 타입 안정성이 약해진다.
- 키 집합이 정해져 있다면 `Record`나 유니온 키 기반 설계가 더 안전할 수 있다.

## 열거형 타입

enum은 관련된 상수를 하나의 그룹으로 묶는다.

```typescript
enum Role {
  USER,
  ADMIN,
  SUPER_ADMIN,
}

const myRole: Role = Role.ADMIN;
```

### 문자열 enum

```typescript
enum Status {
  PENDING = "PENDING",
  DONE = "DONE",
  FAILED = "FAILED",
}
```

### trade-off

- enum은 선언과 사용이 직관적이다.
- 하지만 런타임 객체가 생성되고, 번들/직렬화 관점에서 부담이 생길 수 있다.
- 단순 상태값이라면 `"PENDING" | "DONE"` 같은 리터럴 유니온이 더 가벼운 경우가 많다.

## any와 unknown

둘 다 “아직 정확히 모르는 값”에 자주 등장하지만, 성격은 완전히 다르다.

### `any`

- 타입 검사를 사실상 꺼버린다.
- 빠르게 임시 우회할 때는 편하다.
- 하지만 전파되기 시작하면 코드 전체의 안정성을 깎아먹는다.

### `unknown`

- 값의 실제 타입을 사용 전에 확인하도록 강제한다.
- 외부 입력, JSON 파싱 결과, catch error 같은 경계 지점에서 더 안전하다.

```typescript
function printLength(value: unknown) {
  if (typeof value === "string") {
    console.log(value.length);
  }
}
```

### 추천 기준

- `any`는 정말 마지막 수단으로만 사용
- 경계 입력에는 `unknown` 우선
- 장기 코드에서는 `any`보다 `unknown + narrowing`이 거의 항상 낫다

## void와 never

둘 다 “값이 없다”와 비슷하게 오해되기 쉽지만 의미가 다르다.

### `void`

반환값을 특별히 사용하지 않는 함수에 붙는다.

```typescript
function log(message: string): void {
  console.log(message);
}
```

### `never`

절대로 정상적으로 끝나지 않는 함수, 또는 도달 불가능한 경우에 등장한다.

```typescript
function fail(message: string): never {
  throw new Error(message);
}
```

### 자주 드는 의문

`never`는 언제 체감되나?`  
서로소 유니온 exhaustive check를 할 때 특히 유용하다. 나중에 조건부 타입과 함께 보면 더 강하게 체감된다.
