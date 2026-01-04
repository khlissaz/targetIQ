import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadEnrichmentTasksController } from './lead-enrichment-tasks.controller';
import { LeadEnrichmentTasksService } from './lead-enrichment-tasks.service';
import { LeadEnrichmentTask } from './entities/LeadEnrichmentTask.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LeadBehaviour } from 'src/lead/lead-behaviour/lead-behaviour.entity';
import { Credit } from 'src/credits/entities/credits.entity';
import { CreditsModule } from 'src/credits/credits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadEnrichmentTask, User, LeadBehaviour]),
    UsersModule,
    HttpModule,
    ConfigModule.forRoot(),
    CreditsModule,
  ],
  controllers: [LeadEnrichmentTasksController],
  providers: [LeadEnrichmentTasksService],
  exports: [LeadEnrichmentTasksService],
})
export class LeadEnrichmentTasksModule {}