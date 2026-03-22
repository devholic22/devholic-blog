---
title: 'TypeORM Operations Guide'
date: '2026-03-22'
tags:
  - backend/typeorm
  - backend/migrations
  - backend/operations
  - backend/database
  - backend/dba
  - typescript/library
description: 'Migration, Git 협업 충돌, DBA 체크리스트, CLI까지 운영 관점만 분리한 TypeORM 가이드'
slug: typeorm-operations-guide
content: |
  # TypeORM Operations Guide

  운영과 배포, migration, DBA 관점 점검만 집중해서 보고 싶을 때 보는 분할본이다. 범위는 Part 7이다.

  ## 읽기 경로

  - [Core](https://devholic.me/posts/typeorm-core-guide)
  - [Advanced](https://devholic.me/posts/typeorm-advanced-guide)
  - [Operations](https://devholic.me/posts/typeorm-operations-guide)
  - [NestJS](https://devholic.me/posts/typeorm-nestjs-guide)
  - [Guide Hub](https://devholic.me/posts/typeorm-beginner-guide)

  ## 함께 읽기

  - [NestJS Techniques Guide](https://devholic.me/posts/nestjs-techniques-guide): Nest 앱에서 `data-source.ts`, migration CLI, multi connection을 붙일 때
  - [NestJS Advanced Guide](https://devholic.me/posts/nestjs-advanced-guide): 테스트 환경과 운영 환경의 DB 차이를 함께 점검할 때

  ## 이 문서에서 다루는 섹션

  - [왜 Migration이 필요한가](#왜-migration이-필요한가)
  - [Migration 설정](#migration-설정)
  - [Migration 생성, 실행, 롤백, 상태 확인](#migration-생성,-실행,-롤백,-상태-확인)
  - [Fake Migration, 트랜잭션 모드, 추가 옵션](#fake-migration,-트랜잭션-모드,-추가-옵션)
  - [Migration에서의 QueryRunner API](#migration에서의-queryrunner-api)
  - [Git 협업에서 Migration 충돌을 푸는 법](#git-협업에서-migration-충돌을-푸는-법)
  - [DBA 시각으로 보는 Migration 리뷰 질문](#dba-시각으로-보는-migration-리뷰-질문)
  - [CLI](#cli)
  - [Vite / ts-node / 번들링 주의점](#vite-/-ts-node-/-번들링-주의점)

  # Part 7: 스키마 변경과 CLI

  ---

  ## 왜 Migration이 필요한가

  운영 환경에서 `synchronize: true`는 위험하다.  
  운영 DB에는 이미 데이터가 있으므로, 스키마 변경은 **명시적이고 되돌릴 수 있어야** 한다.

  ### Migration의 역할

  - 스키마 변경 기록
  - 배포 절차의 재현성
  - rollback 가능성
  - 코드와 DB 구조의 동기화

  ### 왜 `synchronize`로 버티면 안 되는가

  ```typescript
  // 개발 때는 편하지만 운영에서는 위험
  new DataSource({
    type: "postgres",
    synchronize: true,
  });
  ```

  예를 들어 `title` 컬럼을 `name`으로 바꾸는 순간, 운영 데이터베이스에서는 rename 전략이 아닌 다른 SQL이 생성되거나 예상과 다른 손상이 생길 수 있다. 이런 순간부터는 migration이 사실상 필수다.

  ---

  ## Migration 설정

  핵심은 아래 세 가지다.

  - `synchronize: false`
  - `migrations`
  - `migrationsRun` / `migrationsTableName` / `migrationsTransactionMode`

  ### 트랜잭션 모드

  - `all`
  - `each`
  - `none`

  ### 판단 기준

  - 대부분: `all`
  - concurrent index 등 트랜잭션 불가 작업 포함: `none` 또는 `each`

  ### 설정 예제

  ```typescript
  import { DataSource } from "typeorm";

  export default new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + "/entities/*.entity.{js,ts}"],
    migrations: [__dirname + "/migrations/*.{js,ts}"],
    synchronize: false,
    migrationsTableName: "migrations",
    migrationsTransactionMode: "all",
  });
  ```

  ---

  ## Migration 생성, 실행, 롤백, 상태 확인

  ### 수동 생성

  ```bash
  typeorm migration:create src/migrations/add-user-table
  ```

  ### 자동 생성

  ```bash
  typeorm migration:generate -d src/data-source.ts src/migrations/update-user
  ```

  ### 실행

  ```bash
  typeorm migration:run -- -d src/data-source.ts
  ```

  ### 롤백

  ```bash
  typeorm migration:revert -- -d src/data-source.ts
  ```

  ### 상태 보기

  ```bash
  typeorm migration:show -- -d src/data-source.ts
  ```

  ### 공식 문서가 주는 운영 감각

  - 개발 중에는 generate가 빠르다.
  - 하지만 generated SQL은 **반드시 읽어야 한다.**
  - rename, type change, constraint change는 자동 생성이 마음에 들지 않을 수 있다.

  ### 수동 migration 예제

  ```typescript
  import { MigrationInterface, QueryRunner } from "typeorm";

  export class AddUsersTable1710000000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL
        )
      `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE users`);
    }
  }
  ```

  ### package.json 스크립트 예제

  ```json
  {
    "scripts": {
      "typeorm": "typeorm-ts-node-commonjs",
      "migration:generate": "npm run typeorm migration:generate -- -d src/app-data-source.ts src/migrations/auto",
      "migration:run": "npm run typeorm migration:run -- -d src/app-data-source.ts",
      "migration:revert": "npm run typeorm migration:revert -- -d src/app-data-source.ts"
    }
  }
  ```

  ---

  ## Fake Migration, 트랜잭션 모드, 추가 옵션

  ### Fake migration

  실제 쿼리는 실행하지 않고 migration table에만 반영한다.

  이럴 때 쓴다.

  - 이미 수동으로 DB 변경을 마친 경우
  - 외부 도구가 먼저 변경한 경우

  ### per-migration transaction override

  `MigrationInterface`의 `transaction` 속성으로 개별 migration의 트랜잭션 여부를 조절할 수 있다. 단, 전체 모드가 `each` 또는 `none`일 때 의미가 있다.

  ### 추가 옵션

  - `--timestamp`
  - pretty formatting
  - JS output / ESM output

  ### 예제

  ```bash
  # 이미 수동으로 DB 반영을 끝냈고 기록만 남기고 싶을 때
  typeorm migration:run -d src/app-data-source.ts --fake

  # 마지막 migration을 실제 롤백 없이 기록만 되돌리고 싶을 때
  typeorm migration:revert -d src/app-data-source.ts --fake
  ```

  ---

  ## Migration에서의 QueryRunner API

  Migration 안에서는 `QueryRunner`로 schema를 직접 조작할 수 있다.

  ### 가능한 작업 예시

  - DB / schema 생성/삭제
  - table 생성/삭제
  - column 추가/삭제
  - index 생성/삭제
  - foreign key / unique / check 제약 관리

  ### 언제 유용한가

  - generated SQL보다 더 명시적으로 관리하고 싶을 때
  - DB 종속 기능을 세밀하게 써야 할 때
  - 복합적인 schema refactor

  ### 예제

  ```typescript
  import { MigrationInterface, QueryRunner, Table, TableColumn } from "typeorm";

  export class AddProfiles1710000000001 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: "profiles",
          columns: [
            { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
            { name: "bio", type: "varchar", isNullable: true },
          ],
        }),
      );

      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "profileId",
          type: "int",
          isNullable: true,
        }),
      );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropColumn("users", "profileId");
      await queryRunner.dropTable("profiles");
    }
  }
  ```

  ---

  ## Git 협업에서 Migration 충돌을 푸는 법

  > 이 섹션은 TypeORM 공식 문서의 `migration:generate`, `migration:run`의 timestamp 순 실행, `--fake`, `--timestamp`, `migrationsTransactionMode`, `QueryRunner API`를 바탕으로 재구성한 운영 규칙이다. Git merge conflict 자체는 공식 문서가 직접 설명하지 않으므로, 아래 내용에는 문서 기반 운영 추론이 포함된다.

  ### 왜 충돌이 생기는가

  - migration 파일도 결국 Git이 관리하는 코드이기 때문이다.
  - 각 브랜치는 자기 로컬 스키마와 엔티티 상태를 기준으로 migration을 생성한다.
  - TypeORM은 pending migration을 **timestamp 순서**로 실행한다.
  - rebase/merge 후에는 예전에 생성한 migration이 더 이상 현재 main 기준 엔티티 상태와 맞지 않을 수 있다.

  ### 절대 원칙

  - **공유 환경에서 한 번이라도 실행된 migration은 수정, rename, 재정렬하지 않는다.**
  - **아직 내 로컬 브랜치에만 있는 migration은 지우고 다시 generate하거나 수동으로 정리해도 된다.**
  - **merge 뒤에는 항상 clean DB에서 전체 migration을 처음부터 다시 실행해본다.**
  - **generated migration은 무조건 사람이 읽는다.** rename, type change, constraint 변경은 특히 수동 보정이 자주 필요하다.
  - **`--timestamp`는 질서를 맞추는 도구이지, 이미 배포된 역사를 꾸미는 도구가 아니다.**

  ### 상태별 해결책

  | 상태 | 권장 해결 | 피해야 할 행동 |
  |------|-----------|----------------|
  | 로컬 브랜치에만 있음 | 삭제 후 regenerate, 수동 수정, squash 가능 | 애매한 SQL을 억지로 살려두기 |
  | 팀 main에는 머지됐지만 아무 공유 DB에도 안 나감 | rebase 후 하나로 정리하거나 reconciliation migration 추가 | 검증 없이 충돌난 두 migration을 그대로 두기 |
  | 스테이징/운영 등 공유 DB에서 이미 실행됨 | append-only corrective migration 작성, 필요 시 manual fix + `--fake` | 실행된 migration 파일 본문 수정, 파일명/클래스명 변경 |

  ### 가장 흔한 충돌 시나리오와 해결

  **1. 같은 migration 파일을 두 브랜치가 동시에 수정한 경우**  
  이 경우는 보통 “이미 존재하던 migration 파일을 건드린 것” 자체가 문제다.

  - 아직 어디에도 배포되지 않았다면, 한 파일로 다시 정리하거나 파일을 지우고 regenerate해도 된다.
  - 이미 공유 환경에 실행된 파일이라면 손대지 말고 새 corrective migration을 추가해야 한다.

  **2. 서로 다른 브랜치가 같은 테이블을 각자 변경하는 migration을 만든 경우**  
  예를 들어 A 브랜치는 `users.display_name` 추가, B 브랜치는 `users.nickname` unique 제약을 추가했다고 하자.

  1. main 기준으로 rebase/merge한다.
  2. clean DB에서 전체 migration을 처음부터 `migration:run` 한다.
  3. 애플리케이션을 부팅한다.
  4. 그 다음 `migration:generate`를 다시 돌려서 불필요한 추가 diff가 생기는지 본다.

  이때 새 diff가 생긴다면, 기존 두 migration이 main 기준 최종 엔티티 상태를 온전히 설명하지 못한다는 뜻이다.  
  그 경우엔 **이미 공유 환경에 나간 migration을 수정하지 말고, reconciliation migration을 하나 더 추가**하는 편이 안전하다.

  ### 검증 루틴 예제

  ```bash
  # 1. main 최신 상태 반영
  git rebase origin/main

  # 2. clean DB에서 전체 migration 실행
  npm run migration:run

  # 3. 현재 실행 상태 확인
  npm run typeorm migration:show -- -d src/app-data-source.ts

  # 4. 엔티티와 실제 스키마가 완전히 일치하는지 검증
  npm run typeorm migration:generate -- -d src/app-data-source.ts src/migrations/__verify__ --pretty
  ```

  - 공식 문서 기준으로 `migration:generate`는 diff가 없으면 종료 코드 `1`로 끝난다.
  - 검증용 generate가 실제 파일을 만들었다면, 그 파일을 곧바로 커밋하기보다 먼저 **왜 drift가 생겼는지**부터 분석해야 한다.

  ### 운영 중 수동 Hotfix와 `--fake`

  운영에서 긴급 SQL hotfix를 먼저 적용했고, 나중에 코드 저장소에도 같은 이력을 맞춰야 할 때가 있다.  
  이럴 때는 공식 문서의 `--fake`가 매우 유용하다.

  ```bash
  # 운영 DB에는 이미 수동 반영이 끝났고, migration history만 맞출 때
  typeorm migration:run -d src/app-data-source.ts --fake
  ```

  - manual hotfix와 migration history를 맞추는 용도다.
  - 이미 수동 반영이 끝난 변경을 다시 실행하지 않게 해준다.
  - 단, `--fake`는 “실제 DB 상태가 migration 내용과 완전히 같다”는 전제가 있어야 한다.

  ### 특히 자주 생기는 난감한 질문

  **Q. 이미 운영에는 더 최신 migration이 먼저 나갔는데, 나중에 merge된 브랜치의 migration timestamp가 더 오래됐다. 수정해야 하나?**  
  공식 문서 기준으로 TypeORM은 **pending migration을 timestamp 순서로** 실행한다.  
  하지만 이미 공유 환경에서 실행된 migration의 파일명이나 timestamp를 뒤늦게 바꾸는 것은 더 위험하다. 이 경우의 원칙은 간단하다.

  - 이미 실행된 파일은 건드리지 않는다.
  - 늦게 들어온 migration이 현재 스키마와 충돌하면 corrective migration을 추가한다.
  - timestamp는 실행 순서를 설명하는 힌트이지, 배포 이력을 다시 쓰는 도구가 아니다.

  **Q. 두 브랜치가 우연히 비슷한 이름의 migration을 만들었거나, `-t`를 잘못 써서 timestamp를 겹치게 만들었다면?**  
  아직 공유 환경에 실행되지 않았다면 파일명/클래스명을 정리하고 regenerate하는 편이 낫다.  
  공유 환경에 이미 실행됐다면 rename보다 새 migration 추가가 안전하다.

  **Q. release 직전에 migration 파일 여러 개를 squash해도 되나?**  
  로컬 또는 배포 전용 브랜치에서 아직 아무 공유 DB에 실행되지 않았다면 가능하다.  
  하지만 한 번이라도 공유 환경에 실행된 migration은 squash, rename, reorder 대상이 아니다.

  ### reconciliation migration 예제

  ```typescript
  import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
  } from "typeorm";

  export class ReconcileUsersDisplayName1710000000002
    implements MigrationInterface
  {
    async up(queryRunner: QueryRunner): Promise<void> {
      if (!(await queryRunner.hasTable("users"))) {
        throw new Error('expected table "users" to exist before reconciliation');
      }

      if (!(await queryRunner.hasColumn("users", "display_name"))) {
        await queryRunner.addColumn(
          "users",
          new TableColumn({
            name: "display_name",
            type: "varchar",
            isNullable: true,
          }),
        );
      }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
      if (await queryRunner.hasColumn("users", "display_name")) {
        await queryRunner.dropColumn("users", "display_name", true);
      }
    }
  }
  ```

  ### 이 예제를 어떻게 봐야 하나

  - `hasTable`, `hasColumn`, `dropColumn(..., true)` 같은 `QueryRunner API`는 drift 흡수에 유용하다.
  - 하지만 모든 migration을 이런 방어 코드로 감싸기 시작하면, 실제 drift를 가려버릴 수도 있다.
  - 즉, **정상 경로 migration은 단순하고 명시적으로**, **reconciliation/hotfix migration만 방어적으로** 쓰는 편이 좋다.

  ### 실무 규칙 요약

  - migration은 가능하면 `한 PR = 한 논리 단위`로 끊는다.
  - merge 후 drift 검증이 실패하면 기존 shared migration을 수정하지 말고 새 migration으로 수습한다.
  - 이미 실행된 migration을 Git에서 되돌리는 것보다, 앞으로 가는 corrective migration이 대체로 안전하다.
  - 자동 실행(`migrationsRun`)은 편하지만, 다중 인스턴스 운영에선 배포 파이프라인에서 단일 실행으로 관리하는 편이 더 통제하기 쉽다.

  ---

  ## DBA 시각으로 보는 Migration 리뷰 질문

  > 이 섹션은 TypeORM 공식 문서가 제공하는 migration primitive 위에, 보수적인 운영 원칙을 덧붙인 리뷰 체크리스트다. 락, rewrite, zero-downtime 배포 판단은 최종적으로 **대상 DB 자체 문서와 운영 환경 특성**으로 다시 검증해야 한다.

  ### 1. 이 변경은 additive인가, mutative인가, destructive인가

  - additive: 컬럼 추가, 인덱스 추가, 새 테이블 추가
  - mutative: 타입 변경, rename, 제약 변경
  - destructive: 컬럼 삭제, 테이블 삭제, 데이터 삭제

  변경이 destructive에 가까울수록 자동 generate 결과를 그대로 믿으면 안 된다.

  ### 2. 앱의 이전 버전과 새 버전이 동시에 버틸 수 있는가

  운영 배포는 종종 “migration 먼저, 앱 나중” 또는 “앱 일부 인스턴스만 새 버전” 상태를 잠시 만든다.  
  따라서 DBA 관점에서는 **expand-contract**를 기본 전략으로 본다.

  ### expand-contract 예제

  ```typescript
  import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

  export class AddDisplayName1710000000003 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "display_name",
          type: "varchar",
          isNullable: true,
        }),
      );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropColumn("users", "display_name", true);
    }
  }
  ```

  ```typescript
  import { MigrationInterface, QueryRunner } from "typeorm";

  export class EnforceDisplayName1710000000004 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        UPDATE users
        SET display_name = name
        WHERE display_name IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE users
        ALTER COLUMN display_name SET NOT NULL
      `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        ALTER TABLE users
        ALTER COLUMN display_name DROP NOT NULL
      `);
    }
  }
  ```

  이 패턴의 의미는 단순하다.

  1. 먼저 nullable/additive 변경을 한다.
  2. 애플리케이션이 새 컬럼을 쓰도록 배포한다.
  3. backfill을 끝낸 뒤 제약을 강화한다.
  4. 구 컬럼 삭제는 더 나중 migration으로 분리한다.

  ### 3. transaction mode가 정말 맞는가

  공식 문서상 기본은 `all`이다. 하지만 모든 DDL이 하나의 트랜잭션에 들어가면 좋은 것은 아니다.

  - 대부분의 일반 schema 변경: `all`
  - migration 하나는 독립 실패/성공으로 보고 싶을 때: `each`
  - concurrent index처럼 트랜잭션 밖이 필요한 작업: `none` 또는 `each` + 개별 migration `transaction = false`

  ```typescript
  import { MigrationInterface, QueryRunner } from "typeorm";

  export class AddUsersEmailIdx1710000000005 implements MigrationInterface {
    transaction = false;

    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY users_email_idx ON users(email)
      `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        DROP INDEX CONCURRENTLY users_email_idx
      `);
    }
  }
  ```

  ### 4. 이 변경은 대용량 테이블에 어떤 영향을 주는가

  TypeORM은 migration을 실행해주지만, lock 비용과 rewrite 비용까지 자동으로 판단해주지는 않는다.

  반드시 스스로 묻는다.

  - 이 테이블 row 수는 얼마인가
  - peak 시간대 write traffic은 얼마인가
  - 이 변경은 long lock 또는 rewrite 가능성이 있는가
  - online 방식이 가능한가
  - maintenance window가 필요한가

  여기서 답이 불명확하면, generated SQL을 운영과 유사한 데이터 크기에서 먼저 검증해야 한다.

  ### 5. schema migration과 data migration을 섞고 있는가

  DDL과 대량 backfill을 한 migration에 몰아넣으면 실패 지점과 복구 지점이 흐려진다.

  - 가능하면 schema 추가
  - 앱 dual-write
  - 데이터 backfill
  - 제약 강화
  - 정리(drop)  
  순서로 나눈다.

  ### 6. rollback이 진짜 rollback인가

  공식 문서상 `migration:revert`는 마지막 실행 migration의 `down`을 실행한다.  
  하지만 DBA 관점에서는 “`down`이 존재한다”와 “실제로 안전하게 되돌릴 수 있다”는 다르다.

  - data-loss 성격의 migration은 down이 있어도 원상복구가 불가능할 수 있다.
  - irreversible change라면 migration 주석과 배포 문서에 **forward-only**임을 명시하는 편이 낫다.
  - 운영 사고 시 revert보다 corrective migration이 더 안전한 경우가 많다.

  ### 7. drift를 수용할 것인가, 실패로 드러낼 것인가

  운영 환경이 여러 개이고 수동 hotfix 가능성이 있다면, drift 대응 방침을 먼저 정해야 한다.

  - 정상 경로: drift를 숨기지 말고 실패하게 둔다.
  - reconciliation/hotfix migration: `hasTable`, `hasColumn`, `getTable`, `ifExists`를 써서 흡수한다.
  - manual DDL 후에는 `--fake`를 고려한다.

  ### 8. 이름을 명시적으로 줬는가

  constraint/index 이름이 자동 생성에만 의존하면 diff noise가 커지고, 복구 시 가독성이 떨어진다.

  ```typescript
  import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

  export class AddOrdersUserFk1710000000006 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createForeignKey(
        "orders",
        new TableForeignKey({
          name: "fk_orders_user_id",
          columnNames: ["user_id"],
          referencedTableName: "users",
          referencedColumnNames: ["id"],
          onDelete: "CASCADE",
        }),
      );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropForeignKey("orders", "fk_orders_user_id", true);
    }
  }
  ```

  ### 9. 검증 기준이 SQL 이전에 준비돼 있는가

  migration 성공은 “명령이 끝났다”가 아니라, **의도한 상태가 만들어졌다**여야 한다.

  검증 질문은 최소한 이 정도는 있어야 한다.

  - `migration:show`에서 실행 상태가 예상과 일치하는가
  - 필수 table/column/index/constraint가 실제로 생겼는가
  - 앱이 새 스키마에서 부팅되는가
  - 주요 read/write 경로가 정상 동작하는가
  - backfill row count와 누락 건수가 검증됐는가

  ### 10. 실행 주체가 하나인지 분명한가

  TypeORM 공식 문서에는 `migrationsRun` 옵션이 있다.  
  하지만 DBA 관점에서는 “앱 인스턴스 여러 대가 동시에 뜰 때 누가 migration을 실행하는가”를 먼저 묻는다.

  - 단일 인스턴스나 단순 개발 환경: `migrationsRun`도 가능
  - 다중 인스턴스 운영: 배포 파이프라인이나 별도 job에서 단일 실행이 더 통제하기 쉽다
  - 중요한 것은 “어디선가 한 번만 실행된다”는 사실을 보장하는 것이다

  ### 11. DataSource가 하나인가, 여러 개인가

  TypeORM은 다중 DataSource, 다중 DB, 다중 schema도 지원한다.  
  따라서 DBA 시각에서는 아래를 추가로 묻는다.

  - migration 대상이 정확히 어느 DataSource인가
  - 같은 배포에서 여러 DB/schema를 어떤 순서로 올릴 것인가
  - 하나가 실패했을 때 나머지를 어떻게 정리할 것인가
  - 앱이 여러 DataSource 중 일부만 새 스키마여도 버틸 수 있는가

  ### 12. 최종적으로 이 migration은 읽는 사람이 이해할 수 있는가

  20년차 DBA 관점의 migration은 대개 “짧고, 명시적이고, 의도가 읽힌다.”

  - 자동 생성 SQL을 그대로 두더라도 의도가 불명확하면 수동 정리한다.
  - destructive 작업은 별도 migration으로 뺀다.
  - hot table, huge table, critical index는 더 작은 단계로 나눈다.
  - 한 번 읽고 “무엇을, 왜, 어떤 순서로” 바꾸는지 보여야 한다.

  ---

  ## CLI

  공식 CLI가 제공하는 범위:

  - project init
  - entity / subscriber 생성
  - migration create / generate / run / revert / show
  - schema sync / log / drop
  - raw query 실행
  - cache clear
  - version 확인

  ### 실무 메모

  `schema:sync`, `schema:drop`는 강력하지만 운영에서는 위험하다.  
  운영 자동화 파이프라인에서는 보통 `migration:run`만 남기는 편이 안전하다.

  ### 자주 쓰는 명령 예제

  ```bash
  typeorm entity:create src/entities/user.entity
  typeorm subscriber:create src/subscribers/user.subscriber
  typeorm schema:log
  typeorm cache:clear
  typeorm version
  ```

  ---

  ## Vite / ts-node / 번들링 주의점

  ### ts-node

  TS migration을 직접 실행하려면 `typeorm-ts-node-commonjs` 또는 `typeorm-ts-node-esm` 사용.

  ### 번들러 주의

  Webpack/Vite production minify가 migration class name을 바꾸면, TypeORM이 migration 이름을 제대로 인식하지 못할 수 있다.

  ### Vite 대응

  - minify 끄기
  - identifier mangling 끄기
  - terser로 migration class name 보존

  ### 예제

  ```typescript
  // vite.config.ts
  export default defineConfig({
    build: {
      sourcemap: true,
      minify: "terser",
      terserOptions: {
        mangle: { keep_classnames: /^Migrations\d+$/ },
        compress: { keep_classnames: /^Migrations\d+$/ },
      },
    },
  });
  ```

  ---

---