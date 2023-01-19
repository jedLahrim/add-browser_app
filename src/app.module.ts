import { CacheModule, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyBrowserModule } from './my-browser/my-browser.module';
import { UserModule } from './auth/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeormOptions } from './config/config';
import { LocationModule } from './geojson/location.module';
import type { ClientOpts } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import { LoggerMiddleware } from './middleware/loggerMiddleware.middleware';
import { dataSourceOptions } from "../db/data-source";
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    CacheModule.register<ClientOpts>({
      store: redisStore,
      host: '127.0.0.1', // redis server host
      port: 6379, // redis server port
      db: 0,
      ttl: 60, // seconds
    }),

    TypeOrmModule.forRoot(dataSourceOptions),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => {
    //     //process.env what you have in CMD
    //     const isProd =
    //       process.env.STAGE == 'prod' || process.env.STAGE == 'dev';
    //     // mysql://<username>:<password>@<host>:<port>/<db_name>
    //     return {
    //       type: 'mysql',
    //       host: isProd
    //         ? configService.get('DB_HOST')
    //         : 'us-cdbr-east-06.cleardb.net',
    //       port: isProd ? configService.get('DB_PORT') : 3306,
    //       username: isProd
    //         ? configService.get('DB_USERNAME')
    //         : 'be27c46a0f59bc',
    //       password: isProd ? configService.get('DB_PASSWORD') : '09ae266c',
    //       database: isProd ? configService.get('DB') : 'heroku_2dc26a96bcc2a8f',
    //       autoLoadEntities: true,
    //       synchronize: true,
    //     };
    //   },
    // }),
    MyBrowserModule,
    UserModule,
    LocationModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService,LoggerMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
