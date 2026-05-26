import { prisma } from "@leasing/core";
import { NextRequest } from "next/server";

export async function GET() {
  const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(tenants);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tenant = await prisma.tenant.create({
    data: {
      name: body.name,
      roomNo: body.roomNo,
      phone: body.phone,
      managerId: body.managerId || null,
      leaseStart: new Date(body.leaseStart),
      leaseEnd: new Date(body.leaseEnd),
      monthlyRent: body.monthlyRent,
      billStatus: body.billStatus || "normal",
      overdueDays: body.overdueDays || 0,
      totalDue: body.totalDue || 0,
    },
  });
  return Response.json(tenant);
}
