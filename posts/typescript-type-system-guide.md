---
title: 'TypeScript Type System Guide'
date: '2026-03-22'
tags:
  - typescript/language
  - programming/type-system
  - programming/functions
description: '타입 계층도, 호환성, 추론, 단언, 좁히기, 함수 타입 등 타입스크립트 타입 시스템의 핵심을 정리한 가이드'
slug: typescript-type-system-guide
content: |
  # TypeScript Type System Guide

  타입스크립트를 “문법 모음”이 아니라 “타입 시스템”으로 이해하기 시작하는 구간만 분리한 문서다. 범위는 `타입스크립트 이해하기`, `함수와 타입`이다.

  ## 읽기 경로

  - [Core](https://devholic.me/posts/typescript-core-guide)
  - [Type System](https://devholic.me/posts/typescript-type-system-guide)
  - [Abstractions](https://devholic.me/posts/typescript-abstractions-guide)
  - [Advanced Types](https://devholic.me/posts/typescript-advanced-types-guide)
  - [Guide Hub](https://devholic.me/posts/typescript-beginner-guide)

  ## 함께 읽기

  - [NestJS Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide): DTO, pipe, serialization에서 타입 좁히기와 함수 시그니처 이해가 중요하다.
  - [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide): optional query DTO와 repository API를 연결할 때 타입 계층과 narrowing 감각이 중요하다.

  ## 이 문서에서 다루는 섹션

  ### Part 3: 타입스크립트 이해하기

  - [타입스크립트 이해하기](#타입스크립트-이해하기)
  - [타입은 집합이다](#타입은-집합이다)
  - [타입 계층도와 함께 기본타입 살펴보기](#타입-계층도와-함께-기본타입-살펴보기)
  - [객체 타입의 호환성](#객체-타입의-호환성)
  - [대수 타입](#대수-타입)
  - [타입 추론](#타입-추론)
  - [타입 단언](#타입-단언)
  - [타입 좁히기](#타입-좁히기)
  - [서로소 유니온 타입](#서로소-유니온-타입)

  ### Part 4: 함수와 타입

  - [함수 타입](#함수-타입)
  - [함수 타입 표현식과 호출 시그니쳐](#함수-타입-표현식과-호출-시그니쳐)
  - [함수 타입의 호환성](#함수-타입의-호환성)
  - [함수 오버로딩](#함수-오버로딩)
  - [사용자 정의 타입가드](#사용자-정의-타입가드)

  # Part 3: 타입스크립트 이해하기

  ---

  ## 타입스크립트 이해하기

  타입스크립트는 단순히 `: number`를 붙이는 언어가 아니다.  
  값들의 집합을 어떻게 모델링하고, 그 집합 사이의 관계를 어떻게 판단하는지를 이해해야 진짜로 편해진다.

  ### 이 파트의 핵심 질문

  - 어떤 값이 어떤 타입에 들어갈 수 있는가?
  - 왜 어떤 대입은 되고 어떤 대입은 안 되는가?
  - 추론, 단언, 좁히기는 각각 무엇을 하는가?

  ## 타입은 집합이다

  타입은 특정 조건을 만족하는 값들의 집합으로 볼 수 있다.

  ```typescript
  let num: number;
  num = 10;
  num = 20;
  ```

  `number` 타입은 모든 숫자 값의 집합이다.  
  `"hello"` 같은 리터럴 타입은 값 하나만 가진 아주 작은 집합이다.

  ### 왜 이 관점이 중요한가

  - 유니온은 집합의 합집합으로 볼 수 있다.
  - 인터섹션은 교집합처럼 이해할 수 있다.
  - 상위 타입/하위 타입 관계도 집합 포함 관계로 생각하면 훨씬 명확해진다.

  ## 타입 계층도와 함께 기본타입 살펴보기

  타입은 더 넓은 타입과 더 좁은 타입 사이의 계층을 가진다.

  ### 대략적인 감각

  - `"hello"` 는 `string` 보다 좁다
  - `string` 은 `unknown` 보다 좁다
  - `never` 는 어떤 타입보다도 좁다

  ```typescript
  let a: unknown;
  let b: string = "hello";

  a = b; // 가능
  // b = a; // 불가능
  ```

  ### 핵심 타입들의 역할

  | 타입 | 역할 |
  |------|------|
  | `unknown` | 가장 안전한 최상위 타입 |
  | `any` | 검사 우회용 특수 타입 |
  | `never` | 값이 절대 존재하지 않는 타입 |

  ### 실무 메모

  - 외부 입력의 출발점은 `unknown`
  - 절대 도달하면 안 되는 상태는 `never`
  - `any`는 계층을 흐리는 예외적 탈출구

  ## 객체 타입의 호환성

  타입스크립트는 **구조적 타입 시스템**을 사용한다.  
  즉, 이름보다 구조가 더 중요하다.

  ```typescript
  type Dog = { name: string; age: number };
  type Pet = { name: string };

  let dog: Dog = { name: "콩", age: 3 };
  let pet: Pet = dog; // 가능
  ```

  `Dog`는 `Pet`이 요구하는 구조를 포함하므로 대입 가능하다.

  ### 자주 드는 의문

  `이름이 다른데 왜 대입이 되지?`  
  타입스크립트는 nominal typing이 아니라 structural typing이 기본이기 때문이다.

  ### trade-off

  - 유연하고 재사용성이 좋다.
  - 하지만 너무 비슷한 구조가 우연히 호환되어 버려 의도치 않은 대입이 생길 수도 있다.
  - 도메인 의미가 중요하면 branded type 같은 별도 기법을 고려할 수 있다.

  ## 대수 타입

  대수 타입은 여러 타입을 조합해 새로운 타입을 만드는 방식이다.

  ### 유니온 타입

  ```typescript
  type Input = string | number;
  ```

  둘 중 하나를 허용한다.

  ### 인터섹션 타입

  ```typescript
  type HasName = { name: string };
  type HasAge = { age: number };

  type Person = HasName & HasAge;
  ```

  둘 다 동시에 만족해야 한다.

  ### 실무 메모

  - 유니온은 분기와 상태 표현에 강하다.
  - 인터섹션은 여러 제약을 합치는 데 유용하다.
  - 인터섹션을 남발하면 오류 메시지가 매우 복잡해질 수 있다.

  ## 타입 추론

  타입스크립트는 가능한 한 개발자가 적지 않아도 타입을 추론하려고 한다.

  ```typescript
  let num = 10;         // number
  let title = "hello";  // string
  ```

  ### 좋은 추론과 나쁜 추론

  - 지역 변수, 반환값, 제네릭 호출에서는 대체로 잘 된다.
  - 빈 배열, 넓은 객체 초기값, 복잡한 콜백에서는 의도보다 넓거나 좁게 추론될 수 있다.

  ```typescript
  const arr = []; // any[] 또는 never[] 같은 애매한 상태를 만들기 쉽다
  ```

  ### 추천 기준

  - 추론이 명확하면 생략
  - API 경계, 공개 함수, 복잡한 객체에는 명시적 타입 추가
  - “헷갈리면 적어라”가 실무에서는 더 안전하다

  ## 타입 단언

  단언은 “타입스크립트야, 이 값의 타입을 내가 더 잘 안다”고 말하는 행위다.

  ```typescript
  const input = document.getElementById("name") as HTMLInputElement;
  ```

  ### 주의할 점

  - 단언은 검사가 아니라 주장이다.
  - 잘못 단언하면 런타임에서 그대로 터진다.
  - 좁히기 대신 단언으로 습관적으로 우회하면 타입스크립트의 이점을 크게 잃는다.

  ### 추천 기준

  - DOM, 라이브러리 타입 한계, 프레임워크 내부 훅 등에서 제한적으로 사용
  - 가능하면 type guard나 runtime check를 먼저 고려

  ## 타입 좁히기

  좁히기는 넓은 타입을 더 구체적인 타입으로 줄이는 과정이다.

  ```typescript
  function print(value: string | number) {
    if (typeof value === "string") {
      console.log(value.toUpperCase());
    } else {
      console.log(value.toFixed(2));
    }
  }
  ```

  ### 좁히기에 쓰는 도구

  - `typeof`
  - `instanceof`
  - 속성 존재 검사 (`"kind" in value`)
  - truthy/falsy 검사
  - 사용자 정의 타입 가드

  ### 실무 메모

  - `unknown`을 제대로 쓰려면 narrowing을 익혀야 한다.
  - API 응답, 에러 객체, 폼 입력, 쿼리 파라미터에서 거의 매번 등장한다.

  ## 서로소 유니온 타입

  서로소 유니온은 각 타입이 공통의 구분자 필드를 갖고, 그 값이 겹치지 않는 유니온이다.

  ```typescript
  type Loading = { state: "loading" };
  type Success = { state: "success"; data: string[] };
  type ErrorState = { state: "error"; message: string };

  type FetchState = Loading | Success | ErrorState;
  ```

  ### 분기 예시

  ```typescript
  function render(state: FetchState) {
    switch (state.state) {
      case "loading":
        return "loading...";
      case "success":
        return state.data.join(", ");
      case "error":
        return state.message;
    }
  }
  ```

  ### 왜 강력한가

  - 상태 모델링이 명확해진다.
  - 각 분기에서 필요한 필드만 안전하게 접근 가능하다.
  - reducer, API 상태, UI 상태, 백엔드 응답 모델에 매우 잘 맞는다.

  ### `never` exhaustive check 패턴

  서로소 유니온이 진짜 강해지는 지점은 `switch` 분기 누락을 컴파일 단계에서 잡을 수 있다는 점이다.

  ```typescript
  function assertNever(x: never): never {
    throw new Error(`처리되지 않은 케이스: ${JSON.stringify(x)}`);
  }

  function render(state: FetchState) {
    switch (state.state) {
      case "loading":
        return "loading...";
      case "success":
        return state.data.join(", ");
      case "error":
        return state.message;
      default:
        return assertNever(state);
    }
  }
  ```

  ### 왜 유용한가

  - `FetchState`에 새 케이스를 추가했는데 `switch`를 안 고치면 바로 타입 오류가 난다.
  - 런타임 버그를 “빠진 분기” 수준에서 미리 막을 수 있다.
  - reducer, 비동기 상태 머신, API 응답 상태 모델에서 특히 효과가 크다.

  ### 실무 메모

  `never`를 “값이 없는 타입”으로만 외우면 감이 약하다.  
  실무에서는 “모든 케이스를 다 처리했는지 확인하는 마지막 안전장치”로 기억하는 편이 훨씬 잘 남는다.

  # Part 4: 함수와 타입

  ---

  ## 함수 타입

  함수도 값이므로 타입을 가진다.  
  매개변수 타입과 반환값 타입이 함수 타입의 핵심이다.

  ```typescript
  function add(a: number, b: number): number {
    return a + b;
  }
  ```

  ### 실무 메모

  - 공개 함수, 서비스 메서드, helper 함수는 반환 타입까지 명시하는 편이 좋다.
  - 내부 짧은 콜백까지 전부 명시할 필요는 없다.

  ## 함수 타입 표현식과 호출 시그니쳐

  함수의 형태를 타입으로 따로 뽑아낼 수 있다.

  ### 함수 타입 표현식

  ```typescript
  type Add = (a: number, b: number) => number;

  const add: Add = (a, b) => a + b;
  ```

  ### 호출 시그니처

  ```typescript
  type Operation = {
    (a: number, b: number): number;
    description: string;
  };
  ```

  ### 언제 무엇을 쓰나

  - 단순 함수 모양이면 함수 타입 표현식
  - 함수이면서 추가 속성이 필요한 객체면 호출 시그니처

  ## 함수 타입의 호환성

  함수도 구조적으로 비교된다. 다만 매개변수와 반환 타입의 방향이 헷갈리기 쉽다.

  ### 기본 감각

  - 반환 타입은 더 구체적인 쪽이 대체로 안전하다.
  - 매개변수는 반대로 더 넓게 받을 수 있어야 안전하다.

  이 지점은 이론적으로는 variance 이야기로 이어진다.  
  실무에서는 “내가 기대하는 인수보다 더 좁게만 받는 함수는 위험하다” 정도로 기억하면 된다.

  ## 함수 오버로딩

  입력 형태에 따라 다른 시그니처를 제공하고 싶을 때 쓴다.

  ```typescript
  function parse(value: string): number;
  function parse(value: number): string;
  function parse(value: string | number): string | number {
    if (typeof value === "string") {
      return Number(value);
    }
    return String(value);
  }
  ```

  ### trade-off

  - API 의도를 명확히 드러낼 수 있다.
  - 하지만 구현 시그니처와 선언 시그니처를 함께 관리해야 해서 복잡해질 수 있다.
  - 단순 유니온 + narrowing으로 해결 가능하면 그쪽이 더 읽기 쉬운 경우도 많다.

  ## 사용자 정의 타입가드

  직접 타입 좁히기 함수를 만들 수 있다.

  ```typescript
  type Admin = { role: "admin"; permissions: string[] };
  type User = { role: "user"; name: string };

  function isAdmin(value: Admin | User): value is Admin {
    return value.role === "admin";
  }
  ```

  ### 사용 예시

  ```typescript
  function printUser(value: Admin | User) {
    if (isAdmin(value)) {
      console.log(value.permissions.join(", "));
    } else {
      console.log(value.name);
    }
  }
  ```

  ### 실무 메모

  - 복잡한 DTO 유니온, API 응답 상태, 권한 모델에서 특히 유용하다.
  - 단, 구현이 잘못되면 타입스크립트는 그 거짓말을 믿는다. guard 함수의 정확성이 매우 중요하다.

---