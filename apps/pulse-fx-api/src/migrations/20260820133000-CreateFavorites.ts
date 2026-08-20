import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavorites20260820133000 implements MigrationInterface {
  name = 'CreateFavorites20260820133000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "favorites" (
        "id" SERIAL NOT NULL,
        "indicator_id" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_favorites" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "favorites"`);
  }
}
