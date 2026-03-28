import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ContentFormat, Platform } from '@prisma/client';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @IsEnum(ContentFormat)
  format!: ContentFormat;

  @IsEnum(Platform)
  targetPlatform!: Platform;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleContentDto {
  @IsString()
  @IsNotEmpty()
  scheduledDate!: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}
