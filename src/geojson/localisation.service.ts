import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, QueryBuilder, Repository } from 'typeorm';
import { Geometry, Point } from 'geojson';
import { AppError } from '../commons/errors/app-error';
import { TestLocation } from "./entities/location.entity";
@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(TestLocation)
    private readonly locationRepo: Repository<TestLocation>,
  ) {}

  public async getAll() {
    return await this.locationRepo.find();
  }

  public async create(location: TestLocation) {
    const pointObject: Point = {
      type: 'Point',
      coordinates: [location.long, location.lat],
    };
    location.location = pointObject;
    return await this.locationRepo.save(location);
  }

  public async getRange(lat: number, long: number, range: number = 1000) {
    try {
      let origin = {
        type: 'Point',
        coordinates: [long, lat],
      };
      let locations = await this.locationRepo
        .createQueryBuilder('test_location')
        .select([
          'test_location.city AS city',
          'ST_Distance(test_location.location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(test_location.location))) AS distance',
        ])
        .where(
          'ST_DWithin(testLocation.location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(test_location.location)) ,:range)'
        )
        .orderBy('distance', 'ASC')
        .setParameters({
          // stringify GeoJSON
          origin: JSON.stringify(origin),
          range: range * 1000, //KM conversion
        })
        .getRawMany();
      return locations;
    } catch (e) {
      console.log(e);
    }
    throw new ConflictException(new AppError('ERR_LOCATION_NOT_FOUND'));
  }
}
