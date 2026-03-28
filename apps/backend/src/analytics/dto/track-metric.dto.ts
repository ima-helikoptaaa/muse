import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsDateString, IsObject } from 'class-validator';
import { Platform } from '@prisma/client';

export class TrackMetricDto {
  @IsString()
  @IsNotEmpty()
  contentPieceId!: string;

  @IsEnum(Platform)
  platform!: Platform;

  @IsDateString()
  metricDate!: string;

  @IsOptional()
  @IsNumber()
  impressions?: number;

  @IsOptional()
  @IsNumber()
  clicks?: number;

  @IsOptional()
  @IsNumber()
  likes?: number;

  @IsOptional()
  @IsNumber()
  comments?: number;

  @IsOptional()
  @IsNumber()
  shares?: number;

  @IsOptional()
  @IsNumber()
  followers?: number;

  @IsOptional()
  @IsNumber()
  engagementRate?: number;

  @IsOptional()
  @IsObject()
  rawData?: Record<string, any>;
}
