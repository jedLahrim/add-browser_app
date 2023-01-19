import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Exclude } from 'class-transformer';
import { Point } from 'geojson';

@Entity()
export class MyBrowser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  // @Exclude()
  id: string;
  @Column({ default: null })
  trigger_url: string;
  @Column({ default: null })
  action_type: string;
  @Column({ default: null })
  action_selector: string;
  @Column({ type: 'simple-array', default: null })
  unless_domain: string[];
  @Column({ type: 'simple-array', default: null })
  resource_type: string[];
  @Column({ type: 'simple-array', default: null })
  load_type: string[];
  @Column({ type: 'simple-array', default: null })
  if_domain: string[];
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.browsers, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @Exclude({ toPlainOnly: true })
  user: User;
  @RelationId((browser: MyBrowser) => browser.user)
  userId: string;
}
