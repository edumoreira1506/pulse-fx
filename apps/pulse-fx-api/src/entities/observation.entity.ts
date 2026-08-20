import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

const numericTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

const isoDateTransformer = {
  to: (value: string) => value,
  from: (value: string | Date) => {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
};

@Entity({ name: 'observations' })
@Unique('UQ_observations_indicator_reference_date', [
  'indicator',
  'referenceDate',
])
export class Observation {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'varchar' })
  indicator: string;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 8,
    transformer: numericTransformer,
  })
  value: number;

  @Column({
    name: 'reference_date',
    type: 'date',
    transformer: isoDateTransformer,
  })
  referenceDate: string;
}
