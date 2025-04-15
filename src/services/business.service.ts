import { CreateBusinessRequestDto } from "../dtos/request/business.dto";
import { UpdateUserDto } from "../dtos/request/user.dto";
import {
  createBusiness,
  updateBusiness,
} from "../repositories/business.repository";
import { getUser, updateBusinesIdToUser } from "./user.service";
export const create = async (
  env: Env,
  data: CreateBusinessRequestDto,
  userId: string
) => {
  // Check if the business already exists
  const user = await getUser(env, userId);
  if (!user) {
    throw new Error("User not found");
  }
  const business = await createBusiness(env, data);
  if (!business) {
    throw new Error("Business not found");
  }
  const updateUserDto: UpdateUserDto = { businessId: business.id };
  const update = await updateBusinesIdToUser(env, user.id, updateUserDto);
  
  return business;
};
