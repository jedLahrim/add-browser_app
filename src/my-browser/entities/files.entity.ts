import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Files extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  // @Exclude()
  id: string;
  @Column({ default: null })
  file_url: string;
  @Column({ default: null })
  file_name: string;
}
