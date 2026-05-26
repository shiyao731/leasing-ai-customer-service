import { prisma } from "@leasing/core";

export async function GET() {
  const staff = await prisma.maintenanceStaff.findMany();
  return Response.json(staff);
}
