import { prisma } from "../db";

export async function verifyTenant(phone: string) {
  const tenant = await prisma.tenant.findUnique({ where: { phone } });
  if (!tenant) return null;

  if (!tenant.activated) {
    await prisma.tenant.update({
      where: { phone },
      data: { activated: true },
    });
  }

  return {
    id: tenant.id,
    name: tenant.name,
    roomNo: tenant.roomNo,
    phone: tenant.phone,
    leaseStart: tenant.leaseStart,
    leaseEnd: tenant.leaseEnd,
    monthlyRent: tenant.monthlyRent,
    billStatus: tenant.billStatus,
    overdueDays: tenant.overdueDays,
    totalDue: tenant.totalDue,
  };
}
