import { Module } from '@nestjs/common';
import {
  LocationController,
} from './localisation.controller';
import { LocationService } from './localisation.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { TestLocation } from "./entities/location.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TestLocation])],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
