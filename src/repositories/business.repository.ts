import { connect } from "http2";
import { CreateBusinessRequestDto } from "../dtos/request/business.dto";
import { Business } from "../models/business";
import { getPrismaClient } from "../untils/db";

export async function getBusinessById(id: string): Promise<any> {
  // Implement logic to fetch business by ID
  return null;
}

export async function createBusiness(
  env: Env,
  data: CreateBusinessRequestDto
): Promise<Business> {
  // Implement logic to create a new business
  const prisma = getPrismaClient(env);
  const business = await prisma.business.create({
    data: {
      ...data,
    },
  });
  return new Business(business);
}

export async function updateBusiness(
  id: string,
  businesId: string,
  userId: string
): Promise<any> {
  return null;
}

export async function deleteBusiness(id: string): Promise<void> {
  // Implement logic to delete a business
}
