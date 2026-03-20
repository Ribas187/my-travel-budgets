import { config as loadEnv } from 'dotenv';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from '@/config/env.validation';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { TravelsModule } from '@/modules/travels/travels.module';
import { MembersModule } from '@/modules/members/members.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { ExpensesModule } from '@/modules/expenses/expenses.module';
import { EmailService } from '@/modules/common/email/email.service';

const mockSendMagicLink = jest.fn().mockResolvedValue(undefined);

describe('Travels, Members, Categories & Expenses — Full E2E Lifecycle', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // ── Shared state built up through the sequential flow ───────────────────────
  let ownerJwt: string;
  let memberJwt: string;
  let nonMemberJwt: string;

  let travelId: string;
  let ownerMemberId: string;
  let memberMemberId: string;
  let guestMemberId: string;

  let categoryFoodId: string;
  let categoryTransportId: string;

  let ownerExpenseId: string;
  let memberExpenseId: string;

  // ── App bootstrap ────────────────────────────────────────────────────────────
  beforeAll(async () => {
    loadEnv({ path: '.env.local', quiet: true });
    loadEnv({ path: '.env', quiet: true });

    const required: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-secret-min-32-characters!!',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_e2e_placeholder',
      PORT: process.env.PORT ?? '3000',
    };
    for (const [key, value] of Object.entries(required)) {
      if (!process.env[key]) process.env[key] = value;
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set (or present in .env) for E2E tests');
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateEnv,
          envFilePath: ['.env.local', '.env'],
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        TravelsModule,
        MembersModule,
        CategoriesModule,
        ExpensesModule,
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ sendMagicLink: mockSendMagicLink })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    // Final cleanup — travel cascade should handle most, but clean users too
    await prisma.expense.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.travelMember.deleteMany({});
    await prisma.travel.deleteMany({});
    await prisma.magicLink.deleteMany({});
    await prisma.user.deleteMany({});
    await app?.close();
  });

  // ── Helper: create a user account and return their JWT ───────────────────────
  async function createAuthenticatedUser(email: string): Promise<string> {
    await request(app.getHttpServer()).post('/auth/magic-link').send({ email }).expect(202);

    const magicLink = await prisma.magicLink.findFirst({ where: { email } });
    const res = await request(app.getHttpServer())
      .get('/auth/verify')
      .query({ token: magicLink!.token })
      .expect(200);

    return res.body.accessToken as string;
  }

  // ── Step 0: Authenticate test users ─────────────────────────────────────────
  it('0. authenticates owner, member, and non-member users', async () => {
    ownerJwt = await createAuthenticatedUser('e2e-owner@test.com');
    memberJwt = await createAuthenticatedUser('e2e-member@test.com');
    nonMemberJwt = await createAuthenticatedUser('e2e-nonmember@test.com');

    expect(ownerJwt).toBeTruthy();
    expect(memberJwt).toBeTruthy();
    expect(nonMemberJwt).toBeTruthy();
  });

  // ── Step 1: Travel lifecycle ─────────────────────────────────────────────────
  describe('1. Travel lifecycle', () => {
    it('1.1 creates a travel and auto-creates owner membership (T-1, T-2)', async () => {
      const res = await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({
          name: 'Europe Trip 2026',
          currency: 'EUR',
          budget: 5000,
          startDate: '2026-07-01',
          endDate: '2026-07-31',
          description: 'Summer vacation across Europe',
        })
        .expect(201);

      travelId = res.body.id as string;
      expect(travelId).toBeTruthy();
      expect(res.body.name).toBe('Europe Trip 2026');
      expect(res.body.currency).toBe('EUR');

      // Verify owner was auto-created as a TravelMember with role 'owner'
      const ownerMember = await prisma.travelMember.findFirst({
        where: { travelId, role: 'owner' },
      });
      expect(ownerMember).not.toBeNull();
      ownerMemberId = ownerMember!.id;
    });

    it('1.2 rejects travel with invalid dates (endDate before startDate) (T-7)', async () => {
      await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({
          name: 'Bad Dates Trip',
          currency: 'USD',
          budget: 1000,
          startDate: '2026-08-31',
          endDate: '2026-08-01',
        })
        .expect(400);
    });

    it('1.3 rejects travel with invalid currency code (T-8)', async () => {
      await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({
          name: 'Bad Currency Trip',
          currency: 'XYZ',
          budget: 1000,
          startDate: '2026-07-01',
          endDate: '2026-07-31',
        })
        .expect(400);
    });

    it('1.4 lists travels — owner sees their travel (T-3)', async () => {
      const res = await request(app.getHttpServer())
        .get('/travels')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = (res.body as Array<{ id: string }>).find((t) => t.id === travelId);
      expect(found).toBeDefined();
    });

    it('1.5 lists travels — non-member does not see the travel (T-3)', async () => {
      const res = await request(app.getHttpServer())
        .get('/travels')
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .expect(200);

      const found = (res.body as Array<{ id: string }>).find((t) => t.id === travelId);
      expect(found).toBeUndefined();
    });

    it('1.6 gets travel detail with members and spending summary (T-4)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/travels/${travelId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(200);

      expect(res.body.id).toBe(travelId);
      expect(Array.isArray(res.body.members)).toBe(true);
      expect(res.body.members).toHaveLength(1);
      expect(res.body.members[0].role).toBe('owner');
      expect(res.body.summary).toBeDefined();
      expect(typeof res.body.summary.totalSpent).toBe('number');
      expect(typeof res.body.summary.budget).toBe('number');
      expect(typeof res.body.summary.remaining).toBe('number');
    });

    it('1.7 non-member gets 403 on GET /travels/:id (T-4)', async () => {
      await request(app.getHttpServer())
        .get(`/travels/${travelId}`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .expect(403);
    });

    it('1.8 non-owner gets 403 on PATCH /travels/:id (T-5)', async () => {
      // member is not yet added, so use nonMemberJwt first to verify 403 for non-members
      await request(app.getHttpServer())
        .patch(`/travels/${travelId}`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .send({ name: 'Hacked Name' })
        .expect(403);
    });

    it('1.9 owner updates travel details (T-5)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/travels/${travelId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ description: 'Updated description', budget: 6000 })
        .expect(200);

      expect(res.body.description).toBe('Updated description');
    });
  });

  // ── Step 2: Member lifecycle ─────────────────────────────────────────────────
  describe('2. Member lifecycle', () => {
    it('2.1 owner adds a registered user as a member by email (M-1, M-2)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/members`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ email: 'e2e-member@test.com' })
        .expect(201);

      memberMemberId = res.body.id as string;
      expect(memberMemberId).toBeTruthy();
      expect(res.body.role).toBe('member');
      expect(res.body.guestName).toBeNull();
    });

    it('2.2 adding same user again returns 409 (M-5)', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/members`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ email: 'e2e-member@test.com' })
        .expect(409);
    });

    it('2.3 adding unknown email returns 404 with guest suggestion (M-3)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/members`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ email: 'unknown-user@nowhere.com' })
        .expect(404);

      expect(res.body.message).toMatch(/guest/i);
    });

    it('2.4 owner adds a guest member by name (M-4)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/members`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ guestName: 'Alice Guest' })
        .expect(201);

      guestMemberId = res.body.id as string;
      expect(guestMemberId).toBeTruthy();
      expect(res.body.guestName).toBe('Alice Guest');
      expect(res.body.userId).toBeNull();
    });

    it('2.5 non-owner cannot add members (M-1)', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/members`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({ guestName: 'Unauthorized Guest' })
        .expect(403);
    });

    it('2.6 non-member cannot add members', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/members`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .send({ guestName: 'Unauthorized Guest' })
        .expect(403);
    });

    it('2.7 travel detail now shows 3 members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/travels/${travelId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(200);

      expect(res.body.members).toHaveLength(3);
    });
  });

  // ── Step 3: Category lifecycle ───────────────────────────────────────────────
  describe('3. Category lifecycle', () => {
    it('3.1 owner creates a Food category (C-1)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/categories`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ name: 'Food', icon: 'utensils', color: '#FF5733', budgetLimit: 1000 })
        .expect(201);

      categoryFoodId = res.body.id as string;
      expect(categoryFoodId).toBeTruthy();
      expect(res.body.name).toBe('Food');
      expect(res.body.travelId).toBe(travelId);
    });

    it('3.2 owner creates a Transport category (C-1)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/categories`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ name: 'Transport', icon: 'car', color: '#3498DB' })
        .expect(201);

      categoryTransportId = res.body.id as string;
      expect(categoryTransportId).toBeTruthy();
    });

    it('3.3 duplicate category name returns 409 (C-4)', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/categories`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ name: 'Food', icon: 'fork', color: '#00FF00' })
        .expect(409);
    });

    it('3.4 non-owner cannot create categories (C-1)', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/categories`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({ name: 'Unauthorized', icon: 'x', color: '#000000' })
        .expect(403);
    });

    it('3.5 owner updates a category (C-2)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/travels/${travelId}/categories/${categoryFoodId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ name: 'Dining', budgetLimit: 1500 })
        .expect(200);

      expect(res.body.name).toBe('Dining');
    });

    it('3.6 non-owner cannot update categories (C-2)', async () => {
      await request(app.getHttpServer())
        .patch(`/travels/${travelId}/categories/${categoryFoodId}`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  // ── Step 4: Expense lifecycle ────────────────────────────────────────────────
  describe('4. Expense lifecycle', () => {
    it('4.1 owner creates an expense (E-1)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({
          categoryId: categoryFoodId,
          amount: 45.5,
          description: 'Dinner in Paris',
          date: '2026-07-05',
        })
        .expect(201);

      ownerExpenseId = res.body.id as string;
      expect(ownerExpenseId).toBeTruthy();
      expect(res.body.memberId).toBe(ownerMemberId);
      expect(res.body.travelId).toBe(travelId);
    });

    it('4.2 member creates an expense (E-1)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({
          categoryId: categoryTransportId,
          amount: 30,
          description: 'Metro tickets',
          date: '2026-07-06',
        })
        .expect(201);

      memberExpenseId = res.body.id as string;
      expect(memberExpenseId).toBeTruthy();
      expect(res.body.memberId).toBe(memberMemberId);
    });

    it('4.3 non-member cannot create expense (E-1)', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .send({
          categoryId: categoryFoodId,
          amount: 10,
          description: 'Coffee',
          date: '2026-07-05',
        })
        .expect(403);
    });

    it('4.4 expense with invalid categoryId (from another travel) returns 400 (E-7)', async () => {
      // Create a separate travel + category to get a foreign categoryId
      const otherTravelRes = await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .send({
          name: 'Other Trip',
          currency: 'USD',
          budget: 1000,
          startDate: '2026-08-01',
          endDate: '2026-08-10',
        })
        .expect(201);

      const otherTravelId = otherTravelRes.body.id as string;
      const otherCatRes = await request(app.getHttpServer())
        .post(`/travels/${otherTravelId}/categories`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .send({ name: 'Other Cat', icon: 'tag', color: '#AAAAAA' })
        .expect(201);

      const foreignCategoryId = otherCatRes.body.id as string;

      await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({
          categoryId: foreignCategoryId,
          amount: 20,
          description: 'Invalid category',
          date: '2026-07-07',
        })
        .expect(400);

      // Cleanup other travel
      await request(app.getHttpServer())
        .delete(`/travels/${otherTravelId}`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .expect(204);
    });

    it('4.5 lists all expenses for travel (E-2)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
    });

    it('4.6 lists expenses filtered by categoryId (E-2)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/travels/${travelId}/expenses`)
        .query({ categoryId: categoryFoodId })
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(200);

      const expenses = res.body.data as Array<{ categoryId: string }>;
      expect(expenses.length).toBeGreaterThanOrEqual(1);
      expect(expenses.every((e) => e.categoryId === categoryFoodId)).toBe(true);
    });

    it('4.7 lists expenses filtered by memberId (E-2)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/travels/${travelId}/expenses`)
        .query({ memberId: memberMemberId })
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(200);

      const expenses = res.body.data as Array<{ memberId: string }>;
      expect(expenses.length).toBeGreaterThanOrEqual(1);
      expect(expenses.every((e) => e.memberId === memberMemberId)).toBe(true);
    });

    it('4.8 non-member cannot list expenses', async () => {
      await request(app.getHttpServer())
        .get(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .expect(403);
    });
  });

  // ── Step 5: Expense ownership and owner override ─────────────────────────────
  describe('5. Expense ownership & owner override', () => {
    it('5.1 member edits their own expense (E-3)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/travels/${travelId}/expenses/${memberExpenseId}`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({ description: 'Metro tickets (updated)', amount: 35 })
        .expect(200);

      expect(res.body.description).toBe('Metro tickets (updated)');
      expect(res.body.amount).toBe(35);
    });

    it("5.2 member cannot edit another member's expense (E-6)", async () => {
      await request(app.getHttpServer())
        .patch(`/travels/${travelId}/expenses/${ownerExpenseId}`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({ description: 'Unauthorized edit' })
        .expect(403);
    });

    it("5.3 owner can edit any member's expense (E-5)", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/travels/${travelId}/expenses/${memberExpenseId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ description: 'Owner corrected: Metro tickets', amount: 32 })
        .expect(200);

      expect(res.body.description).toBe('Owner corrected: Metro tickets');
    });

    it("5.4 member cannot delete another member's expense (E-6)", async () => {
      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/expenses/${ownerExpenseId}`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .expect(403);
    });

    it("5.5 owner can delete any member's expense (E-5)", async () => {
      // Create a temp expense as member to delete it as owner
      const tempRes = await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({
          categoryId: categoryTransportId,
          amount: 10,
          description: 'Temp expense',
          date: '2026-07-08',
        })
        .expect(201);

      const tempExpenseId = tempRes.body.id as string;

      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/expenses/${tempExpenseId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(204);

      const found = await prisma.expense.findUnique({ where: { id: tempExpenseId } });
      expect(found).toBeNull();
    });

    it('5.6 member deletes their own expense (E-4)', async () => {
      // Create a temp expense as member and delete it as member
      const tempRes = await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({
          categoryId: categoryTransportId,
          amount: 5,
          description: 'Member own delete test',
          date: '2026-07-09',
        })
        .expect(201);

      const tempExpenseId = tempRes.body.id as string;

      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/expenses/${tempExpenseId}`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .expect(204);
    });

    it('5.7 spending summary reflects expenses (T-4)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/travels/${travelId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(200);

      expect(res.body.summary.totalSpent).toBeGreaterThan(0);
    });
  });

  // ── Step 6: Category delete blocked when expenses exist ──────────────────────
  describe('6. Category delete with expenses', () => {
    it('6.1 deleting category with expenses returns 409 (C-3)', async () => {
      // ownerExpenseId is in categoryFoodId (now named "Dining"), memberExpenseId in categoryTransportId
      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/categories/${categoryFoodId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(409);
    });

    it('6.2 deleting the expense allows the category to be deleted (C-3)', async () => {
      // Delete owner's expense first
      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/expenses/${ownerExpenseId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(204);

      // Now category delete should succeed
      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/categories/${categoryFoodId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(204);

      const found = await prisma.category.findUnique({ where: { id: categoryFoodId } });
      expect(found).toBeNull();

      categoryFoodId = ''; // mark as deleted
    });

    it('6.3 non-owner cannot delete categories', async () => {
      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/categories/${categoryTransportId}`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .expect(403);
    });
  });

  // ── Step 7: Member removal preserves expenses ────────────────────────────────
  describe('7. Member removal preserves expenses', () => {
    it('7.1 owner cannot remove themselves (M-6)', async () => {
      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/members/${ownerMemberId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(400);
    });

    it('7.2 non-owner cannot remove members (M-6)', async () => {
      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/members/${guestMemberId}`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .expect(403);
    });

    it('7.3 owner removes the member; their expenses are preserved (M-6, M-7)', async () => {
      // Verify member expense exists before removal
      const expenseBefore = await prisma.expense.findUnique({ where: { id: memberExpenseId } });
      expect(expenseBefore).not.toBeNull();

      await request(app.getHttpServer())
        .delete(`/travels/${travelId}/members/${memberMemberId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(204);

      // Member record gone
      const memberRecord = await prisma.travelMember.findUnique({ where: { id: memberMemberId } });
      expect(memberRecord).toBeNull();

      // Expense still exists (historical accuracy)
      const expenseAfter = await prisma.expense.findUnique({ where: { id: memberExpenseId } });
      expect(expenseAfter).not.toBeNull();
    });

    it('7.4 non-member (removed member) gets 403 on further access', async () => {
      await request(app.getHttpServer())
        .get(`/travels/${travelId}`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .expect(403);
    });
  });

  // ── Step 8: Cascade delete travel ────────────────────────────────────────────
  describe('8. Cascade delete', () => {
    it('8.1 non-owner cannot delete the travel (T-6)', async () => {
      await request(app.getHttpServer())
        .delete(`/travels/${travelId}`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .expect(403);
    });

    it('8.2 owner deletes travel; all related records are removed (T-6)', async () => {
      // Capture IDs before deletion
      const capturedTravelId = travelId;
      const capturedMemberExpenseId = memberExpenseId;
      const capturedCategoryTransportId = categoryTransportId;
      const capturedOwnerMemberId = ownerMemberId;
      const capturedGuestMemberId = guestMemberId;

      await request(app.getHttpServer())
        .delete(`/travels/${capturedTravelId}`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(204);

      // Travel is gone
      const travel = await prisma.travel.findUnique({ where: { id: capturedTravelId } });
      expect(travel).toBeNull();

      // All members are gone (cascade)
      const ownerMemberRecord = await prisma.travelMember.findUnique({
        where: { id: capturedOwnerMemberId },
      });
      expect(ownerMemberRecord).toBeNull();

      const guestMemberRecord = await prisma.travelMember.findUnique({
        where: { id: capturedGuestMemberId },
      });
      expect(guestMemberRecord).toBeNull();

      // Category is gone (cascade)
      const category = await prisma.category.findUnique({
        where: { id: capturedCategoryTransportId },
      });
      expect(category).toBeNull();

      // Expense is gone (cascade)
      const expense = await prisma.expense.findUnique({
        where: { id: capturedMemberExpenseId },
      });
      expect(expense).toBeNull();
    });
  });
});
