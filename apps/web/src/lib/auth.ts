import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { SiweMessage } from "siwe";
import { randomBytes } from "crypto";
import { prisma } from "./db";
import { config } from "./config";

export interface SessionData {
  userId: string;
  walletAddress: string;
  isAdmin: boolean;
}

const sessionOptions: SessionOptions = {
  password: config.sessionSecret,
  cookieName: "paylane_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function getUser() {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new AuthError("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) throw new AuthError("Forbidden");
  return user;
}

export class AuthError extends Error {
  status = 401;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function createNonce(address: string) {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.authNonce.create({ data: { address: address.toLowerCase(), nonce, expiresAt } });
  return nonce;
}

export async function verifySiweAndCreateSession(message: string, signature: string) {
  const siwe = new SiweMessage(message);
  const fields = await siwe.verify({ signature });

  const stored = await prisma.authNonce.findFirst({
    where: {
      address: fields.data.address.toLowerCase(),
      nonce: fields.data.nonce,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!stored) throw new AuthError("Invalid or expired nonce");

  const wallet = fields.data.address.toLowerCase();
  const isAdmin =
    config.adminWallets.includes(wallet) ||
    (await prisma.user.findUnique({ where: { walletAddress: wallet } }))?.isAdmin === true;

  const user = await prisma.user.upsert({
    where: { walletAddress: wallet },
    create: { walletAddress: wallet, isAdmin },
    update: { isAdmin: isAdmin ? true : undefined },
  });

  const session = await getSession();
  session.userId = user.id;
  session.walletAddress = wallet;
  session.isAdmin = user.isAdmin;
  await session.save();

  await prisma.authNonce.deleteMany({ where: { address: wallet } });
  return user;
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

export function buildSiweMessage(address: string, nonce: string, chainId: number) {
  const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "localhost:3000";
  return new SiweMessage({
    domain,
    address,
    statement: "Sign in to Paylane",
    uri: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    version: "1",
    chainId,
    nonce,
  }).prepareMessage();
}
