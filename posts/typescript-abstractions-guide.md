---
title: 'TypeScript Abstractions Guide'
date: '2026-03-22'
tags:
  - typescript/language
  - programming/abstraction
  - programming/oop
  - programming/generics
description: '인터페이스, 클래스, 제네릭처럼 재사용과 추상화에 직결되는 타입스크립트 문법을 정리한 가이드'
slug: typescript-abstractions-guide
content: |
  # TypeScript Abstractions Guide

  객체 구조를 재사용하고, 클래스 기반 코드를 안전하게 만들고, 제네릭으로 범용 API를 설계하는 파트만 따로 모은 문서다. 범위는 `인터페이스`, `클래스`, `제네릭`이다.

  ## 읽기 경로

  - [Core](https://devholic.me/posts/typescript-core-guide)
  - [Type System](https://devholic.me/posts/typescript-type-system-guide)
  - [Abstractions](https://devholic.me/posts/typescript-abstractions-guide)
  - [Advanced Types](https://devholic.me/posts/typescript-advanced-types-guide)
  - [Guide Hub](https://devholic.me/posts/typescript-beginner-guide)

  ## 함께 읽기

  - [NestJS Core Guide](https://devholic.me/posts/nestjs-core-guide): provider와 controller가 결국 클래스 기반이므로 접근 제어자와 생성자 타입 이해가 중요하다.
  - [TypeORM Core Guide](https://devholic.me/posts/typeorm-core-guide): entity 클래스와 repository API를 읽으려면 클래스와 제네릭 감각이 필요하다.
  - [TypeORM + NestJS Guide](https://devholic.me/posts/typeorm-nestjs-guide): DTO와 entity 분리, helper 함수 설계에서 제네릭과 인터페이스가 자주 등장한다.

  ## 이 문서에서 다루는 섹션

  ### Part 5: 인터페이스

  - [인터페이스](#인터페이스)
  - [인터페이스 확장하기](#인터페이스-확장하기)
  - [인터페이스 선언 합치기](#인터페이스-선언-합치기)

  ### Part 6: 클래스

  - [자바스크립트의 클래스 소개](#자바스크립트의-클래스-소개)
  - [타입스크립트의 클래스](#타입스크립트의-클래스)
  - [접근 제어자](#접근-제어자)
  - [인터페이스와 클래스](#인터페이스와-클래스)

  ### Part 7: 제네릭

  - [제네릭 소개](#제네릭-소개)
  - [타입 변수 응용하기](#타입-변수-응용하기)
  - [map, forEach 메서드 타입 정의하기](#map,-foreach-메서드-타입-정의하기)
  - [제네릭 인터페이스, 제네릭 타입 별칭](#제네릭-인터페이스,-제네릭-타입-별칭)
  - [제네릭 클래스](#제네릭-클래스)
  - [프로미스와 제네릭](#프로미스와-제네릭)

  # Part 5: 인터페이스

  ---

  ## 인터페이스

  인터페이스는 객체의 구조를 이름 붙여 설명하는 도구다.  
  타입 별칭과 겹치는 부분이 많지만, “객체 형태의 계약”을 드러낼 때 특히 읽기 좋다.

  ```typescript
  interface User {
    id: number;
    name: string;
    email?: string;
  }
  ```

  ### 언제 인터페이스가 잘 맞나

  - 객체 구조를 표현할 때
  - 클래스가 구현해야 하는 계약을 정의할 때
  - 외부 라이브러리 타입을 확장할 때

  ### 인터페이스 vs 타입 별칭

  | 기준 | interface | type |
  |------|-----------|------|
  | 객체 구조 표현 | 강함 | 가능 |
  | 유니온/인터섹션 | 약함 | 강함 |
  | 선언 합치기 | 가능 | 불가 |
  | 클래스 구현 계약 | 직관적 | 가능하지만 덜 자연스러움 |

  ### 추천 기준

  - “객체 계약”이면 `interface`
  - “조합 타입”이면 `type`
  - 팀 컨벤션이 정해져 있으면 그 규칙을 따르는 편이 더 중요하다

  ## 인터페이스 확장하기

  기존 구조를 바탕으로 더 구체적인 구조를 만들 때 `extends`를 사용한다.

  ```typescript
  interface Animal {
    name: string;
  }

  interface Dog extends Animal {
    breed: string;
  }
  ```

  ### 장점

  - 공통 구조를 반복하지 않아도 된다.
  - 역할 간 관계가 명확해진다.
  - 클래스 계층이나 API 응답 계층을 표현할 때 읽기 쉽다.

  ### 주의할 점

  - 확장을 너무 깊게 쌓으면 구조 추적이 어려워진다.
  - 재사용이 아니라 우연한 공통점을 억지로 묶는 경우에는 오히려 유지보수가 나빠진다.

  ## 인터페이스 선언 합치기

  동일한 이름의 인터페이스를 여러 번 선언하면 병합된다.

  ```typescript
  interface User {
    name: string;
  }

  interface User {
    age: number;
  }

  const user: User = {
    name: "winter",
    age: 28,
  };
  ```

  ### 어디서 유용한가

  - 전역 타입 확장
  - 외부 라이브러리 타입 augmentation
  - 프레임워크 request 객체 확장

  ### 실무 메모

  - 강력하지만 남용하면 “어디서 속성이 생겼는지” 찾기 어려워진다.
  - 애플리케이션 코드에서는 조심스럽게 쓰고, 라이브러리 확장 지점에서 주로 활용하는 편이 좋다.

  # Part 6: 클래스

  ---

  ## 자바스크립트의 클래스 소개

  타입스크립트의 클래스를 이해하려면 먼저 자바스크립트 클래스가 결국 **프로토타입 기반 문법 설탕**이라는 감각이 필요하다.

  ```typescript
  class Employee {
    name: string;

    constructor(name: string) {
      this.name = name;
    }

    work() {
      console.log(`${this.name} works`);
    }
  }
  ```

  ### 핵심 포인트

  - 클래스는 인스턴스를 찍어내는 설계도 역할을 한다.
  - 메서드는 프로토타입에 놓인다.
  - 자바스크립트 런타임에서도 실제 개념으로 존재한다.

  ## 타입스크립트의 클래스

  타입스크립트는 클래스에 타입 정보와 접근 제한 개념을 추가한다.

  ```typescript
  class User {
    name: string;
    age: number;

    constructor(name: string, age: number) {
      this.name = name;
      this.age = age;
    }
  }
  ```

  ### 생성자 축약 문법

  ```typescript
  class User {
    constructor(
      public name: string,
      private age: number,
    ) {}
  }
  ```

  ### 실무 메모

  - NestJS와 TypeORM에서는 생성자와 클래스 선언이 자주 중심이 된다.
  - 하지만 모든 데이터를 꼭 클래스로 만들 필요는 없다. 순수 데이터 구조는 plain object + type/interface가 더 단순한 경우도 많다.

  ## 접근 제어자

  타입스크립트 클래스는 `public`, `private`, `protected`, `readonly` 등을 지원한다.

  ```typescript
  class BankAccount {
    public owner: string;
    private balance: number;

    constructor(owner: string, balance: number) {
      this.owner = owner;
      this.balance = balance;
    }

    getBalance() {
      return this.balance;
    }
  }
  ```

  ### 차이

  - `public`: 어디서나 접근 가능
  - `private`: 클래스 내부에서만 접근 가능
  - `protected`: 클래스와 하위 클래스에서 접근 가능
  - `readonly`: 초기화 후 변경 불가

  ### 자주 드는 의문

  `private`가 런타임에서도 완전히 숨겨주나?`  
  타입스크립트의 `private`는 타입 수준 보호다. 자바스크립트의 `#private` 필드와는 성격이 다르다.

  ### 추천 기준

  - 외부에서 만지면 안 되는 내부 상태는 `private`
  - 하위 클래스에서만 노출할 상태는 `protected`
  - 생성 뒤 바뀌지 않아야 하는 값은 `readonly`

  ## 인터페이스와 클래스

  클래스는 인터페이스를 구현할 수 있다.

  ```typescript
  interface Shape {
    getArea(): number;
  }

  class Circle implements Shape {
    constructor(private radius: number) {}

    getArea(): number {
      return Math.PI * this.radius * this.radius;
    }
  }
  ```

  ### 왜 유용한가

  - 구현과 계약을 분리할 수 있다.
  - 테스트 더블이나 대체 구현체 설계가 쉬워진다.
  - 서비스 계층의 의존성 방향을 명확하게 만들 수 있다.

  ### 실무 메모

  - 백엔드 애플리케이션에서는 “인터페이스 기반 설계”를 과하게 가져가면 자바 스타일로 과설계되기 쉽다.
  - 실제로 대체 구현이 필요할 때만 인터페이스를 두는 편이 더 실용적인 경우도 많다.

  # Part 7: 제네릭

  ---

  ## 제네릭 소개

  제네릭은 함수, 타입, 클래스가 **여러 타입에 대해 재사용되도록** 만드는 장치다.

  ```typescript
  function identity<T>(value: T): T {
    return value;
  }

  const num = identity(10);
  const str = identity("hello");
  ```

  ### 제네릭이 필요한 이유

  - `any`를 쓰면 타입 안정성이 무너진다.
  - `unknown`을 쓰면 쓸 때마다 좁혀야 한다.
  - 제네릭은 “입력 타입과 출력 타입의 관계”를 그대로 보존한다.

  ### 가장 중요한 감각

  제네릭은 “아직 타입이 정해지지 않은 자리”를 선언하고, 실제 호출 시점에 채워 넣는 것이다.

  ## 타입 변수 응용하기

  제네릭은 단순 반환값 보존을 넘어 여러 타입 관계를 표현하는 데 쓰인다.

  ```typescript
  function swap<T, U>(a: T, b: U): [U, T] {
    return [b, a];
  }
  ```

  ### 제약 걸기

  ```typescript
  function getLength<T extends { length: number }>(value: T): number {
    return value.length;
  }
  ```

  ### 실무 메모

  - 제약 없는 제네릭은 너무 자유로워서 내부 구현이 거의 불가능할 수 있다.
  - 필요한 최소 제약을 `extends`로 거는 습관이 중요하다.

  ## map, forEach 메서드 타입 정의하기

  배열 메서드는 제네릭의 힘을 가장 직관적으로 보여준다.

  ```typescript
  function map<T, U>(arr: T[], callback: (item: T) => U): U[] {
    const result: U[] = [];
    for (const item of arr) {
      result.push(callback(item));
    }
    return result;
  }
  ```

  ```typescript
  const result = map([1, 2, 3], (item) => item.toString());
  // string[]
  ```

  ### 포인트

  - 입력 배열의 원소 타입은 `T`
  - 콜백 반환 타입은 `U`
  - 최종 결과 배열은 `U[]`

  이 관계가 보존되는 것이 제네릭의 핵심 가치다.

  ## 제네릭 인터페이스, 제네릭 타입 별칭

  객체 구조 자체를 제네릭으로 만들 수도 있다.

  ```typescript
  interface ApiResponse<T> {
    success: boolean;
    data: T;
  }

  type PageResult<T> = {
    items: T[];
    total: number;
  };
  ```

  ### 실무 예시

  - API 응답 래퍼
  - 페이지네이션 결과
  - 폼 상태 컨테이너
  - repository/helper 결과 타입

  ### trade-off

  - 일관성이 좋아지고 재사용성이 커진다.
  - 하지만 제네릭 중첩이 깊어지면 읽기 난도가 급격히 올라간다.

  ## 제네릭 클래스

  클래스도 타입 매개변수를 받을 수 있다.

  ```typescript
  class Box<T> {
    constructor(public value: T) {}

    getValue(): T {
      return this.value;
    }
  }

  const numberBox = new Box<number>(10);
  ```

  ### 어디서 보이나

  - 캐시 래퍼
  - 도메인 컨테이너
  - 큐/스택 자료구조
  - 라이브러리 내부 helper 클래스

  ## 프로미스와 제네릭

  `Promise<T>`는 제네릭의 대표 사례다.

  ```typescript
  async function fetchUser(): Promise<{ id: number; name: string }> {
    return { id: 1, name: "winter" };
  }
  ```

  ### 핵심 감각

  - `Promise<T>`의 `T`는 “나중에 resolve될 값의 타입”이다.
  - `await`를 쓰면 `Promise<T>`에서 `T`를 꺼내는 흐름으로 이해할 수 있다.

  ### 실무 메모

  - 비동기 함수의 반환 타입은 명시적으로 적어 두는 편이 좋다.
  - 서비스 코드에서는 `Promise<any>`를 방치하면 오류가 멀리 전파된다.

---