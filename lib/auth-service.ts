import { query } from "./db";
import { User, DbUser, Organization, Membership, Session } from "./types";
import crypto from "crypto";
import bcrypt from "bcrypt";

const HASH_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, HASH_ROUNDS);
}

export const authService = {
  async register(
    email: string,
    password: string,
    fullName: string,
    organizationName: string,
  ): Promise<{
    user: User;
    organization: Organization;
    membership: Membership;
  }> {
    const passwordHash = await hashPassword(password);

    // create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, full_name, email_verified)
        VALUES ($1, $2, $3, true) 
        RETURNING id, email, full_name, email_verified, created_at`,
      [email, passwordHash, fullName],
    );
    const user = userResult.rows[0] as User;

    const slug = organizationName.toLowerCase().replace(/\s+/g, "-");
    const orgResult = await query(
      `INSERT INTO organizations (name, slug, plan, settings)
       VALUES ($1, $2, 'free', '{}') RETURNING *`,
      [organizationName, slug],
    );
    const organization = orgResult.rows[0] as Organization;

    const membershipResult = await query(
      `INSERT INTO memberships (user_id, organization_id, role, accepted_at)
       VALUES ($1, $2, 'owner', now()) RETURNING *`,
      [user.id, organization.id],
    );
    const membership = membershipResult.rows[0] as Membership;

    return { user, organization, membership };
  },

  async login(email: string, password: string): Promise<User | null> {
    const result = await query(
      `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email],
    );
    const dbUser = result.rows[0] as DbUser | undefined;

    if (!dbUser) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      dbUser.password_hash,
    );

    if (!isPasswordValid) {
      return null;
    }

    const { password_hash, ...safeUser } = dbUser;

    return safeUser;
  },

  async createSeesion(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<Session> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const result = await query(
      `INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, token, expiresAt.toISOString(), userAgent, ipAddress],
    );

    return result.rows[0] as Session;
  },

  async getUserBySession(
    token: string,
  ): Promise<(User & { organisation_id: string; role: string }) | null> {
    const result = await query(
      `SELECT u.*, m.organization_id, m.role FROM users u
       JOIN sessions s ON s.user_id = u.id
       JOIN memberships m ON m.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > now() AND u.deleted_at IS NULL`,
      [token],
    );

    return result.rows[0] || null;
  },

  async invalidateSession(token: string): Promise<void> {
    await query(`DELETE FROM sessions WHERE token = $1`, [token]);
  },

  // Get user organization
  async getUserOrganization(
    userId: string,
  ): Promise<(Organization & { role: string }) | null> {
    const result = await query(
      `SELECT o.*, m.role FROM organizations o
       JOIN memberships m ON m.organization_id = o.id
       WHERE m.user_id = $1 AND o.deleted_at IS NULL
       LIMIT 1`,
      [userId],
    );
    return result.rows[0] || null;
  },

  // Get user by id
  async getUser(userId: string): Promise<User | null> {
    const result = await query(
      `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    return result.rows[0] || null;
  },
};
