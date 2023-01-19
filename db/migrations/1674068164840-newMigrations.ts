import { MigrationInterface, QueryRunner } from "typeorm";

export class newMigrations1674068164840 implements MigrationInterface {
    name = 'newMigrations1674068164840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`my_browser\` (\`id\` varchar(36) NOT NULL, \`trigger_url\` varchar(255) NULL, \`action_type\` varchar(255) NULL, \`action_selector\` varchar(255) NULL, \`unless_domain\` text NULL, \`resource_type\` text NULL, \`load_type\` text NULL, \`if_domain\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`full_name\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`profile_picture\` varchar(255) NULL, \`activated\` tinyint NOT NULL DEFAULT 0, \`customerId\` varchar(255) NULL, \`roles\` text NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`my_code\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(255) NOT NULL, \`expire_at\` datetime NOT NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`files\` (\`id\` varchar(36) NOT NULL, \`file_url\` varchar(255) NULL, \`file_name\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`test_location\` (\`pk_id\` int NOT NULL AUTO_INCREMENT, \`s_city\` varchar(255) NOT NULL, \`d_lat\` double NOT NULL, \`d_long\` double NOT NULL, \`location\` text NOT NULL, PRIMARY KEY (\`pk_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`my_browser\` ADD CONSTRAINT \`FK_caf3715f3457ed28aa4c1419d7b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`my_code\` ADD CONSTRAINT \`fk_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`my_code\` DROP FOREIGN KEY \`fk_user_id\``);
        await queryRunner.query(`ALTER TABLE \`my_browser\` DROP FOREIGN KEY \`FK_caf3715f3457ed28aa4c1419d7b\``);
        await queryRunner.query(`DROP TABLE \`test_location\``);
        await queryRunner.query(`DROP TABLE \`files\``);
        await queryRunner.query(`DROP TABLE \`my_code\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`my_browser\``);
    }

}
