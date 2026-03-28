import { IsOptional, IsDateString } from 'class-validator';

export class GenerateDigestDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
