import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

export class GetStatusOfProcessingTaskResponseDto {
  @IsString()
  @IsNotEmpty()
  leadId: string | null;

  @IsEnum(['pending', 'success', 'failed', 'error'])
  status: string;

  @IsString()
  @IsOptional()
  email: string | null;
}
