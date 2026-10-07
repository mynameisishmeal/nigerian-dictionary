import prisma from '@/lib/prisma';

async function main() {
  const targetEmail = (process.argv[2] || process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
  if (!targetEmail) {
    console.error('Error: Please provide a target email address.');
    console.error('Usage: npx tsx scripts/promote.ts <email>');
    console.error('Or set SUPERADMIN_EMAIL in your environment variables.');
    process.exit(1);
  }
  console.log(`Checking user record for: ${targetEmail}`);

  let user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    console.log(`User ${targetEmail} not found in database. Creating placeholder record...`);
    user = await prisma.user.create({
      data: {
        name: targetEmail.split('@')[0],
        email: targetEmail,
        role: 'superadmin',
        isVerified: true,
      },
    });
    console.log(`Created user ${targetEmail} with role: superadmin`);
  } else {
    user = await prisma.user.update({
      where: { email: targetEmail },
      data: {
        role: 'superadmin',
        isVerified: true,
      },
    });
    console.log(`Updated existing user ${targetEmail} to role: superadmin`);
  }

  console.log(`User details:`, JSON.stringify(user, null, 2));
}

main()
  .catch((e) => {
    console.error('Error promoting user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
