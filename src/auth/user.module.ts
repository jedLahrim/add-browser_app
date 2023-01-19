import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { jwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { MyCode } from "../code/entities/code.entity";

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          transport: {
            host: 'smtp.sendgrid.net',
            auth: {
              user: 'apikey',
              pass: configService.get('SENDGRID_API_KEY'),
            },
          },
        };
      },
    }),
    TypeOrmModule.forFeature([User, MyCode]),
    HttpModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'Jwt' }),
    JwtModule.register({
      secret: 'jedJlxSecret2023',
    }),
  ],
  controllers: [UserController],
  providers: [UserService, jwtStrategy, ConfigService, JwtService],
  exports: [UserService],
})
export class UserModule {}
