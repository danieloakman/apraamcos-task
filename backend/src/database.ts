import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

const db: Database.Database = new Database(
  join(__dirname, "..", "database", "database.db")
);

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  date_of_birth: string | null;
  phone_number: string | null;
  post_address: string | null;
  home_address: string | null;
  bank_name: string | null;
  bsb: string | null;
  account_name: string | null;
  account_number: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  date_of_birth: string | null;
  phone_number: string | null;
  post_address: string | null;
  home_address: string | null;
  bank_name: string | null;
  bsb: string | null;
  account_name: string | null;
  account_number: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  date_of_birth?: string;
  phone_number?: string;
  post_address?: string;
  home_address?: string;
  bank_name?: string;
  bsb?: string;
  account_name?: string;
  account_number?: string;
  facebook_url?: string;
  twitter_url?: string;
  youtube_url?: string;
}

export function initializeDatabase(): void {
  const schema = readFileSync(
    join(__dirname, "..", "database", "schema.sql"),
    "utf8"
  );
  db.exec(schema);

  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
    count: number;
  };
  if (userCount.count === 0) {
    const seedData = readFileSync(
      join(__dirname, "..", "database", "seed.sql"),
      "utf8"
    );
    db.exec(seedData);
  }
}

export async function getUserById(
  id: number,
  { select }: { select?: (keyof SafeUser)[] } = {}
): Promise<SafeUser | null> {
  try {
    const user = db
      .prepare(
        `SELECT ${select ? select.join(", ") : "*"} FROM users WHERE id = ${id}`
      )
      .get() as User | null;
    if (!user) {
      return null;
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser as SafeUser;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    return db
      .prepare(`SELECT * FROM users WHERE email = '${email}'`)
      .get() as User | null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
}

export async function updateUser(
  id: number,
  data: UserUpdateData
): Promise<SafeUser | null> {
  try {
    const fields = Object.keys(data).filter(
      key => data[key as keyof UserUpdateData] !== undefined
    );

    if (fields.length === 0) {
      return await getUserById(id);
    }

    const setClause = fields.map(field => `${field} = ?`).join(", ");
    const values = fields.map(field => data[field as keyof UserUpdateData]);

    const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, id);

    if (result.changes === 0) {
      return null;
    }

    return await getUserById(id);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function getAllUsers(): Promise<SafeUser[]> {
  try {
    const users = db.prepare("SELECT * FROM users").all() as User[];
    return users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;
      return safeUser as SafeUser;
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

export default db;
