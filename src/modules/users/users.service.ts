import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from './entities/User.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async upsertFromSupabaseUser(supabaseUser: SupabaseUser): Promise<User> {
    if (!supabaseUser.email) {
      throw new BadRequestException('El usuario de Supabase no tiene email');
    }

    const existingUser = await this.usersRepository.findOneBy({
      id: supabaseUser.id,
    });

    const nombre = this.pickSupabaseString(
      supabaseUser.user_metadata?.name,
      supabaseUser.user_metadata?.full_name,
      supabaseUser.user_metadata?.username,
    );
    const foto = this.pickSupabaseString(
      supabaseUser.user_metadata?.avatar_url,
      supabaseUser.user_metadata?.picture,
    );
    const telefono = this.pickSupabaseString(
      supabaseUser.user_metadata?.phone,
      supabaseUser.user_metadata?.telefono,
    );

    const profile = this.usersRepository.create({
      ...(existingUser ?? {}),
      id: supabaseUser.id,
      correo: supabaseUser.email,
      telefono: telefono ?? existingUser?.telefono ?? undefined,
      nombre: nombre ?? existingUser?.nombre ?? undefined,
      foto: foto ?? existingUser?.foto ?? undefined,
    });

    return this.usersRepository.save(profile);
  }

  private pickSupabaseString(...values: Array<unknown>): string | undefined {
    for (const value of values) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }

    return undefined;
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }
}
