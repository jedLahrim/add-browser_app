import { IsEnum, IsString, IsUrl, Matches } from 'class-validator';
import { Action } from '../enum/enum';

export class CreateMyBrowserDto {
  @IsString({ message: 'trigger_url must be an url' })
  @IsUrl()
  @Matches(
    /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
    { message: 'this is not a valid type of URL' },
  )
  trigger_url: string;
  @IsEnum(Action, {
    message: 'this action must be a valid value',
  })
  action_type: string;
}
