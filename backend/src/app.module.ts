import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadProfileModule } from './lead/lead-profile/lead-profile.module';
import { LeadBehaviourModule } from './lead/lead-behaviour/lead-behaviour.module';
import { ScrapingModule } from './scraping/scraping.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CreditsModule } from './credits/credits.module';
import { LeadEnrichmentTasksModule } from './LeadEnrichmentTasks/lead-enrichment-tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    LeadProfileModule,
    LeadBehaviourModule,
    ScrapingModule,
    UsersModule,
    AuthModule,
    CreditsModule,
    LeadEnrichmentTasksModule
  ],
})
export class AppModule {}
