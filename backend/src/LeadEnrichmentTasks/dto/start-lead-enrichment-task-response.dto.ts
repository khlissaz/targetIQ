import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

export class StartLeadEnrichmentTaskResponseDto {
  @IsString()
  @IsOptional()
  taskId: string | null;

  @IsEnum(['pending', 'success', 'failed', 'timeout', 'error'])
  status: string;

  @IsEnum(['step0', 'step1', 'step2'])
  step: string;

  @IsEnum(['DataBase', 'FullEnrich'])
  @IsOptional()
  source: string | null;

  @IsString()
  @IsOptional()
  email: string | null;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  enrichmentRequestId: string | null;
}
