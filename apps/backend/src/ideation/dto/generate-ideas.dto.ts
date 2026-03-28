import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateIdeasDto {
  @IsString()
  @IsNotEmpty()
  digestId!: string;
}
