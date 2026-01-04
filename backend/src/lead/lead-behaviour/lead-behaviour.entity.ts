import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LeadProfile } from '../lead-profile/lead-profile.entity';
import { ReactionType } from './enums/reaction-type.enum';
import { Scraping } from '../../scraping/scraping.entity';
import { User } from '../../users/entities/user.entity';
import { LeadType } from './enums/lead-type.enum';
import { LeadSource } from './enums/lead-source.enum';

@Entity('lead_behaviours')
export class LeadBehaviour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LeadProfile, { eager: true })
  @JoinColumn({ name: 'lead_id' })
  profile: LeadProfile;

  @ManyToOne(() => Scraping, { nullable: true })
  @JoinColumn({ name: 'scraping_id' })
  scraping?: Scraping;

  @Column({ type: 'enum', enum: LeadType, nullable: true })
  type?: LeadType;

  @Column({ type: 'enum', enum: LeadSource, nullable: true })
  source?: LeadSource;

  @Column({ type: 'text', nullable: true })
  sourceLink?: string;

  @Column({ type: 'text', nullable: true })
  text?: string;

  @Column({ type: 'enum', enum: ReactionType, nullable: true })
  reactionType?: ReactionType;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({
    type: 'enum',
    enum: ['new', 'contacted', 'qualified', 'enriched', 'converted', 'pending', 'success', 'error'],
    default: 'new',
  })
  status: 'new' | 'contacted' | 'qualified' | 'enriched' | 'converted' | 'pending' | 'success' | 'error';

  @Column({ type: 'text', nullable: true })
  group_name?: string;
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
