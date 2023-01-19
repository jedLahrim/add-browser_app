import { PartialType } from '@nestjs/mapped-types';
import { CreateMyBrowserDto } from './create-my-browser.dto';
import { IsEnum, IsString, IsUrl, Matches } from 'class-validator';
import { Action } from '../enum/enum';

export class UpdateMyBrowserDto {
  @IsString({ message: 'trigger_url must be an url' })
  @IsUrl()
  @Matches(
    /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
    { message: 'this is not a valid type of URL' },
  )
  trigger_url: string;
  @IsEnum(Action, {
    message: 'this action must be a valid action',
  })
  action_type: string;
}
