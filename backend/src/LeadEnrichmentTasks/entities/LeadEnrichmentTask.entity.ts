import { Base } from '../../common/base.entity';
import { LeadBehaviour } from '../../lead/lead-behaviour/lead-behaviour.entity';
import { User } from '../../users/entities/user.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';


@Entity('lead_enrichment_tasks')
export class LeadEnrichmentTask extends Base {
  @ManyToOne(() => User, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => LeadBehaviour, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: LeadBehaviour;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'enum', enum: ['DataBase', 'FullEnrich'], default: null, nullable: true })
  source: string;

  @Column({ type: 'enum', enum: ['pending', 'success', 'failed', 'timeout', 'error'], default: 'pending', nullable: false })
  status: string;

  @Column({ type: 'enum', enum: ['step0', 'step1', 'step2'], default: 'step0', nullable: false  })
  step: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  enrichmentRequestId: string;
}