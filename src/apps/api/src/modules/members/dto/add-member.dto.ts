import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidationArguments,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'exactlyOneField', async: false })
class ExactlyOneOfEmailOrGuestName implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { email?: string; guestName?: string };
    const hasEmail = obj.email !== undefined && obj.email !== null;
    const hasGuestName = obj.guestName !== undefined && obj.guestName !== null;
    return (hasEmail && !hasGuestName) || (!hasEmail && hasGuestName);
  }

  defaultMessage(): string {
    return 'Exactly one of email or guestName must be provided';
  }
}

export class AddMemberDto {
  @ValidateIf((o) => o.email !== undefined || o.guestName === undefined)
  @IsEmail()
  @Validate(ExactlyOneOfEmailOrGuestName)
  email?: string;

  @ValidateIf((o) => o.guestName !== undefined || o.email === undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  guestName?: string;
}
