import { Observation } from '../entities/observation.entity';
import { getDataSource } from '../configuration/database';

export interface CachedObservation {
  indicator: string;
  value: number;
  referenceDate: string;
  updatedAt: Date;
}

export async function findObservationsByIndicatorAndPeriod(
  indicator: string,
  from: string,
  to: string,
): Promise<CachedObservation[]> {
  const observations = await getDataSource()
    .getRepository(Observation)
    .createQueryBuilder('observation')
    .where('observation.indicator = :indicator', { indicator })
    .andWhere('observation.reference_date BETWEEN :from AND :to', { from, to })
    .orderBy('observation.reference_date', 'ASC')
    .getMany();

  return observations.map(toCachedObservation);
}

export async function findLatestObservations(
  indicator: string,
  limit: number,
): Promise<CachedObservation[]> {
  const observations = await getDataSource()
    .getRepository(Observation)
    .find({
      where: { indicator },
      order: { referenceDate: 'DESC' },
      take: limit,
    });

  return observations.reverse().map(toCachedObservation);
}

export async function saveObservations(
  indicator: string,
  rows: Array<{ date: string; value: number }>,
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  await getDataSource()
    .getRepository(Observation)
    .upsert(
      rows.map((row) => ({
        indicator,
        referenceDate: row.date,
        value: row.value,
      })),
      ['indicator', 'referenceDate'],
    );
}

function toCachedObservation(observation: Observation): CachedObservation {
  return {
    indicator: observation.indicator,
    value: observation.value,
    referenceDate: observation.referenceDate,
    updatedAt: observation.updatedAt,
  };
}
