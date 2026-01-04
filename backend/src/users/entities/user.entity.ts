import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Scraping } from "../../scraping/scraping.entity";
import { LeadProfile } from "../../lead/lead-profile/lead-profile.entity";
import { LeadBehaviour } from "../../lead/lead-behaviour/lead-behaviour.entity";
import { UserRole } from "../user-role.enum";
import { Credit } from "../../credits/entities/credits.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: "text", nullable: true })
  fullName?: string;

  @Column()
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;


  @Column({ type: "text", nullable: true })
  country: string | null;

  @Column( { type: "text",  default: "en" } )
  language: string;

  @Column( { default: "free" } )
  subscriptionTier: string;

  @Column( { default: "inactive" } )
  subscriptionStatus: string;

  @Column({ type: "timestamp", nullable: true })
  subscriptionEndDate: string | null;

  @OneToMany(() => Credit, (credit) => credit.user)
  credits: Credit[];


  @Column({ type: "int", default: 100 })
  scrapingCredit: number;

  @Column({ type: "int", default: 50 })
  enrichmentCredit: number;

  @Column({ default: 0 })
  dailyScrapeCount: number; // Tracks daily scraped data for the user

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dailyResetDate: Date


  @OneToMany(() => Scraping, (s) => s.user)
  scrapings: Scraping[];

  @ManyToMany(() => LeadProfile)
  @JoinTable()
  leadProfiles: LeadProfile[];

  @OneToMany(() => LeadBehaviour, (b) => b.user)
  leadBehaviours: LeadBehaviour[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
