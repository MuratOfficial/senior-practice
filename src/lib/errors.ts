import { Prisma } from "@/generated/prisma/client";

export const STALE_SESSION_ERROR =
  "Сессия устарела — выйдите и войдите заново";

/**
 * FK-нарушение по userId (P2003): JWT-сессия ещё валидна, но пользователя в БД
 * уже нет (например, dev-пользователь удалён). Без обработки — 500;
 * вызывающий action должен вернуть понятную ошибку.
 */
export function isStaleUserError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
