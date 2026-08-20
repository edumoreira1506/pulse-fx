import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { Observation } from '../entities/observation.entity';
import { CreateObservations20260820132100 } from '../migrations/20260820132100-CreateObservations';

if (!process.env.DATABASE_URL && existsSync('.env')) {
  process.loadEnvFile('.env');
}

function createDataSource(): DataSource {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }

  return new DataSource({
    type: 'postgres',
    url,
    entities: [Observation],
    migrations: [CreateObservations20260820132100],
    synchronize: false,
    logging: false,
  });
}

let dataSource: DataSource | undefined;

export function getDataSource(): DataSource {
  dataSource ??= createDataSource();
  return dataSource;
}

export async function initializeDatabase(): Promise<DataSource> {
  const source = getDataSource();

  if (!source.isInitialized) {
    await source.initialize();
    await source.runMigrations();
  }

  return source;
}
