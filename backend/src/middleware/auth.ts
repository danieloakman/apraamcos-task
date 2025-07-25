import jwt, { type SignOptions } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Result } from "@apraamcos/shared";

const JWT_SECRET =
  process.env.JWT_SECRET || "development-secret-key-change-in-production";

export type AuthLevel = "basic" | "sensitive";

export interface TokenPayload {
  userId: number;
  authLevel: AuthLevel;
}

export interface AuthRequest extends Request {
  userId?: number;
  authLevel?: AuthLevel;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const { value: decoded, error } = verifyToken(token);
  if (error) {
    console.error("Invalid or expired token", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  req.userId = decoded.userId;
  req.authLevel = decoded.authLevel;
  next();
}

export function requireSensitiveAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.authLevel !== "sensitive") {
    return res.status(403).json({ error: "Sensitive data access required" });
  }
  next();
}

export function verifyToken(token: string): Result<TokenPayload> {
  try {
    return { ok: true, value: jwt.verify(token, JWT_SECRET) as TokenPayload };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

export function generateToken(
  userId: number,
  { authLevel = "basic" }: { authLevel?: AuthLevel } = {}
): string {
  return jwt.sign({ userId, authLevel }, JWT_SECRET, {
    expiresIn: authLevel === "basic" ? "24h" : "15m",
  });
}
