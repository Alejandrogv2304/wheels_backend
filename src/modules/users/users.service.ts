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

    const profile = this.usersRepository.create({
      id: supabaseUser.id,
      correo: supabaseUser.email,
      nombre:
        (supabaseUser.user_metadata?.name as string | undefined) ??
        (supabaseUser.user_metadata?.full_name as string | undefined) ??
        (supabaseUser.user_metadata?.username as string | undefined) ??
        undefined,
      foto:
        (supabaseUser.user_metadata?.avatar_url as string | undefined) ??
        undefined,
    });

    return this.usersRepository.save(profile);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }
}
