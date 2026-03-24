export class UserMeDto {
  id!: string;
  email!: string;
  name!: string;
  avatarUrl!: string | null;
  mainTravelId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
