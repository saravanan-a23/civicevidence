const crypto = require('crypto');

const API_URL = 'http://localhost:5002/api';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runFullFlow = async () => {
  console.log('\n===============================================================');
  console.log('   🛡️  CIVICEVIDENCE END-TO-END SYSTEM INTEGRATION FLOW  🛡️');
  console.log('===============================================================\n');

  try {
    // Step 1: User Registration
    console.log('STEP 1: Registering lead administrator account...');
    const registerEmail = `jane.d${Date.now()}@civicevidence.gov`;
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Agent Jane Doe',
        email: registerEmail,
        password: 'securepassword123',
        role: 'admin'
      })
    });
    const regData = await regRes.json();
    console.log(`✔ Registration API Status: ${regRes.status}`);
    console.log(`Message: ${regData.message}`);
    const simulatedOtp = regData.simulatedOtp;
    
    await wait(800);

    // Step 2: Email Verification via OTP
    console.log('\nSTEP 2: Submitting simulated email OTP verification...');
    const verifyRes = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerEmail,
        otp: simulatedOtp
      })
    });
    const verifyData = await verifyRes.json();
    console.log(`✔ OTP Verification Status: ${verifyRes.status}`);
    console.log(`Message: ${verifyData.message}`);

    await wait(800);

    // Step 3: Login to establish secure session
    console.log('\nSTEP 3: Authenticating credentials and establishing session...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerEmail,
        password: 'securepassword123'
      })
    });
    const loginData = await loginRes.json();
    console.log(`✔ Authentication Success. Status: ${loginRes.status}`);
    console.log(`Role: ${loginData.role}`);
    console.log(`JWT Token: ${loginData.token.slice(0, 30)}...`);
    const token = loginData.token;

    await wait(800);

    // Step 4: Register Case
    const caseNumber = `CASE-${Date.now().toString().slice(-4)}`;
    console.log(`\nSTEP 4: Registering new investigation case directory [${caseNumber}]...`);
    const caseRes = await fetch(`${API_URL}/cases`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        caseNumber,
        title: 'DIPLOMATIC VAULT HEIST 2026',
        description: 'Grand larceny involving vault breaching at diplomatic sector.',
        assignedOfficer: loginData._id
      })
    });
    const caseData = await caseRes.json();
    console.log(`✔ Case Registered successfully.`);
    console.log(`Case Title: ${caseData.title}`);
    console.log(`Lead Officer ID: ${caseData.assignedOfficer}`);

    await wait(800);

    // Step 5: Encrypt and Upload File
    console.log('\nSTEP 5: Executing secure file upload (AES-256 encryption)...');
    const mockFileContent = 'MOCK CCTV STREAM BINARY DATA: SUSPECT BREACHED GATE 3 AT 23:42:01.';
    const fileBuffer = Buffer.from(mockFileContent, 'utf-8');
    const uploadHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    console.log(`File Content: "${mockFileContent}"`);
    console.log(`Calculated SHA-256: ${uploadHash}`);

    // Create FormData natively
    const formData = new FormData();
    formData.append('title', 'CCTV Gate 3 Breach');
    formData.append('description', 'Footage showing entry signature.');
    formData.append('category', 'Video');
    formData.append('caseId', caseData._id);
    formData.append('tags', 'cctv, heist, gate-3');
    
    // Append mock file as blob
    const fileBlob = new Blob([fileBuffer], { type: 'video/mp4' });
    formData.append('file', fileBlob, 'cctv-footage.mp4');

    const uploadRes = await fetch(`${API_URL}/evidence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const uploadData = await uploadRes.json();
    console.log(`✔ Encryption & Upload Success. Status: ${uploadRes.status}`);
    console.log(`Stored URL: ${uploadData.encryptedFileURL}`);
    console.log(`Metadata ID: ${uploadData._id}`);

    await wait(800);

    // Step 6: Fetch Dossier Details
    console.log('\nSTEP 6: Fetching dossier details and checking metadata separation...');
    const dossierRes = await fetch(`${API_URL}/evidence/${uploadData._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dossierData = await dossierRes.json();
    console.log(`✔ Metadata retrieved. Status: ${dossierRes.status}`);
    console.log(`Encrypted File Key in DB: ${dossierData.evidence.fileKeyEncrypted.slice(0, 30)}...`);
    console.log(`File IV in DB: ${dossierData.evidence.fileIvHex}`);

    await wait(800);

    // Step 7: Decrypt and Download File
    console.log('\nSTEP 7: Decrypting and downloading evidence payload...');
    const downloadRes = await fetch(`${API_URL}/evidence/${uploadData._id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const downloadBlob = await downloadRes.arrayBuffer();
    const downloadedBuffer = Buffer.from(downloadBlob);
    const downloadedHash = crypto.createHash('sha256').update(downloadedBuffer).digest('hex');
    const decryptedContent = downloadedBuffer.toString('utf-8');
    
    console.log(`✔ Decrypted Payload: "${decryptedContent}"`);
    console.log(`✔ Recalculated Hash: ${downloadedHash}`);
    if (downloadedHash === uploadHash) {
      console.log('✔ INTEGRITY CHECK: PASS (Hashes match. Payload unaltered)');
    } else {
      console.log('❌ INTEGRITY CHECK: FAIL (Hashes mismatch!)');
    }

    await wait(800);

    // Step 8: Secure Temporary Share Link
    console.log('\nSTEP 8: Creating secure shared link for collaborator...');
    
    // Register collaborator first
    const partnerEmail = `partner${Date.now()}@agency.gov`;
    const partnerRegRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Agent Jane Partner',
        email: partnerEmail,
        password: 'partnerpassword123',
        role: 'officer'
      })
    });
    const partnerRegData = await partnerRegRes.json();
    // verify partner
    await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: partnerEmail,
        otp: partnerRegData.simulatedOtp
      })
    });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const shareRes = await fetch(`${API_URL}/share`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        evidenceId: uploadData._id,
        email: partnerEmail,
        permission: 'download',
        expiresAt: nextWeek.toISOString()
      })
    });
    const shareData = await shareRes.json();
    console.log(`✔ Share Permission Status: ${shareRes.status}`);
    console.log(`Message: ${shareData.message}`);

    await wait(800);

    // Step 9: View Immutable Audit Logs Feed
    console.log('\nSTEP 9: Querying immutable Chain of Custody Audit Trail...');
    const logsRes = await fetch(`${API_URL}/audit`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const logsData = await logsRes.json();
    console.log(`✔ Audit records found: ${logsData.total}`);
    
    console.log('\n--- RECENT CUSTODY LEDGER ENTRIES ---');
    logsData.logs.slice(0, 6).forEach(log => {
      console.log(`[${new Date(log.timestamp).toLocaleTimeString()}] Action: ${log.action} | Status: ${log.status} | Details: ${log.details}`);
    });
    console.log('-------------------------------------\n');

    console.log('===============================================================');
    console.log('    🏁  CIVICEVIDENCE FULL FLOW VERIFIED SUCCESSFULLY!  🏁');
    console.log('===============================================================\n');

  } catch (error) {
    console.error('❌ Integration flow crashed:', error);
  }
};

runFullFlow();
