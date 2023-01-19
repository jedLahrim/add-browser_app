import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Geometry, Point } from 'geojson';

@Entity()
export class TestLocation {
  @PrimaryGeneratedColumn('increment')
  pk_id: number;

  @Column({ type: 'varchar', name: 's_city' })
  city: string;

  @Column({ type: 'double precision', name: 'd_lat' })
  lat: number;

  @Column({ type: 'double precision', name: 'd_long' })
  long: number;

  // @Index({ spatial: true })
  @Column({
    type: 'simple-json',
    spatialFeatureType: 'Point',
    srid: 4326,
    // nullable: true,
  })
  location: Point;
}
