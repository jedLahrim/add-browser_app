import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum Asc {
  asc = 'asc',
  desc = 'desc',
}

export enum DateType {
  start_date = 'START_DATE',
  end_date = 'END_DATE',
}

export class FilterBrowserDto {
  @IsOptional()
  @IsString()
  id?: string;
  @IsOptional()
  @IsString()
  search?: string;
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date_lte?: Date;
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date_gte?: Date;
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date_lte?: Date;
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date_gte?: Date;
  @IsOptional()
  @IsEnum(DateType, {
    message: 'this date type is invalid',
  })
  sort_by: string;
  @IsOptional()
  @IsEnum(Asc, {
    message: 'this field type is invalid',
  })
  asc?: string;
  @IsOptional()
  skip?: number;
  @IsOptional()
  take?: number;
}
