import { IsOptional, IsUUID } from 'class-validator';

export class SetMainTravelDto {
  @IsOptional()
  @IsUUID()
  travelId!: string | null;
}
