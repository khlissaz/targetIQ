import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  BeforeUpdate,
  BeforeInsert,
} from "typeorm";
import { LeadBehaviour } from "../lead-behaviour/lead-behaviour.entity";
import { User } from "../../users/entities/user.entity";

@Entity("lead_profiles")
export class LeadProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  profileLink: string;

  @Column({ nullable: true }) title?: string;
  @Column({ nullable: true }) name?: string;
  @Column({ nullable: true }) firstname?: string;
  @Column({ nullable: true }) lastname?: string;
  @Column({ nullable: true }) picture?: string;
  @Column({ nullable: true }) location?: string;
  @Column({ nullable: true }) caption?: string;
  @Column({ nullable: true }) company?: string;
  @Column({ nullable: true }) job?: string;
  @Column({ nullable: true }) email?: string;
  @Column({ nullable: true }) phone?: string;
  @Column({ nullable: true }) info?: string;
  @Column({ nullable: true }) website?: string;
  @Column({ type: "simple-json", nullable: true }) websites?: string[];
  @Column({ nullable: true }) twitter?: string;
  @Column({ nullable: true }) ims?: string;
  @Column({ type: "text", nullable: true }) about?: string;

  @Column({ type: Date, nullable: true })
  lastScrapedAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  splitName() {
    if (this.name) {
      const nameParts = this.name.trim().split(" ");
      this.firstname = nameParts[0];
      this.lastname = nameParts.slice(1).join(" ") || "";
    }
  }

  @ManyToMany(() => User)
  @JoinTable()
  users: User[];

  @OneToMany(() => LeadBehaviour, (b) => b.profile)
  behaviours: LeadBehaviour[];
}
