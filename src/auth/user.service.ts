import {
  ConflictException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AppError } from '../commons/errors/app-error';
import {
  EMAIL_OR_PASSWORD_IS_INCORRECT,
  ERR_EMAIL_ALREADY_EXIST,
  ERR_EMAIL_NOT_FOUND,
  ERR_EXPIRED_CODE,
  ERR_NOT_FOUND_USER,
  ERR_SEND_MAIL,
} from '../commons/errors/errors-codes';
import { MailerService } from '@nestjs-modules/mailer';
import { Constant } from '../commons/constant';
import { LoginUserDto } from './dto/login-user.dto';
import { ResetUserDto } from './dto/reset-user-password.dto';
import { ChangeUserDto } from './dto/change-user-password.dto';
import { ConfigService } from '@nestjs/config';
import { rethrow } from '@nestjs/core/helpers/rethrow';
import { use } from 'passport';
import { jwtStrategy } from './jwt.strategy';
import { JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import * as firebase from 'firebase/app';
import * as fireBase from 'firebase/auth';
import 'firebase/auth';
import { Client } from '@googlemaps/google-maps-services-js';
import { Response } from 'supertest';
import { MyCode } from "../code/entities/code.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(MyCode)
    private myCodeRepo: Repository<MyCode>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @Inject(forwardRef(() => JwtService))
    private jwtService: JwtService,
    private jwtStrategy: jwtStrategy,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}
  private client_id = new OAuth2Client({
    clientId:
      '740659733369-ba7168em2scb7lq4ff4b1pl7jm1slnk9.apps.googleusercontent.com',
  });

  async register(createUserDto: CreateUserDto) {
    const { email, full_name, password } = createUserDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    try {
      const user = this.userRepo.create({
        email,
        full_name,
        password: hashedPassword,
      });
      user.roles = ['admin'];
      const newUser = await this.userRepo.save(user);
      console.log(newUser);
      await this.sendMail(user.email, newUser);
      // return newUser;
    } catch (error) {
      console.log(error.code);
      if (error.code == 'ER_DUP_ENTRY') {
        throw new ConflictException(new AppError(ERR_EMAIL_ALREADY_EXIST));
      } else {
        throw new InternalServerErrorException('402');
      }
    }
  }

  async sendMail(email: string, user: User): Promise<any> {
    try {
      user = await this.userRepo.findOne({ where: { email } });
      console.log(user);
      const from = this.configService.get('SENDER_MAIL');
      const code = await this.generateCode(user);
      console.log(code.code);
      await this.mailerService.sendMail({
        to: user.email,
        from: from,
        subject: `Hi ${user.full_name} this is your activation code ${code.code}`,
        text:
          `Hello ${user.full_name} from eventApp ` +
          `this is your activation code ${code.code}`,
        //html: `Click <a href="${url}">here</a> to activate your account !`,
      });
    } catch (e) {
      console.log(e);
      throw new NotFoundException(
        new AppError(ERR_SEND_MAIL, 'email not found'),
      );
    }
  }

  async sendResetMail(user: User, email: string | any) {
    user = await this.userRepo.findOne({ where: { email } });
    console.log(user);
    if (user == null) {
      throw new ConflictException(
        new AppError(ERR_EMAIL_NOT_FOUND, 'email not found'),
      );
    } else {
      const code = await this.generateResetCode(user);
      console.log(code.code);
      await this.mailerService.sendMail({
        to: user.email,
        from: this.configService.get('SENDER_MAIL'),
        subject: `Hi ${user.full_name} this is your activation code ${code.code}`,
        text:
          `Hello ${user.full_name} from eventApp ` +
          `this is your activation code ${code.code}`,
        //html: `Click <a href="${url}">here</a> to activate your account !`,
      });
    }
  }

  async activate(code: any): Promise<User> {
    // EXPIRE_AT 20:15:20
    // new Date() 20:15:10
    const now = new Date();
    let found = await this.myCodeRepo.findOne({ where: { code: code } });
    if (!found) {
      throw new ConflictException('code is incorrect');
    }
    const user = await this.getUserById(found.user_id);
    if (user.code.length > 2) {
      throw new InternalServerErrorException(
        new AppError(`ERR`, 'account already activated'),
      );
    }
    if (found.expire_at < now) {
      throw new HttpException(
        new AppError(
          ERR_EXPIRED_CODE,
          'this code is expired try to send it again',
        ),
        HttpStatus.NOT_FOUND,
      );
    } else {
      user.activated = true;
      await this.userRepo.save(user);
      return this.getUserWithTokens(user);
    }
  }

  async reset(resetUserDto: ResetUserDto) {
    const { new_password, code } = resetUserDto;
    try {
      const now = new Date();
      // let fx = '';
      console.log(now);
      let found = await this.myCodeRepo.findOne({ where: { code: code } });
      const user = await this.getUserById(found.user_id);
      if (found.expire_at < new Date()) {
        // console.log(fx);
        await this.myCodeRepo.delete({ id: found.id });
        return new AppError(
          ERR_EXPIRED_CODE,
          'this code is expired try to send it again',
        );
      } else {
        console.log(user);
        if (found.code == code) {
          console.log(new_password);
          const bcrypt = require('bcrypt');
          const salt = await bcrypt.genSalt(5);
          const hashedPassword = await bcrypt.hash(new_password, salt);
          console.log(hashedPassword);
          // user = await this.userRepo.create({ reset_password: hashedPassword });
          // const result = await this.authService.updateData(user.id, {
          //   new_password,
          // });
          // console.log(result);
          user.password = hashedPassword;
          const newUser = await this.userRepo.save(user);
          return this.getUserWithTokens(newUser);

          // return hashedPassword;
        }
      }
    } catch (error) {
      if (error.code == undefined) {
        throw new ConflictException(
          new AppError('INCORRECT_CODE', 'code is incorrect'),
        );
      }
    }
  }

  async changePassword(user: User, changeUserDto: ChangeUserDto) {
    const { old_password, new_password } = changeUserDto;
    if (user && (await bcrypt.compare(old_password, user.password))) {
      console.log(user.password);
      console.log(old_password);
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(new_password, salt);
      console.log(hashedPassword);
      // const result = await this.authService.updateData(user.id, {
      //   new_password,
      // });
      // console.log(result);
      user.password = hashedPassword;
      const newUser = await this.userRepo.save(user);
      return this.getUserWithTokens(newUser);
      // return hashedPassword;
    } else {
      throw new NotFoundException(
        new AppError('OLD_NOT_FOUND_PASSWORD', 'old password not found'),
      );
    }
  }

  //Login
  async login(loginUserDto: LoginUserDto): Promise<User> {
    const { email, password } = loginUserDto;
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new InternalServerErrorException(
        new AppError('ERR', 'user not found'),
      );
    } else {
      if (user.activated === false) {
        throw new ConflictException(
          new AppError('ERR', 'you should activate your account'),
        );
      } else {
        if (user && (await bcrypt.compare(password, user.password))) {
          const payload = { email };
          const accessExpireIn = 86400000;
          const access = this.generateToken(payload, accessExpireIn);
          const access_expire_at = new Date(
            new Date().getTime() + accessExpireIn,
          );
          const refreshExpireIn = 172800000;
          const refresh = this.generateToken(payload, refreshExpireIn);
          const refresh_expire_at = new Date(
            new Date().getTime() + refreshExpireIn,
          );
          user.access = access;
          user.access_expire_at = access_expire_at;
          user.refresh = refresh;
          user.refresh_expire_at = refresh_expire_at;
          return user;
        } else {
          throw new UnauthorizedException(
            new AppError(EMAIL_OR_PASSWORD_IS_INCORRECT),
          );
        }
      }
    }
  }

  async getUserWithTokens(user: User) {
    try {
      const payload1 = { user: user.email };
      const accessExpireIn = 864000000;
      const accessToken = this.generateToken(payload1, accessExpireIn);
      const access_expire_at = new Date(new Date().getTime() + accessExpireIn);

      const refreshExpireIn = 172800000;
      const refresh = this.generateToken(payload1, refreshExpireIn);
      const refresh_expire_at = new Date(new Date().getTime() + accessExpireIn);

      user.access = accessToken;
      user.access_expire_at = access_expire_at;
      user.refresh = refresh;
      user.refresh_expire_at = refresh_expire_at;
      return user;
    } catch (e) {
      throw new NotFoundException(
        new AppError('USER_NOT_FOUND', 'user not found'),
      );
    }
  }

  async getUserById(id: string): Promise<User> {
    const found = await this.userRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(
        new AppError('ID_NOT_FOUND', `user with id '${id}' not found`),
      );
    }
    return found;
  }

  async generateCode(user: User) {
    let code = Constant.randomCodeString(6);
    let expireAt = new Date(new Date().getTime() + 200000);
    const thisCode = this.myCodeRepo.create({
      code: code,
      expire_at: expireAt,
      user: user,
    });
    return this.myCodeRepo.save(thisCode);
  }

  async generateResetCode(user: User) {
    let code = Constant.ResetCodeString(6);
    let expireAt = new Date(new Date().getTime() + 200000);
    const thisCode = this.myCodeRepo.create({
      code: code,
      expire_at: expireAt,
      user: user,
    });
    return this.myCodeRepo.save(thisCode);
  }

  private generateToken(payload: any, expiresIn: number): string {
    return this.jwtService.sign(payload, {
      expiresIn: expiresIn,
      secret: 'jedJlxSecret2023',
    });
  }

  async saveUser(user: User): Promise<User> {
    return await this.userRepo.save(user);
  }

  async update(
    id: string,
    full_name: string,
    profile_picture: any,
  ): Promise<User> {
    const pathMedia = this.configService.get('PATH_MEDIA');
    const path = `${pathMedia}${profile_picture.originalname}`;
    const result = await this.getUserById(id);
    result.full_name = full_name;
    result.profile_picture = path;
    const newUser = await this.userRepo.save(result);
    return this.getUserWithTokens(newUser);
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async getUserByToken(token: string): Promise<User> {
    let result = this.jwtService.verify(token, { secret: Constant.JWTSecret });
    console.log(result);
    if (result.email) {
      console.log(result.user);
      return this.userRepo.findOne({ where: { email: result.email } });
    } else {
      throw new NotFoundException(
        new AppError(ERR_NOT_FOUND_USER, 'user not exist'),
      );
    }
  }

  async refreshToken(refresh: string): Promise<User> {
    try {
      // Check if refresh is valid
      const r = this.jwtService.verify(refresh, { secret: Constant.JWTSecret });
      console.log(r.email);

      // GET USER
      const user = await this.getUserByToken(refresh);
      console.log(user);
      return this.getUserWithTokens(user);
    } catch (e) {
      throw new NotFoundException(
        new AppError(ERR_NOT_FOUND_USER, 'user not exist'),
      );
    }

    /*if (!user) {
      throw new NotFoundException(`user with ID "${id}" not found`);
    } else {
      user.id = id;
      await this.userRepo.save(user);
      const { email } = createUserDto;
      console.log(user);
      user = await this.userRepo.findOne({ where: { id } });
      const payload = { email };
      const refresh_tok: jwtPayload & any = this.jwtService.sign(payload, {
        expiresIn: 864000,
        secret: 'jedJlxSecret2023',
      });
      console.log(user);
      const access: any = await this.tokenService.accessTokens(id, user);
      const decode3 = this.jwtService.verify(refresh_tok, {
        secret: 'jedJlxSecret2023',
      });
      // console.log(decode3.exp);
      // console.log(refresh)
      return {
        user,
        access_token: access,
        access_expiry_at: followingDay,
        refresh_token: refresh_tok,
        refresh_expiry_at: followingDay2,
      };
  }*/
  }

  async _getAppleSigningKey(kid): Promise<string> {
    const client = new JwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
    });
    try {
      const signing_key = await client.getSigningKey(kid);
      const public_key = signing_key.getPublicKey();
      return public_key;
    } catch (e) {
      throw new InternalServerErrorException(
        new AppError('ERR_APPLE_SIGN_IN', 'somthing went wrong in your signIn'),
      );
    }
  }
  async loginWithApple(req, res: Response): Promise<jwt.JwtPayload> {
    const { provider, response } = req.body;
    if (provider === 'apple') {
      const { identity_token, user } = response.response;
      const json = jwt.decode(identity_token, { complete: true });
      const kid = json.header.kid;
      const apple_key = await this._getAppleSigningKey(kid);
      if (!apple_key) {
        throw new NotFoundException(new AppError('ERR_NOT_FOUNT_APPLE_KEY'));
      }
      const payload = await this._verifyToken(identity_token, apple_key);
      if (!payload) {
        throw new NotFoundException(new AppError('ERR_NOT_FOUND_PAYLOAD'));
      }
      if (payload.sub == user) {
        console.log('correct user');
      }
      return payload;
    }
    res.ok;
  }

  async loginWithGoogle(req, res: Response): Promise<jwt.JwtPayload> {
    const { provider, response } = req.body;
    if (provider === 'google') {
      try {
        const id_token = response.idToken;
        await this.verifyGoogleLogin(id_token);
      } catch (e) {
        console.log(e);
        throw new UnauthorizedException(
          new AppError('ERR_LOGIN', 'user not verified '),
        );
      }
      if (!res) {
        throw new InternalServerErrorException(
          new AppError('ERR_LOGIN', 'failed login with Google '),
        );
      }
      return;
    }
  }
  async signInWithApple(): Promise<fireBase.User> {
    const app = firebase.initializeApp({ appId: '', apiKey: '' });
    const provider = new fireBase.OAuthProvider('apple.com');
    const auth = fireBase.getAuth(app);
    const result = await fireBase.signInWithPopup(auth, provider);
    return result.user;
  }
  async signInWithGoogle(): Promise<fireBase.User> {
    const app = firebase.initializeApp({ appId: '', apiKey: '' });
    const provider = new fireBase.GoogleAuthProvider();
    const auth = fireBase.getAuth(app);
    const result = await fireBase.signInWithPopup(auth, provider);
    return result.user;
  }
  private async _verifyToken(json, public_key): Promise<JwtPayload> {
    return new Promise((resolve) => {
      jwt.verify(json, public_key, (err, payload) => {
        if (err) {
          console.error(err);
          resolve(null);
        }
        resolve(payload);
      });
    });
  }

  private async verifyGoogleLogin(id_token: string): Promise<TokenPayload> {
    const client_id = await this.configService.get('CLIENT_ID');
    const ticket = await this.client_id.verifyIdToken({
      audience: client_id,
      idToken: id_token,
    });
    const payload = ticket.getPayload();
    if (payload) {
      return payload;
    }
    return null;
  }

  protected getUserIdFromToken(authorization) {
    const jwt_secret_key = this.configService.get('JWT_PRIVATE_KEY');
    if (!authorization) return null;
    const token = authorization.split(' ')[1];
    const decoded: any = jwt.verify(token, jwt_secret_key);
    return decoded.id;
  }
  async getLocation(address: string) {
    const google_api_key = this.configService.get('GOOGLE_MAP_API_KEY');
    try {
      const mapsClient = new Client();
      await mapsClient.geocode({
        params: { address: address, key: google_api_key },
        timeout: 1000,
      });
    } catch (e) {
      console.log(e);
    }
  }
}
