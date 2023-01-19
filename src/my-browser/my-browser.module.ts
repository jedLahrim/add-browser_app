import { Module } from '@nestjs/common';
import { MyBrowserService } from './my-browser.service';
import { MyBrowserController } from './my-browser.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyBrowser } from './entities/my-browser.entity';
import { Files } from './entities/files.entity';
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [TypeOrmModule.forFeature([MyBrowser, Files])],
  controllers: [MyBrowserController],
  providers: [MyBrowserService,ConfigService],
})
export class MyBrowserModule {}
