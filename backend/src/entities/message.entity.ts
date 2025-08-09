import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dialogueId: number;

  @Column()
  senderSocketId: string;

  @Column('text')
  originalText: string;

  @Column('text')
  translatedText: string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  timestamp: Date;
}
