import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RutasModule } from './modules/rutas/rutas.module';
import { ViajesModule } from './modules/viajes/viajes.module';
import { PuntosRutaModule } from './modules/puntos_ruta/puntos_ruta.module';
import { VehiculoModule } from './modules/vehiculo/vehiculo.module';
import { CatalogoVehiculosModule } from './modules/catalogo-vehiculos/catalogo-vehiculos.module';

@Module({
  imports: [
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
    SupabaseModule,
    JwtModule.register({global: true}),
    AuthModule,
    UsersModule,
    RutasModule,
    ViajesModule,
    PuntosRutaModule,
    VehiculoModule,
    CatalogoVehiculosModule,
  ],
  
  providers: [
    { provide: 'APP_GUARD', useClass: ThrottlerGuard },
    { provide: 'APP_GUARD', useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
