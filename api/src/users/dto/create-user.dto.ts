import { UserRole } from '../user-role.enum';

export class CreateUserDto {
  email: string;
  password: string;
  fullName?: string;
  role?: UserRole;
  scrapingCredit?: number;
  enrichmentCredit?: number;
}
