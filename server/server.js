const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { verifyDocument } = require('./controllers/kycController');
const { chatWithAI, getLogs } = require('./controllers/aiController');
const { login, verifyOTP, getDocuments } = require('./controllers/digilockerController');

const app = express();
const PORT = 5000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.post('/api/kyc/verify', verifyDocument);

// persistent Chat Routes
const { createSession, getSession, getUserHistory, sendMessage } = require('./controllers/chatController');
app.post('/api/chat', sendMessage); // [FIX] Point to new Controller
app.post('/api/chat/start', createSession);
app.get('/api/chat/session/:sessionId', getSession);
app.get('/api/chat/history/:mobile', getUserHistory);

// DigiLocker Mock Routes
app.post('/api/digilocker/login', login);
app.post('/api/digilocker/otp', verifyOTP);
app.post('/api/digilocker/documents', getDocuments);

// CIBIL Mock Routes
const { getCibilScore } = require('./controllers/cibilController');
app.post('/api/cibil/score', getCibilScore);

// User Profile Routes
const { updateUserProfile, getUserProfile } = require('./controllers/userController');
app.post('/api/user/update', updateUserProfile);
app.get('/api/user/profile', getUserProfile);

app.listen(PORT, () => {
    console.log(`[Swifty Backend] Running on http://localhost:${PORT}`);
});
