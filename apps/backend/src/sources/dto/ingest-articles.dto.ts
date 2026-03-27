import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SourceType } from '@prisma/client';

export class FetchedArticleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  externalId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @IsArray()
  @IsString({ each: true })
  authors!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  publishedAt?: Date;
}

export class IngestArticlesDto {
  @IsEnum(SourceType)
  sourceType!: SourceType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FetchedArticleDto)
  articles!: FetchedArticleDto[];
}
