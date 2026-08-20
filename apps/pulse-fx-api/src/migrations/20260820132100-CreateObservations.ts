import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateObservations20260820132100 implements MigrationInterface {
  name = 'CreateObservations20260820132100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "observations" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "indicator" character varying NOT NULL,
        "value" numeric(18,8) NOT NULL,
        "reference_date" date NOT NULL,
        CONSTRAINT "PK_observations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_observations_indicator_reference_date" UNIQUE ("indicator", "reference_date")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "observations"`);
  }
}
