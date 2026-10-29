import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create agents
  const agents = await Promise.all([
    prisma.agent.upsert({
      where: { email: 'sarah.chen@support.com' },
      update: {},
      create: {
        name: 'Sarah Chen',
        email: 'sarah.chen@support.com',
        role: 'ADMIN',
      },
    }),
    prisma.agent.upsert({
      where: { email: 'james.wilson@support.com' },
      update: {},
      create: {
        name: 'James Wilson',
        email: 'james.wilson@support.com',
        role: 'AGENT',
      },
    }),
    prisma.agent.upsert({
      where: { email: 'priya.sharma@support.com' },
      update: {},
      create: {
        name: 'Priya Sharma',
        email: 'priya.sharma@support.com',
        role: 'AGENT',
      },
    }),
    prisma.agent.upsert({
      where: { email: 'mike.johnson@support.com' },
      update: {},
      create: {
        name: 'Mike Johnson',
        email: 'mike.johnson@support.com',
        role: 'AGENT',
      },
    }),
  ]);

  console.log(`Created ${agents.length} agents`);

  // Create sample tickets with varied statuses, priorities, and ages
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  const tickets = [
    {
      subject: 'Cannot access billing portal',
      customerName: 'Alice Martin',
      customerEmail: 'alice.martin@acme.com',
      description: 'I am unable to log into the billing portal. It shows a 403 error after I enter my credentials. I have tried resetting my password but the issue persists.',
      status: 'OPEN',
      priority: 'HIGH',
      assigneeId: agents[0].id,
      createdAt: hoursAgo(30), // overdue
    },
    {
      subject: 'Feature request: Export to CSV',
      customerName: 'Bob Taylor',
      customerEmail: 'bob.taylor@globex.com',
      description: 'We would like the ability to export our usage reports to CSV format. Currently we can only view them in the dashboard.',
      status: 'OPEN',
      priority: 'LOW',
      assigneeId: null,
      createdAt: hoursAgo(12),
    },
    {
      subject: 'Payment failed for subscription renewal',
      customerName: 'Carol White',
      customerEmail: 'carol.white@initech.com',
      description: 'My subscription renewal payment failed. The card on file is valid and has sufficient balance. I need this resolved urgently as our team access expires tomorrow.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: agents[1].id,
      createdAt: hoursAgo(6),
    },
    {
      subject: 'API rate limit too restrictive',
      customerName: 'David Kim',
      customerEmail: 'david.kim@techstart.io',
      description: 'Our application is hitting the API rate limit during peak hours. We are on the Business plan and expected higher limits. Can we discuss increasing the rate limit?',
      status: 'WAITING_ON_CUSTOMER',
      priority: 'MEDIUM',
      assigneeId: agents[2].id,
      createdAt: hoursAgo(48), // overdue
    },
    {
      subject: 'Onboarding documentation outdated',
      customerName: 'Emma Davis',
      customerEmail: 'emma.davis@newco.com',
      description: 'The onboarding guide references UI elements that no longer exist in the current version. Steps 3 through 7 are completely wrong. New users are getting confused.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      assigneeId: agents[0].id,
      createdAt: hoursAgo(72),
    },
    {
      subject: 'SSO integration broken after update',
      customerName: 'Frank Lopez',
      customerEmail: 'frank.lopez@bigcorp.com',
      description: 'After your latest platform update, our SSO integration stopped working. None of our 200+ employees can log in. This is a critical issue affecting our entire organization.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: agents[1].id,
      createdAt: hoursAgo(28), // overdue
    },
    {
      subject: 'Mobile app crashes on Android 14',
      customerName: 'Grace Nguyen',
      customerEmail: 'grace.nguyen@mobiledev.co',
      description: 'The mobile app consistently crashes when opening the notifications tab on Android 14 devices. I have reproduced this on a Pixel 8 and Samsung S24.',
      status: 'OPEN',
      priority: 'HIGH',
      assigneeId: agents[3].id,
      createdAt: hoursAgo(4),
    },
    {
      subject: 'Request to change account email',
      customerName: 'Henry Park',
      customerEmail: 'henry.park@smallbiz.com',
      description: 'I need to change the primary email on our account from henry.park@smallbiz.com to admin@smallbiz.com. Please help.',
      status: 'RESOLVED',
      priority: 'LOW',
      assigneeId: agents[2].id,
      createdAt: hoursAgo(96),
    },
  ];

  for (const ticketData of tickets) {
    const ticket = await prisma.ticket.create({
      data: {
        subject: ticketData.subject,
        customerName: ticketData.customerName,
        customerEmail: ticketData.customerEmail,
        description: ticketData.description,
        status: ticketData.status,
        priority: ticketData.priority,
        assigneeId: ticketData.assigneeId,
        createdAt: ticketData.createdAt,
        updatedAt: ticketData.createdAt,
      },
    });

    // Create activity log for ticket creation
    await prisma.activityLog.create({
      data: {
        ticketId: ticket.id,
        action: 'CREATED',
        performedBy: 'System',
        createdAt: ticketData.createdAt,
      },
    });

    // Add assignment activity if assigned
    if (ticketData.assigneeId) {
      const agent = agents.find((a) => a.id === ticketData.assigneeId);
      await prisma.activityLog.create({
        data: {
          ticketId: ticket.id,
          action: 'ASSIGNED',
          field: 'assignee',
          oldValue: null,
          newValue: agent?.name ?? 'Unknown',
          performedBy: 'System',
          createdAt: new Date(ticketData.createdAt.getTime() + 60000),
        },
      });
    }

    // Add sample comments to some tickets
    if (ticketData.status !== 'OPEN' && ticketData.assigneeId) {
      const agentName = agents.find((a) => a.id === ticketData.assigneeId)?.name ?? 'Agent';

      await prisma.comment.create({
        data: {
          ticketId: ticket.id,
          content: `Hi ${ticketData.customerName}, thank you for reaching out. I'm looking into this issue now and will update you shortly.`,
          type: 'REPLY',
          authorName: agentName,
          createdAt: new Date(ticketData.createdAt.getTime() + 120000),
        },
      });

      await prisma.activityLog.create({
        data: {
          ticketId: ticket.id,
          action: 'COMMENT_ADDED',
          performedBy: agentName,
          createdAt: new Date(ticketData.createdAt.getTime() + 120000),
        },
      });

      // Add an internal note to some
      if (ticketData.priority === 'URGENT' || ticketData.priority === 'HIGH') {
        await prisma.comment.create({
          data: {
            ticketId: ticket.id,
            content: `Escalated internally. Checking with the engineering team for a root cause analysis.`,
            type: 'NOTE',
            authorName: agentName,
            createdAt: new Date(ticketData.createdAt.getTime() + 180000),
          },
        });

        await prisma.activityLog.create({
          data: {
            ticketId: ticket.id,
            action: 'NOTE_ADDED',
            performedBy: agentName,
            createdAt: new Date(ticketData.createdAt.getTime() + 180000),
          },
        });
      }
    }

    // Add status change activities for non-OPEN tickets
    if (ticketData.status !== 'OPEN') {
      await prisma.activityLog.create({
        data: {
          ticketId: ticket.id,
          action: 'STATUS_CHANGED',
          field: 'status',
          oldValue: 'OPEN',
          newValue: ticketData.status,
          performedBy: agents.find((a) => a.id === ticketData.assigneeId)?.name ?? 'System',
          createdAt: new Date(ticketData.createdAt.getTime() + 300000),
        },
      });
    }
  }

  const ticketCount = await prisma.ticket.count();
  console.log(`Created ${ticketCount} tickets with comments and activity logs`);
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
