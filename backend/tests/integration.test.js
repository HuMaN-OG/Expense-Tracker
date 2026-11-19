const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { app } = require('../server');

test('live integration test: auth, health, and CRUD operations', async (t) => {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    t.skip('Skipping live integration tests: MONGO_URI or JWT_SECRET not configured');
    return;
  }

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);

  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let token = null;
  let createdExpenseId = null;
  const testEmail = `synthetic_tester_${Date.now()}@example.org`;
  const testPassword = 'Password123!';

  try {
    // 1. Health check with connected database
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.status, 'ok');
    assert.equal(healthData.database, 'connected');

    // 2. Register synthetic test user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Synthetic Tester',
        email: testEmail,
        password: testPassword,
      }),
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.ok(regData.data && regData.data.token);
    token = regData.data.token;

    // 3. Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.data && loginData.data.token);

    // 4. Create an expense
    const createRes = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Demo Groceries',
        amount: 42.50,
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString(),
        note: 'Synthetic grocery purchase',
      }),
    });
    assert.equal(createRes.status, 201);
    const createPayload = await createRes.json();
    assert.ok(createPayload.data && createPayload.data._id);
    createdExpenseId = createPayload.data._id;
    assert.equal(createPayload.data.amount, 42.50);

    // 5. Read expenses
    const getRes = await fetch(`${baseUrl}/api/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(getRes.status, 200);
    const getPayload = await getRes.json();
    const expensesList = getPayload.data;
    assert.ok(Array.isArray(expensesList));
    assert.ok(expensesList.some(e => e._id === createdExpenseId));

    // 6. Update expense
    const updateRes = await fetch(`${baseUrl}/api/expenses/${createdExpenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 49.99,
        title: 'Demo Groceries Updated',
      }),
    });
    assert.equal(updateRes.status, 200);
    const updatePayload = await updateRes.json();
    assert.equal(updatePayload.data.amount, 49.99);

    // 7. Delete expense
    const delRes = await fetch(`${baseUrl}/api/expenses/${createdExpenseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(delRes.status, 200);

    // 8. Verify deletion
    const verifyRes = await fetch(`${baseUrl}/api/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyPayload = await verifyRes.json();
    const remaining = verifyPayload.data;
    assert.ok(!remaining.some(e => e._id === createdExpenseId));
  } finally {
    // Cleanup synthetic user from database
    try {
      const User = mongoose.model('User');
      await User.deleteOne({ email: testEmail });
      if (createdExpenseId) {
        const Expense = mongoose.model('Expense');
        await Expense.deleteOne({ _id: createdExpenseId });
      }
    } catch (e) {
      // Ignore cleanup error
    }
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }
});
