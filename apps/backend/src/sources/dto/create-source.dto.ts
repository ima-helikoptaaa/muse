import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl, IsObject } from 'class-validator';
import { SourceType } from '@prisma/client';

export class CreateSourceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(SourceType)
  type!: SourceType;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsObject()
  fetchConfig?: Record<string, any>;
}
