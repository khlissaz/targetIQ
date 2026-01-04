import { Body, Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { LeadProfileService } from "./lead-profile.service";
import { JwtAuthGuard } from "src/auth/jwt.guard";

@Controller('lead')
export class LeadProfileController {
   constructor(private readonly leadProfileService: LeadProfileService) {}

   @UseGuards(JwtAuthGuard)
     @Get("")
     findFilteredLeadByQuery(@Query() limit, @Query() page, @Query() filterDto: any, @Req() req) {

       console.log("list leads");
       const user = req.user;

       return this.leadProfileService.findByProfileLinkWithFilter(user.userId, filterDto, limit, page);
     }
}