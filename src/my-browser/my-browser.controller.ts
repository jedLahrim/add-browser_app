import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MyBrowserService } from './my-browser.service';
import { CreateMyBrowserDto } from './dto/create-my-browser.dto';
import { UpdateMyBrowserDto } from './dto/update-my-browser.dto';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { FilterBrowserDto } from './dto/filter-my_browser.dto';
import { MyBrowser } from './entities/my-browser.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('my-browser')
export class MyBrowserController {
  constructor(private readonly myBrowserService: MyBrowserService) {}

  @Post()
  @Roles('admin')
  create(
    @Body() createMyBrowserDto: CreateMyBrowserDto,
    @GetUser() user: User,
  ) {
    return this.myBrowserService.create(createMyBrowserDto, user);
  }

  @Post('create_many')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  async createMany(
    @Body() items: MyBrowser[],
    @GetUser() user: User,
  ): Promise<MyBrowser[]> {
    // Use the service to create the items in the database
    return await this.myBrowserService.createMany(items, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Query() filterDto: FilterBrowserDto, @GetUser() user: User) {
    return this.myBrowserService.findAll(filterDto, user);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.myBrowserService.findOne(id, user);
  }

  @Post('/upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return await this.myBrowserService.upload(file);
  }
  @Get('get/fetch_json')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadJson(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    return await this.myBrowserService.uploadJson(file, user);
  }

  @Post('get/get_user_location')
  async getLocation(@Body() address) {
    await this.myBrowserService.getMap(address);
  }
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  // @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() updateMyBrowserDto: UpdateMyBrowserDto,
  ) {
    return this.myBrowserService.update(id, updateMyBrowserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.myBrowserService.remove(id);
  }
  @Get('get/fetch')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async getData(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    return await this.myBrowserService.getData(file, user);
  }
}
