import ErrorHandler from "@/utils/errorHandler";

export type ErrorDTO = {
  success: boolean;
  message: string | string[];
  error?: ErrorHandler;
  stack?: string | null;
};
