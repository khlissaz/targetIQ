import { IsString, IsNotEmpty } from 'class-validator';

export class StartLeadEnrichmentTaskRequestDto {
  @IsString()
  @IsNotEmpty()
  leadId: string;
}

