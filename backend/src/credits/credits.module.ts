import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credit } from './entities/credits.entity';
import { CreditsService } from './credits.service';
import { forwardRef } from '@nestjs/common';
import { CreditsController } from './credits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Credit])],
  providers: [CreditsService],
  controllers: [CreditsController],
  exports: [forwardRef(() => CreditsService)],
})
export class CreditsModule {}
