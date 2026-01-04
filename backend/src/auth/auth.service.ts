import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: CreateUserDto) {
    const salt = await bcrypt.genSalt(10);
    dto.password = await bcrypt.hash(dto.password, salt);
    const user = await this.usersService.create(dto);
    const res=this.generateToken(user);
    return res
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    const res=this.generateToken(user);
    return { success: true,
         access_token: res.access_token,
         user: res.user
         }
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, role: user.role, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
