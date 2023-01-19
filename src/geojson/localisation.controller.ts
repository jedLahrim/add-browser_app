import { Body, Controller, Get, Post } from '@nestjs/common';
import { LocationService } from './localisation.service';
import { TestLocation } from "./entities/location.entity";

@Controller('location')
export class LocationController {
  constructor(private serv: LocationService) {}

  @Get()
  public async getAll() {
    return await this.serv.getAll();
  }
  @Post()
  async createLocation(@Body() location: TestLocation): Promise<void> {
    await this.serv.create(location);
  }
  @Post('range')
  public async getRange(
    @Body() location: { lat: number; long: number; range: number },
  ) {
    return await this.serv.getRange(
      location.lat,
      location.long,
      location.range,
    );
  }
}
