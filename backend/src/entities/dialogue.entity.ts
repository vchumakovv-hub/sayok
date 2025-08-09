import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Dialogue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userAId: number;

  @Column()
  userBId: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  startedAt: Date;
}
