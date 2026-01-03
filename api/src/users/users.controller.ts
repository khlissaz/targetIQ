import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "src/auth/jwt.guard";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

@UseGuards(JwtAuthGuard)
  @Get("me")
  findMe(@Req() req) {
    try {
      const user = req.user;
      return this.usersService.findOne(user.id);
    } catch (error) {
      return error;
    }
  }

  @Post("logout")
  async logout(@Req() req, @Res({ passthrough: true }) response: Response) {
    const user = req.user;
    return this.usersService.logout(user, response);
  }

@UseGuards(JwtAuthGuard)
@Get('limit')
async getScrapingLimit(@Req() req: any) {
  const userId = req.user.userId;
  console.log("userId", req.user);
  const limitInfo = await this.usersService.getScrapingCredit(userId);
  return limitInfo;
}

@Get('count')
countUsers() {
  return this.usersService.countUsers();
}

// 🧨 Dynamic route must come last
@Get(':id')
findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
}

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }

@UseGuards(JwtAuthGuard)
@Post('increment')
async incrementQuota(@Req() req: any, @Body('type') type: 'scraping' | 'enrichment',@Body('amount') amount = 1) {
  const userId = req.user.userId;
  await this.usersService.incrementCredit(userId, type, amount);
  return { success: true };
}

}
