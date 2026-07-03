import { IsString, MinLength } from 'class-validator';

export class AskDto {
  @IsString() @MinLength(2)
  text!: string;
}
