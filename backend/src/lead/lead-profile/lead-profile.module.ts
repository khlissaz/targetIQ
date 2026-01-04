import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadProfile } from './lead-profile.entity';
import { LeadProfileService } from './lead-profile.service';
import { LeadProfileController } from './lead-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeadProfile])],
  providers: [LeadProfileService],
  controllers: [LeadProfileController],
  exports: [LeadProfileService],
})
export class LeadProfileModule {}
