import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ResetUserDto {
  code: string | any;
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "password is too weak"
  })
  new_password: string;
}
