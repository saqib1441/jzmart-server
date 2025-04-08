// Importing Necessary Modules
import bcrypt from "bcryptjs";

// Hashing Function
export const Hash = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Comparing Function
export const Compare = async (
  password: string,
  hassPass: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hassPass);
};
