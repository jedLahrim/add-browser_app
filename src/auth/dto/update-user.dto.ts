import {PartialType} from '@nestjs/mapped-types';
import {CreateUserDto} from './create-user.dto';
import {IsString, MaxLength, MinLength} from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    full_name: string;
}
