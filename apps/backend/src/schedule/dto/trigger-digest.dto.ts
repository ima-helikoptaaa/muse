import { IsOptional, IsDateString } from 'class-validator';

export class TriggerDigestDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
