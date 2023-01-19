import {
  BadRequestException,
  CACHE_MANAGER,
  CacheKey,
  CacheStore,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { CreateMyBrowserDto } from './dto/create-my-browser.dto';
import { UpdateMyBrowserDto } from './dto/update-my-browser.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MyBrowser } from './entities/my-browser.entity';
import { User } from '../auth/entities/user.entity';
import { FilterBrowserDto } from './dto/filter-my_browser.dto';
import { Pagination } from '../commons/pagination';
import { AppError } from '../commons/errors/app-error';
import * as fs from 'fs';
import fetch from 'node-fetch';
import {
  ERR_NOT_FOUND_BROWSER_SERVICE,
  ERR_UPLOAD_FAILED,
} from '../commons/errors/errors-codes';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Files } from './entities/files.entity';
import * as path from 'path';
import { join } from 'path';
import { Action } from './enum/enum';
import * as zlib from 'zlib';
import * as Jimp from 'jimp';
import * as multer from 'multer';
import {
  Client,
  defaultAxiosInstance,
  LatLngLiteral,
} from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { Stripe } from 'stripe';
import * as querystring from 'querystring';
import { CacheService } from 'nestjs-api-tools';
import { LoggerMiddleware } from '../middleware/loggerMiddleware.middleware';
@Injectable()
export class MyBrowserService {
  stripe: Stripe;
  constructor(
    @InjectRepository(MyBrowser)
    private myBrowserRepo: Repository<MyBrowser>,
    @InjectRepository(Files)
    private filesRepo: Repository<Files>,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_API_SECRET_KEY'), {
      apiVersion: this.configService.get('STRIPE_APP_VERSION'),
    });
  }

  // create browser service
  async create(createMyBrowserDto: CreateMyBrowserDto, user: User) {
    const { trigger_url, action_type } = createMyBrowserDto;
    const browser = this.myBrowserRepo.create({
      trigger_url,
      action_type: action_type,
      user,
    });
    await this.myBrowserRepo.save(browser);
  }

  // find many browser services with pagination
  async findAll(
    filterDto: FilterBrowserDto,
    user: User,
  ): Promise<Pagination<MyBrowser>> {
    const {
      search,
      skip,
      take,
      // start_date_lte,
      // start_date_gte,
      // end_date_lte,
      // end_date_gte,
      // sort_by,
      // asc,
      id,
    } = filterDto;
    const query = this.myBrowserRepo.createQueryBuilder('my_browser');

    query.select('my_browser');
    query.where('my_browser.userId = :id ', { id: user.id });
    if (id) {
      query.select('my_browser').where('my_browser.id = :id ', { id });
    }
    if (search) {
      query.andWhere(
        '(LOWER(my_browser.trigger_url) LIKE LOWER(:search) OR LOWER(my_browser.action_type) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
      query.orderBy('my_browser.trigger_url', 'ASC');
    }

    // if (sort_by === DateType.start_date) {
    //   query.orderBy('event.start_date', 'ASC');
    // }
    //
    // if (sort_by === DateType.end_date) {
    //   query.orderBy('event.end_date', 'ASC');
    // }
    //
    // if (asc) {
    //   query.orderBy('event.start_date', 'ASC');
    //   query.orderBy('event.end_date', 'ASC');
    // } else {
    //   query.orderBy('event.start_date', 'DESC');
    //   query.orderBy('event.end_date', 'DESC');
    // }
    //
    // if (start_date_lte) {
    //   query.andWhere('event.start_date <= :start_date_lte', {
    //     start_date_lte,
    //   });
    // }
    // console.log(start_date_lte);
    //
    // console.log(start_date_gte);
    // if (start_date_gte) {
    //   query.andWhere('event.start_date >= :start_date_gte', {
    //     start_date_gte,
    //   });
    // }
    // console.log(start_date_gte);
    //
    // if (end_date_lte) {
    //   query.andWhere('event.end_date <= :end_date_lte', { end_date_lte });
    // }
    // console.log(end_date_lte);
    //
    // if (end_date_gte) {
    //   query.andWhere('event.end_date >= :end_date_gte', { end_date_gte });
    // }
    // console.log(end_date_gte);

    // Pagination
    query.skip(skip ?? 0);
    query.take(take ?? 4);
    const [events, total] = await query.getManyAndCount();
    return new Pagination<MyBrowser>(events, total);
  }
  // find one browser service
  async findOne(id: string, user: User) {
    const browser = await this.myBrowserRepo.findOne({
      relations: { user: true },
      where: {
        id: id,
        user: {
          id: user.id,
        },
      },
    });
    if (!browser) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_BROWSER_SERVICE));
    }
    return browser;
  }
  // create many browser services
  async createMany(items: MyBrowser[], user: User): Promise<MyBrowser[]> {
    // Validate the request data
    if (!items || !items.length) {
      throw new BadRequestException('No items provided');
    }
    let browser: MyBrowser;
    return await this._addUser(items, user);
  }

  private async _addUser(items: MyBrowser[], user) {
    let browsers;
    for (const item of items) {
      const match_trigger_url = item.trigger_url.match(
        /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
      );
      if (!match_trigger_url) {
        throw new NotAcceptableException(
          new AppError('ERR_INVALID_URL', 'this is not a valid type of URL'),
        );
      }
      if (
        item.action_type == Action.css_display_none ||
        item.action_type == Action.block
      ) {
        // Use the service to create the items in the database
        browsers = this.myBrowserRepo.create(items);
        // push same value on one array
        for (let browser of browsers) {
          browser.user = user;
        }
      } else {
        throw new NotAcceptableException(
          new AppError(
            'ERR_INVALID_ACTION_TYPE',
            'this action must be a valid action type',
          ),
        );
      }
    }
    const new_browsers = await this.myBrowserRepo.save(browsers);
    // await this.myBrowserRepo.save(browser);
    return new_browsers;
  }

  // upload file
  async upload(file: Express.Multer.File) {
    try {
      const bucket = this.configService.get('AWS_BACKET_NAME');
      // const filePath = join(__dirname, 'files', file.originalname);
      const awsFile = await this._getAwsFile(file, bucket);
      const uploadParams = this._getAwsUploadParams();
      const s3 = new S3({
        region: uploadParams.region,
        credentials: {
          accessKeyId: uploadParams.accessKeyId,
          secretAccessKey: uploadParams.secretAccessKey,
        },
      });
      const s3_uploadedFile = await s3.upload(awsFile).promise();
      const files = this.filesRepo.create({
        file_url: s3_uploadedFile.Location,
        file_name: file.originalname,
      });
      await this.filesRepo.save(files);
    } catch (e) {
      console.log(e);
      throw new ConflictException(
        new AppError(ERR_UPLOAD_FAILED, 'Cannot save file to s3'),
      );
    }
  }

  // fetch json
  async getData(file: Express.Multer.File, user: User) {
    const mediaPath = await this.configService.get('MEDIA_PATH');
    file.path = `${mediaPath}/${file.originalname}`;
    const get_extension = this._getFileExtension(file.path);
    if (get_extension !== '.json') {
      throw new ConflictException(
        new AppError('THIS_TYPE_OF_FILE_IS_NOT_A_JSON_TYPE'),
      );
    }
    const files = await this.filesRepo.findOneBy({
      file_name: file.originalname,
    });
    if (!files) {
      throw new NotFoundException(
        new AppError(ERR_UPLOAD_FAILED, 'FILE_NOT_FOUND_IN_THE_SERVER'),
      );
    }
    const response = await fetch(files.file_url);
    return response.json();
  }

  // upload data from geo-json file
  async uploadJson(file: Express.Multer.File, user: User) {
    let get_extension;
    try {
      const mediaPath = await this.configService.get('MEDIA_PATH');
      file.path = `${mediaPath}/${file.originalname}`;
      get_extension = this._getFileExtension(file.path);
    } catch (e) {
      throw new ConflictException(new AppError('ERR_UNDEFINED_FILE'));
    }
    if (get_extension !== '.json') {
      throw new ConflictException(
        new AppError('THIS_TYPE_OF_FILE_IS_NOT_A_JSON_TYPE'),
      );
    }
    const files = await this.filesRepo.findOneBy({
      file_name: file.originalname,
    });
    if (!files) {
      throw new NotFoundException(
        new AppError(ERR_UPLOAD_FAILED, 'FILE_NOT_FOUND_IN_THE_SERVER'),
      );
    }
    const input_location = files.file_url;
    const requestOption = {
      method: 'GET',
      headers: {
        content_type: 'application/json',
      },
    };
    fetch(input_location, requestOption)
      .then((response) => response.json())
      .then((data) => {
        // console.log(json4.trigger);
        for (const json of data) {
          const newBrowser = new MyBrowser();
          newBrowser.trigger_url = json.trigger.url;
          newBrowser.action_type = json.action.type;
          newBrowser.action_selector = json.action.selector;
          newBrowser.resource_type = json.trigger.resource_type;
          newBrowser.unless_domain = json.trigger.unless_domain;
          newBrowser.load_type = json.trigger.load_type;
          newBrowser.if_domain = json.trigger.if_domain;
          newBrowser.user = user;
          this.myBrowserRepo.save(newBrowser);
        }
      })
      .catch((error) => {
        console.log(error);
        throw new HttpException(error, error.code);
      });
  }

  private async _getFile(filePath: string | Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }
  // generateFileName(buffer: Buffer): string {
  //   // Generate a unique file name using the uuid library
  //   const fileName = uuid;
  //   // Get the file extension from the buffer's mimetype
  //   const fileExtension = buffer.mimetype.split('/')[1];
  //   // Return the file name with the extension
  //   return `${fileName}.${fileExtension}`;
  // }

  async _compressImage(buffer: Buffer): Promise<Buffer> {
    const image = await Jimp.read(buffer);
    const compressedBuffer = await image
      .quality(100)
      // .resize(200, 200)
      .getBufferAsync(image.getMIME());
    return compressedBuffer;
  }

  async _compressFile(file: Express.Multer.File) {
    const mediaPath = await this.configService.get('MEDIA_PATH');
    file.path = `${mediaPath}/${file.originalname}`;
    const gzip = zlib.createGzip();
    const input = fs.createReadStream(file.path);
    const output = fs.createWriteStream(`${file.path}.gz`);
    const r = input.pipe(gzip).pipe(output);
    // console.log(result);
  }

  private _getFileExtension(filePath: string): string {
    return path.extname(filePath);
  }
  private async _getAwsFile(
    file: Express.Multer.File,
    bucket,
  ): Promise<PutObjectCommandInput> {
    const compressed_file = await this._compressFile(file);
    const awsFile: PutObjectCommandInput = {
      Body: file.buffer,
      Bucket: bucket,
      Key: `${uuid()}-${file.originalname}`,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };
    return awsFile;
  }
  private _getAwsUploadParams() {
    const region = this.configService.get('AWS_BACKET_REGION');
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY');
    const secretAccessKey = this.configService.get('AWS_SECRET_KEY');
    return { region, accessKeyId, secretAccessKey };
  }

  // update browser services
  async update(
    id: string,
    updateEventDto: UpdateMyBrowserDto,
  ): Promise<MyBrowser> {
    let { trigger_url, action_type } = updateEventDto;
    const browser = await this.myBrowserRepo.findOneBy({ id });
    if (!browser) {
      throw new NotFoundException(
        new AppError('ERR', 'browser service not found'),
      );
    }

    browser.trigger_url = trigger_url;
    browser.action_type = action_type;
    const new_browser = await this.myBrowserRepo.save(browser);
    return new_browser;
  }
  // remove browser services
  async remove(id: string): Promise<void> {
    const result = await this.myBrowserRepo.delete({ id });
    console.log(result);
    if (result.affected === 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_BROWSER_SERVICE));
    }
  }

  async getMap(address: string): Promise<any> {
    const location_parameters = await this._getCoordinates(address);
    // const func = await this._getCoordinates.bind(location_parameters, address);
    const { lat, lon } = location_parameters;
    const API_KEY = 'YOUR_MAPBOX_API_KEY';
    const response = await axios.get(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${lon},${lat},14/800x800?access_token=${API_KEY}`,
    );
    return response.data;
  }
  async _getCoordinates(
    address: string,
  ): Promise<{ lat: number; lon: number }> {
    const API_KEY = 'YOUR_MAPBOX_API_KEY';
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address,
      )}.json?access_token=${API_KEY}`,
    );
    const data = response.data;
    if (data.features.length === 0) {
      throw new NotFoundException(new AppError('ERR_NE_RESULT_FOUND'));
    }
    const feature = data.features[0];
    return { lat: feature.center[1], lon: feature.center[0] };
  }

  // stripe Connect
  async createConnectedAccount(
    returnUrl: string,
    refreshUrl: string,
  ): Promise<string> {
    // Generate a unique state value to prevent CSRF attacks
    // const state = uuid;
    const localhost = 'http://localhost:3302/api';
    returnUrl = `${localhost}/my-browser/connect/callback`;
    refreshUrl = `${localhost}/my-browser/connect/refresh`;
    // Create a new Connected Account
    const account = await this.stripe.accounts.create({
      type: 'custom',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        url: refreshUrl,
        product_description: 'Example product description',
      },
      tos_acceptance: {
        ip: '127.0.0.1',
        date: Math.floor(Date.now() / 1000),
        user_agent: 'MyUserAgent/1.0',
      },
    });

    // Build to authorize URL
    const query = querystring.stringify({
      client_id: account.id,
      // state: state,
      scope: 'read_write',
      redirect_uri: returnUrl,
    });
    const url = `https://connect.stripe.com/express/oauth/authorize?${query}`;
    return url;
  }

  async retrieveAccount(accountId: string) {
    return this.stripe.accounts.retrieve(accountId);
  }

  async updateAccount(accountId: string, data) {
    return this.stripe.accounts.update(accountId, data);
  }
  async getCoordinatesForAddress(
    address: string,
    user: User,
  ): Promise<LatLngLiteral> {
    const google_map_api_key = await this.configService.get(
      'GOOGLE_MAP_API_KEY',
    );
    const localhost = 'http://localhost:3302/api';
    let client = new Client({
      config: {
        method: 'GET',
        url: `${localhost}/my-browser`,
        auth: { username: user.full_name, password: user.password },
        responseType: 'json',
        timeout: 1000,
      },
    });
    try {
      const response = await client.geocode({
        params: {
          address,
          key: google_map_api_key,
        },
        timeout: 1000, // milliseconds
      });
      console.log(response.data.results[0].geometry.location);
      const location = response.data.results[0].geometry.location;
      return location;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        new AppError('ERR_DEVICE_DONT_SUPPORT_GOOGLE_MAPS_SERVICES'),
      );
    }
  }
}
