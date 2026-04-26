import { getAuth } from "@clerk/express";

export function requireRecruiter(req, _res, next) {
  const { userId } = getAuth(req);

  if (!userId) {
    const error = new Error("Unauthorized. Sign in again and retry.");
    error.status = 401;
    return next(error);
  }

  req.recruiterId = userId;
  return next();
}
