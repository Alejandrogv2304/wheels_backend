import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/User.entity';
import { ProfileCompletedGuard } from '../../common/guards/profile-completed.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, ProfileCompletedGuard],
  controllers: [UsersController],
  exports: [UsersService, ProfileCompletedGuard],
})
export class UsersModule {}
