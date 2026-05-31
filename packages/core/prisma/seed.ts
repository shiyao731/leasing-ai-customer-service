import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Cleanup
  await prisma.conversation.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.rentCollection.deleteMany();
  await prisma.faqEntry.deleteMany();
  await prisma.maintenanceStaff.deleteMany();
  await prisma.handoffRequest.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.rentCollection.deleteMany();
  await prisma.faqEntry.deleteMany();
  await prisma.maintenanceStaff.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.settings.deleteMany();

  // Settings
  await prisma.settings.create({
    data: { id: "singleton", nightMode: false, wecomWebhookUrl: "" },
  });

  // Managers (3)
  const managers = [
    { name: "周管家", phone: "13810001001", isOnDuty: true },
    { name: "吴管家", phone: "13810001002", isOnDuty: true },
    { name: "郑管家", phone: "13810001003", isOnDuty: false },
  ];
  const createdManagers = [];
  for (const m of managers) {
    const created = await prisma.manager.create({ data: m });
    createdManagers.push(created);
  }
  console.log(`  ${createdManagers.length} managers created`);

  // Tenants (5) with manager assignment
  const tenants = [
    {
      name: "张三", roomNo: "3-1206", phone: "18800001234",
      leaseStart: new Date("2025-01-01"), leaseEnd: new Date("2025-12-31"),
      monthlyRent: 3500, billStatus: "normal", overdueDays: 0, totalDue: 0,
      managerId: createdManagers[0].id, // 周管家
    },
    {
      name: "李四", roomNo: "5-0803", phone: "13900005678",
      leaseStart: new Date("2024-06-01"), leaseEnd: new Date("2025-06-30"),
      monthlyRent: 4200, billStatus: "overdue", overdueDays: 3, totalDue: 4200,
      managerId: createdManagers[0].id, // 周管家
    },
    {
      name: "王五", roomNo: "2-1501", phone: "15600009012",
      leaseStart: new Date("2025-03-01"), leaseEnd: new Date("2026-03-31"),
      monthlyRent: 3800, billStatus: "overdue", overdueDays: 7, totalDue: 7600,
      managerId: createdManagers[1].id, // 吴管家
    },
    {
      name: "赵六", roomNo: "1-0602", phone: "17700003456",
      leaseStart: new Date("2024-11-01"), leaseEnd: new Date("2025-11-30"),
      monthlyRent: 3200, billStatus: "normal", overdueDays: 0, totalDue: 0,
      managerId: createdManagers[1].id, // 吴管家
    },
    {
      name: "陈七", roomNo: "4-0905", phone: "16600007890",
      leaseStart: new Date("2025-02-01"), leaseEnd: new Date("2026-02-28"),
      monthlyRent: 5000, billStatus: "overdue", overdueDays: 1, totalDue: 5000,
      managerId: createdManagers[2].id, // 郑管家（离线）
    },
  ];

  for (const t of tenants) {
    await prisma.tenant.create({ data: t });
  }
  console.log(`  ${tenants.length} tenants created`);

  // Maintenance Staff (3)
  const staff = [
    { name: "老刘", specialty: "appliance", phone: "13800001111" },
    { name: "小陈", specialty: "plumbing", phone: "13800002222" },
    { name: "周师傅", specialty: "doorlock", phone: "13800003333" },
  ];
  for (const s of staff) {
    await prisma.maintenanceStaff.create({ data: s });
  }
  console.log(`  ${staff.length} maintenance staff created`);

  // FAQ entries (15) with embeddings
  const faqs = [
    { category: "入门指南", question: "WiFi密码多少", answer: "亲，公寓WiFi是【阳光公寓_5G】，密码是【12345678】。有其他需要随时找我哦😊", keywords: "WiFi,无线,网络,密码,wifi" },
    { category: "入门指南", question: "水电怎么充值", answer: "水电费可以在微信公众号上充值哦～打开公众号菜单→【生活缴费】→输入房间号就能充值啦⚡💧", keywords: "水电,充值,缴费,电费,水费" },
    { category: "快递", question: "快递在哪取", answer: "快递放在一楼大厅快递架上啦，记得及时取走哦，过夜不太安全～📦", keywords: "快递,取件,包裹,外卖" },
    { category: "公共设施", question: "健身房几点开", answer: "健身房是早上6点到晚上11点开放，刷卡进入就可以啦！💪", keywords: "健身房,开放时间,运动" },
    { category: "公共设施", question: "洗衣机怎么用", answer: "每层楼都有公共洗衣房，扫码支付就可以用啦～洗衣液需要自带哦🧺", keywords: "洗衣机,洗衣服,洗衣房" },
    { category: "停车", question: "怎么停车", answer: "地库车位月租500元，需要找管家登记车牌。临停的话5元/小时～🚗", keywords: "停车,车位,地库,月租车" },
    { category: "报修", question: "空调不制冷", answer: "哎呀，热坏了吧！我来帮您处理～请问是哪台空调出问题了呢，客厅的还是卧室的？我会帮您安排师傅上门检修🔧", keywords: "空调,制冷,不冷,维修" },
    { category: "报修", question: "马桶堵了", answer: "收到～我来帮您记录！请问是彻底堵死了还是下水慢？方便的话简单描述一下情况，我马上安排师傅来处理🚽", keywords: "马桶,堵塞,下水道,厕所" },
    { category: "报修", question: "门锁坏了", answer: "这可不能耽误！请问是完全打不开还是钥匙转不动？我先帮您紧急处理🔑", keywords: "门锁,打不开,钥匙,锁" },
    { category: "账单", question: "房租什么时候交", answer: "亲，我需要先确认一下您的身份～请提供您的手机号，我帮您查一下账单信息😊", keywords: "房租,缴费,账单,租金,交租" },
    { category: "账单", question: "我的欠费情况", answer: "亲，我先确认一下您的身份～请提供您的手机号，我帮您查一下有没有欠费📋", keywords: "欠费,逾期,未交,账单" },
    { category: "续租", question: "我想续租", answer: "好的～续租可以联系您的管家，或者我也可以帮您转告管家联系您。请问您的手机号是？😊", keywords: "续租,续签,续约,到期" },
    { category: "居住证", question: "怎么办居住证", answer: "办居住证需要身份证、租赁合同、房东身份证复印件。您可以让管家协助哦～需要我转给管家吗？📄", keywords: "居住证,办理,证件" },
    { category: "投诉", question: "隔壁太吵了", answer: "哎呀真是不好意思，影响您休息了～我马上帮您记录反馈给管家处理！方便告诉我具体是哪间房吗？😤", keywords: "太吵,噪音,隔壁,楼上,投诉" },
    { category: "看房", question: "我想看房", answer: "好的～看房预约需要管家安排，请问方便留个手机号吗？我让管家联系您安排时间🏠", keywords: "看房,预约,租房,咨询" },
  ];

  for (const faq of faqs) {
    await prisma.faqEntry.create({ data: faq });
  }
  console.log(`  ${faqs.length} FAQ entries created with embeddings`);

  // Work Orders (5 historical)
  const orders = [
    {
      orderNo: "AP001250310001", tenantName: "张三", roomNo: "3-1206", phone: "18800001234",
      category: "appliance", description: "客厅空调不制冷，开机后吹出来的风是常温的，已经开了半小时还是一样", aiSummary: "客厅挂机空调不制冷",
      status: "completed", assignee: "老刘",
      contactPhone: "18800001234", visitTime: "2025-03-11 上午",
      images: "[]",
      completedAt: new Date("2025-03-11"),
      createdAt: new Date("2025-03-10"),
    },
    {
      orderNo: "AP001250310002", tenantName: "李四", roomNo: "5-0803", phone: "13900005678",
      category: "plumbing", description: "马桶堵塞不下水", aiSummary: "马桶堵塞严重，需要疏通",
      status: "in_progress", assignee: "小陈",
      contactPhone: "13900005678", visitTime: "明天下午3点",
      images: "[]",
      createdAt: new Date("2025-03-15"),
    },
    {
      orderNo: "AP001250310003", tenantName: "王五", roomNo: "2-1501", phone: "15600009012",
      category: "doorlock", description: "大门钥匙转不动", aiSummary: "门锁卡死无法正常开启",
      status: "in_progress", assignee: "周师傅",
      createdAt: new Date("2025-03-16"),
    },
    {
      orderNo: "AP001250310004", tenantName: "赵六", roomNo: "1-0602", phone: "17700003456",
      category: "appliance", description: "冰箱不制冷", aiSummary: "冰箱压缩机不工作",
      status: "pending",
      createdAt: new Date("2025-03-18"),
    },
    {
      orderNo: "AP001250310005", tenantName: "陈七", roomNo: "4-0905", phone: "16600007890",
      category: "other", description: "窗户关不上", aiSummary: "卧室窗户卡住关不严",
      status: "pending",
      createdAt: new Date("2025-03-19"),
    },
  ];
  for (const o of orders) {
    await prisma.workOrder.create({ data: o });
  }
  console.log(`  ${orders.length} work orders created`);

  // Rent collections (3 overdue)
  const collections = [
    {
      tenantName: "李四", roomNo: "5-0803", monthlyRent: 4200,
      overdueDays: 3, totalDue: 4200,
      suggestedMsg: "亲，您的房租已逾期3天啦～方便的话记得抽空交一下哦😊",
      status: "pending",
    },
    {
      tenantName: "王五", roomNo: "2-1501", monthlyRent: 3800,
      overdueDays: 7, totalDue: 7600,
      suggestedMsg: "亲，您已逾期7天了，方便尽快处理一下吗？有困难可以跟管家沟通哦～",
      status: "pending",
    },
    {
      tenantName: "陈七", roomNo: "4-0905", monthlyRent: 5000,
      overdueDays: 1, totalDue: 5000,
      suggestedMsg: "亲～您的房租昨天到期了，有空记得交一下哦😊",
      status: "pending",
    },
  ];
  for (const c of collections) {
    await prisma.rentCollection.create({ data: c });
  }
  console.log(`  ${collections.length} rent collections created`);

  // Historical conversations (for dashboard stats)
  const convos = [
    {
      tenantId: tenants[0].name, tenantName: tenants[0].name,
      messages: JSON.stringify([
        { role: "user", content: "WiFi密码多少？", time: new Date().toISOString() },
        { role: "assistant", content: "亲，公寓WiFi是【阳光公寓_5G】，密码是【12345678】。有其他需要随时找我哦😊", time: new Date().toISOString() },
      ]),
      resolved: true,
    },
    {
      tenantId: tenants[1].name, tenantName: tenants[1].name,
      messages: JSON.stringify([
        { role: "user", content: "快递在哪取？", time: new Date().toISOString() },
        { role: "assistant", content: "快递放在一楼大厅快递架上啦，记得及时取走哦～📦", time: new Date().toISOString() },
      ]),
      resolved: true,
    },
    {
      tenantId: tenants[2].name, tenantName: tenants[2].name,
      messages: JSON.stringify([
        { role: "user", content: "健身房几点开？", time: new Date().toISOString() },
        { role: "assistant", content: "健身房是早上6点到晚上11点开放，刷卡进入就可以啦！💪", time: new Date().toISOString() },
      ]),
      resolved: true,
    },
  ];
  for (const c of convos) {
    await prisma.conversation.create({ data: c });
  }
  console.log(`  ${convos.length} conversations created`);

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
