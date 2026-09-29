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
import { ReservasModule } from './modules/reservas/reservas.module';
import { EmailModule } from './modules/email/email.module';
import { createObserveModule } from '@nestjs/observe';

// ObserveInstrument conecta el ciclo de vida de NestJS con NestJS Observe.
// Las credenciales se leen desde variables de entorno y no deben estar en el código.
export const { ObserveModule, ObserveInstrument } = createObserveModule();

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
        // Supabase tiene límites de conexiones en sus planes gratuitos.
        // Estos valores conservadores evitan abrir una conexión por request
        // sin crear un pool grande que consuma el límite disponible.
        extra: {
          max: Number(configService.get<string>('DB_POOL_MAX', '5')),
          min: Number(configService.get<string>('DB_POOL_MIN', '1')),
          idleTimeoutMillis: Number(
            configService.get<string>('DB_POOL_IDLE_TIMEOUT_MS', '30000'),
          ),
          connectionTimeoutMillis: Number(
            configService.get<string>('DB_POOL_CONNECTION_TIMEOUT_MS', '5000'),
          ),
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
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
    JwtModule.register({ global: true }),
    AuthModule,
    UsersModule,
    RutasModule,
    ViajesModule,
    PuntosRutaModule,
    VehiculoModule,
    CatalogoVehiculosModule,
    ReservasModule,
    EmailModule,
    ObserveModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        appKey: configService.getOrThrow<string>('OBSERVE_APP_KEY'),
        appSecret: configService.getOrThrow<string>('OBSERVE_APP_SECRET'),
        serviceId: configService.get<string>(
          'OBSERVE_SERVICE_ID',
          'wheels-backend',
        ),
      }),
    }),
  ],

  providers: [
    { provide: 'APP_GUARD', useClass: ThrottlerGuard },
    { provide: 'APP_GUARD', useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
