import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { UsersModule } from './modules/users/users.module';
// import { AuthModule } from './modules/auth/auth.module';
// import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    //Con esta configuración solo estamos permitiendo 15 peticiones por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 25,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>(
          'SUPABASE_DATABASE_URL',
          configService.get<string>('DATABASE_URL', ''),
        ),
        ssl: {
          rejectUnauthorized: false,
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:
          configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    // UsersModule,
    JwtModule.register({global: true}),
    AuthModule,
    UsersModule,
    // AuthModule,
  ],
  
  providers: [
  { provide: 'APP_GUARD', useClass: ThrottlerGuard },
  // { provide: 'APP_GUARD', useClass: JwtAuthGuard },
  // { provide: 'APP_GUARD', useClass: RolesGuard },
],
})
export class AppModule {}
