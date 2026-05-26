import { prisma } from "@leasing/core";

export async function GET() {
  const collections = await prisma.rentCollection.findMany({
    orderBy: { overdueDays: "desc" },
  });
  return Response.json(collections);
}
