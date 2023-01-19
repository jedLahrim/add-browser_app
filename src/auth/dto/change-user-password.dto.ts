import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ChangeUserDto {
  old_password: string;
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "password is too weak"
  })
  new_password: string;
}
