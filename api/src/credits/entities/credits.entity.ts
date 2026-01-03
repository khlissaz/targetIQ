import { User } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CreditType {
  SCRAPING = 'scraping',
  ENRICHMENT = 'enrichment',
  AI = 'ai',
  OTHER = 'other',
}

@Entity('credits')
export class Credit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CreditType })
  type: CreditType;

  @Column({ type: 'int', default: 0 })
  amount: number;

   @Column({ default: 0 })
  dailyScrapeCount: number; // Tracks daily scraped data for the user

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dailyResetDate: Date

  @ManyToOne(() => User, (user) => user.credits, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
