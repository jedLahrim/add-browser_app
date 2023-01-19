import { DataSource, DataSourceOptions } from "typeorm";

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 8889,
  username: 'root',
  password: 'root',
  database: 'browser_app',
  entities: ["dist/src/**/entities/*.entity.js"],
  // synchronize: true,
  migrations: ["dist/db/migrations/*.js"],
  // autoLoadEntities: true,
};

export const dataSource = new DataSource(dataSourceOptions)