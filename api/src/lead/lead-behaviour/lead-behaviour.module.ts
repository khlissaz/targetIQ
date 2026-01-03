import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadBehaviour } from './lead-behaviour.entity';
import { LeadBehaviourService } from './lead-behaviour.service';
import { LeadBehaviourController } from './lead-behaviour.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeadBehaviour])],
  providers: [LeadBehaviourService],
  controllers: [LeadBehaviourController],
  exports: [LeadBehaviourService],
})
export class LeadBehaviourModule {}
