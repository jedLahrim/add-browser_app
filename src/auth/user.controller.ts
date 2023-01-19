import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { GetUser } from './get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { LoginUserDto } from './dto/login-user.dto';
import { UserService } from './user.service';
import { ResetUserDto } from './dto/reset-user-password.dto';
import { ChangeUserDto } from './dto/change-user-password.dto';
import { AppError } from '../commons/errors/app-error';
import { Request, Response } from "express";

@Controller('user')
export class UserController {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User & any> {
    return await this.userService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<User> {
    return this.userService.login(loginUserDto);
  }

  @Post('verify_code')
  // @UseGuards(AuthGuard())
  async activate(@Body('code') code: any): Promise<User & any> {
    return this.userService.activate(code);
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string, @GetUser() user: User) {
    return await this.userService.getUserById(id);
  }

  @Post('refresh-token')
  async refreshToken(@Body('refresh') refresh): Promise<User> {
    return this.userService.refreshToken(refresh);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getUser(@GetUser() user: User) {
    return user;
  }

  @Post('send-email')
  // @UseGuards(AuthGuard())
  async sendEmail(
    @Query('email') email: string,
    @GetUser() user: User,
  ): Promise<any> {
    return this.userService.sendMail(email, user);
  }

  @Post('forget_password')
  async sendRestEmail(
    @Query('email') email: string,
    @GetUser() user?: User,
  ): Promise<any> {
    return this.userService.sendResetMail(user, email);
  }

  @Post('reset_new_password')
  // @UseGuards(AuthGuard())
  async reset(@Body() resetUserDto: ResetUserDto): Promise<User & any> {
    return await this.userService.reset(resetUserDto);
  }

  @Post('change_password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @Body() changeUserDto: ChangeUserDto,
    @GetUser() user: User,
  ): Promise<User | any> {
    return await this.userService.changePassword(user, changeUserDto);
  }

  @Patch('')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('profile_picture'))
  async update(
    @UploadedFile() profile_picture,
    @GetUser() user: User,
    @Body('full_name') full_name: string,
  ) {
    return this.userService.update(user.id, full_name, profile_picture);
  }
  @Post('sign-in-with-google')
  async signInWithGoogle(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.userService.signInWithGoogle();
      // You can now access the Firebase user object and use it to sign in to your own backend, create a JWT, etc.
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        new AppError(res.status.toString(), 'FAILED_LOGIN_WITH_GOOGLE'),
      );
    }
  }
  @Post('sign-in-with-apple')
  async signInWithApple(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.userService.signInWithApple();
      // You can now access the Firebase user object and use it to sign in to your own backend, create a JWT, etc.
      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        new AppError(res.status.toString(), 'FAILED_LOGIN_WITH_APPLE'),
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
