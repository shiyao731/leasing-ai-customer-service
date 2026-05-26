import { prisma } from "@leasing/core";

export async function GET() {
  const [
    totalConversations,
    resolvedCount,
    handoffCount,
    pendingOrders,
    inProgressOrders,
    completedOrders,
    pendingCollections,
    remindedCollections,
    overdueCollections,
    faqEntries,
  ] = await Promise.all([
    prisma.conversation.count(),
    prisma.conversation.count({ where: { resolved: true } }),
    prisma.conversation.count({ where: { resolved: false, handoffAt: { not: null } } }),
    prisma.workOrder.count({ where: { status: "pending" } }),
    prisma.workOrder.count({ where: { status: "in_progress" } }),
    prisma.workOrder.count({ where: { status: "completed" } }),
    prisma.rentCollection.count({ where: { status: "pending" } }),
    prisma.rentCollection.count({ where: { status: "reminded" } }),
    prisma.rentCollection.count({ where: { overdueDays: { gte: 7 } } }),
    prisma.faqEntry.count(),
  ]);

  const resolveRate =
    totalConversations > 0
      ? Math.round((resolvedCount / totalConversations) * 100)
      : 0;

  return Response.json({
    conversations: { total: totalConversations, resolved: resolvedCount, handoff: handoffCount, rate: resolveRate },
    orders: { pending: pendingOrders, inProgress: inProgressOrders, completed: completedOrders },
    collections: { pending: pendingCollections, reminded: remindedCollections, severe: overdueCollections },
    faqCount: faqEntries,
  });
}
