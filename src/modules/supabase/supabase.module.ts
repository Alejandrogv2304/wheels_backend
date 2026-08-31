import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';
export const SUPABASE_ADMIN_CLIENT = 'SUPABASE_ADMIN_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): SupabaseClient => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        const supabaseAnonKey = configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl) {
          throw new Error('Falta la variable de entorno SUPABASE_URL');
        }

        if (!supabaseAnonKey) {
          throw new Error('Falta la variable de entorno SUPABASE_ANON_KEY');
        }

        return createClient(supabaseUrl, supabaseAnonKey);
      },
    },
    {
      provide: SUPABASE_ADMIN_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): SupabaseClient => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        const supabaseServiceRoleKey = configService.get<string>(
          'SUPABASE_SERVICE_ROLE_KEY',
        );

        if (!supabaseUrl) {
          throw new Error('Falta la variable de entorno SUPABASE_URL');
        }

        if (!supabaseServiceRoleKey) {
          throw new Error(
            'Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY',
          );
        }

        return createClient(supabaseUrl, supabaseServiceRoleKey);
      },
    },
  ],
  exports: [SUPABASE_CLIENT, SUPABASE_ADMIN_CLIENT],
})
export class SupabaseModule {}
