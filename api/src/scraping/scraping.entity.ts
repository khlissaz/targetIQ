import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LeadBehaviour } from '../lead/lead-behaviour/lead-behaviour.entity';
import { User } from '../users/entities/user.entity';

export enum ScrapingSource {
  LINKEDIN = 'LINKEDIN',
  WHATSAPP = 'WHATSAPP',
  OTHER = 'OTHER',
}
export enum ScrapingType {
  COMMENT = 'COMMENT',
  REACTION = 'REACTION',
  REPUBLICATION = 'REPUBLICATION',
  CONNECTION = 'CONNECTION',
  FOLLOWER = 'FOLLOWER',
  SEARCH_PERSON = 'SEARCH_PERSON',
  GROUP_MEMBERSHIP = 'GROUP_MEMBERSHIP',
  OTHER = 'OTHER',
}

@Entity('scrapings')
export class Scraping {
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  @Column({ type: 'enum', enum: ScrapingSource, default: ScrapingType.OTHER })
  source: ScrapingSource; 

  @Column({ type: 'enum', enum: ScrapingType, default: ScrapingType.OTHER })
  type: ScrapingType;

  @Column()
  name: string;

  @Column({ nullable: true })
  payloadHash?: string;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey?: string;

  @ManyToOne(() => User, u => u.scrapings, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => LeadBehaviour, b => b.scraping, { cascade: ['insert','update'] })
  behaviours: LeadBehaviour[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
