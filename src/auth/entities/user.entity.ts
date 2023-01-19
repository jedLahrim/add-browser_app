import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MyBrowser } from '../../my-browser/entities/my-browser.entity';
import { MyCode } from "../../code/entities/code.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  full_name: string;

  @Column()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password is too weak',
  })
  @Exclude()
  password: string;

  @Column({ default: null })
  profile_picture?: string;

  @Column({ default: false })
  @Exclude()
  activated?: boolean;

  @OneToMany((_type) => MyCode, (code) => code.user, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @Exclude()
  code?: MyCode[];

  @OneToMany((_type) => MyBrowser, (browsers) => browsers.user, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @Exclude()
  browsers: MyBrowser[];


  access?: string;
  refresh?: string;
  refresh_expire_at?: Date;
  access_expire_at?: Date;

  @Column({ default: null })
  @IsOptional()
  @Exclude()
  customerId?: string;

  @Column({ default: null, type: 'simple-array' })
  roles: string[];
}
