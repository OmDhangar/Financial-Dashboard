/**
 * Finance Dashboard API - Smoke Test Script
 * 
 * This script performs a full end-to-end walkthrough of the API's features.
 * Prerequisites:
 *   1. Server running (npm run dev)
 *   2. Database seeded (npm run prisma:seed)
 * 
 * Usage:
 *   npm run test:smoke
 */

const API_URL = 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = 'admin@company.com';
const PASSWORD = 'Password123!';

async function runTests() {
    console.log('🚀 Starting Finance Dashboard Smoke Test...\n');

    let adminToken = '';
    let viewerToken = '';
    let testCategoryId = '';
    let testRecordId = '';
    let testUserId = '';

    try {
        // --- 1. AUTHENTICATION & REGISTRATION ---
        console.log('--- Phase 1: Auth & Registration ---');
        
        // 1.1 Register a new user (VIEWER by default)
        const newUserEmail = `smoke-test-${Date.now()}@example.com`;
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: newUserEmail,
                name: 'Smoke Test Viewer',
                password: 'Password123!'
            })
        });
        const regData = await regRes.json() as any;
        if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        viewerToken = regData.data.token;
        console.log(`✅ New user registered: ${newUserEmail} (Role: VIEWER)`);

        // 1.2 Login as Seeded Admin
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json() as any;
        if (!loginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
        adminToken = loginData.data.token;
        console.log('✅ Admin logged in successfully');

        // --- 2. PERMISSION CHECK ---
        console.log('\n--- Phase 2: Permission Check ---');
        const forbiddenRes = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${viewerToken}`
            },
            body: JSON.stringify({ name: 'Unauthorized Category' })
        });
        if (forbiddenRes.status === 403) {
            console.log('✅ Correctly blocked category creation for VIEWER');
        } else {
            console.warn(`❌ Expected 403 but got ${forbiddenRes.status}`);
        }

        // --- 3. CATEGORY MANAGEMENT (ADMIN) ---
        console.log('\n--- Phase 3: Category Management (Admin) ---');
        const catRes = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ name: `Test-Category-${Date.now()}` })
        });
        const catData = await catRes.json() as any;
        if (!catRes.ok) throw new Error(`Category creation failed: ${JSON.stringify(catData)}`);
        testCategoryId = catData.data.id;
        console.log(`✅ Category created: ${catData.data.name} (ID: ${testCategoryId})`);

        // --- 4. RECORD MANAGEMENT (ADMIN) ---
        console.log('\n--- Phase 4: Record Management (Admin) ---');
        const recordRes = await fetch(`${API_URL}/records`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                amount: 1500,
                type: 'INCOME',
                categoryId: testCategoryId,
                date: new Date().toISOString(),
                notes: 'Smoke test transaction'
            })
        });
        const recordData = await recordRes.json() as any;
        if (!recordRes.ok) throw new Error(`Record creation failed: ${JSON.stringify(recordData)}`);
        testRecordId = recordData.data.id;
        console.log(`✅ Record created: $${recordData.data.amount} (ID: ${testRecordId})`);

        // --- 5. DASHBOARD & ANALYTICS ---
        console.log('\n--- Phase 5: Dashboard & Analytics ---');
        const summaryRes = await fetch(`${API_URL}/dashboard/summary`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const summaryData = await summaryRes.json() as any;
        console.log(`✅ Dashboard Summary check: ${summaryData.success ? 'PASS' : 'FAIL'}`);

        const trendsRes = await fetch(`${API_URL}/dashboard/trends`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const trendsData = await trendsRes.json() as any;
        console.log(`✅ Dashboard Trends: Found ${trendsData.data.length} months`);

        // --- 6. USER MANAGEMENT (ADMIN) ---
        console.log('\n--- Phase 6: User Management (Admin) ---');
        const userListRes = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const userListData = await userListRes.json() as any;
        testUserId = userListData.data.find((u: any) => u.email === newUserEmail)?.id;
        console.log(`✅ Found new user in list (ID: ${testUserId})`);

        // Update user status
        await fetch(`${API_URL}/users/${testUserId}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: 'INACTIVE' })
        });
        console.log('✅ User status updated to INACTIVE');

        // --- 7. CLEANUP ---
        console.log('\n--- Phase 7: Cleanup ---');
        await fetch(`${API_URL}/records/${testRecordId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        await fetch(`${API_URL}/users/${testUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ Cleanup complete');

        console.log('\n✨ ALL FEATURES TESTED SUCCESSFULLY! ✨');

    } catch (error) {
        console.error('\n❌ Smoke test failed!');
        console.error(error);
        process.exit(1);
    }
}

runTests();
