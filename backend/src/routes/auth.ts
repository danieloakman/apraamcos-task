import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "../database";
import {
  authenticateToken,
  AuthRequest,
  generateToken,
  verifyToken,
} from "../middleware/auth";

const router = express.Router();

interface LoginRequest {
  email: string;
  password: string;
}

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.password) {
      // eslint-disable-next-line no-console
      console.error("User password is missing for user:", user.email);
      return res.status(500).json({ error: "Internal server error" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id);

    // Return user data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safeUser } = user;

    res.json({
      user: safeUser,
      token,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Since there's only a 15min expiry on the sensitive auth token, we can just store the code in memory */
const tokens = new Map<number, string>();

router.post(
  "/sensitive/request",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      if (req.authLevel === "sensitive")
        res.status(400).json({ error: "Already authenticated" });
      else {
        const token = generateToken(userId, { authLevel: "sensitive" });
        const code = Math.floor(100000 + Math.random() * 900000);
        tokens.set(code, token);
        console.log(`${new Date().toISOString()}: ${code}`);
        res.status(204).send();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("/request-code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post(
  "/sensitive/verify",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.authLevel === "sensitive")
        res.status(400).json({ error: "Already authenticated" });
      else {
        const { code } = req.body;
        const token = tokens.get(code);
        if (!token) return res.status(400).json({ error: "Invalid code" });
        const { value: decoded, error } = verifyToken(token);
        if (error) {
          console.error("Invalid or expired token", error);
          return res.status(400).json({ error: "Invalid or expired token" });
        } else if (decoded.userId !== req.userId) {
          console.error(
            "Incorrect user attempting to verify code",
            decoded.userId,
            req.userId
          );
          return res.status(400).json({ error: "Invalid code" });
        }
        tokens.delete(code);
        res.json({ token });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("/verify-code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
