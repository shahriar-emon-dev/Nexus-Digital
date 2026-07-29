import { PrismaClient } from "@prisma/client";

// TODO: When schema is added in the next pass, uncomment and wire up PrismaClient singleton.
// This prevents instantiating multiple PrismaClient instances during Next.js hot reloading in development.

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
