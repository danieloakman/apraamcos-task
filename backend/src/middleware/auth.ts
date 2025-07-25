import jwt, { type SignOptions } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export type AuthLevel = "basic" | "sensitive";

const JWT_SECRETS: Record<
  AuthLevel,
  { secret: string; expiresIn: SignOptions["expiresIn"] }
> = {
  basic: {
    secret:
      process.env.JWT_SECRET || "development-secret-key-change-in-production",
    expiresIn: "24h",
  },
  sensitive: {
    secret:
      process.env.JWT_SECRET_SENSITIVE ||
      "development-secret-key-change-in-production-sensitive",
    expiresIn: "15m",
  },
};

export interface AuthRequest extends Request {
  userId?: number;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const authLevel =
    (req.headers["x-auth-level"] as AuthLevel | undefined) ?? "basic";
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRETS[authLevel].secret) as {
      userId: number;
    };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

export function generateToken(
  userId: number,
  authLevel: AuthLevel = "basic"
): string {
  return jwt.sign({ userId }, JWT_SECRETS[authLevel].secret, {
    expiresIn: JWT_SECRETS[authLevel].expiresIn,
  });
}
