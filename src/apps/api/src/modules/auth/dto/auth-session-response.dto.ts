export class AuthSessionResponseDto {
  accessToken!: string
  tokenType!: 'Bearer'
  expiresIn!: number
}
