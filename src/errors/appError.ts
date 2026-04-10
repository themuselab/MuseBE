export type AppError = {
  code: string;
  message: string;
  statusCode: number;
};

export const createAppError = (
  code: string,
  message: string,
  statusCode: number,
): AppError => ({
  code,
  message,
  statusCode,
});

export const isAppError = (error: unknown): error is AppError => {
  if (typeof error !== "object" || error === null) return false;
  const err = error as Record<string, unknown>;
  return (
    typeof err.code === "string" &&
    typeof err.message === "string" &&
    typeof err.statusCode === "number"
  );
};
