# Swifty AI - Test User Profiles

Use these personas to test the bot's behavior across different financial scenarios (High Net Worth, Rejected, Standard, etc.).
**Login:** Use the Mobile Number provided. OTP is auto-filled (any 6 digits works).

## 🚀 Quick Reference Cheat Sheet

| Name | Mobile | Bank A/C | Income | Bank Balance | Scenario / Persona |
|------|--------|----------|--------|--------------|--------------------|
| **Neha** | `1010101010` | `ACC101010` | ₹3.0L | ₹1.5 Cr (Wealth) | **Ultra HNI**. Ask "Check Balance" -> huge amount. |
| **Sneha** | `6666666666` | `ACC666004` | ₹2.0L | ₹8.5L (Savings) | **High Earner**. Good Upsell. |
| **Rohan** | `3333333333` | `ACC333007` | ₹1.5L | ₹12.5L (Current) | **Business Owner**. Check "Staff Salaries" txns. |
| **Arjun** | `9999999999` | `ACC999001` | ₹85k | ₹1.25L (Savings) | **Standard User**. Happy Path. |
| **Amit** | `1111111111` | `ACC111009` | ₹55k | ₹25k (Savings) | **Blue Collar**. Stable. |
| **Vikram** | `5555555555` | `ACC444006` | ₹60k | ₹8,500 (Low) | **Recent Rejection**. |
| **Anjali** | `4444444444` | `ACC444006` | ₹35k | ₹1,200 (Critical) | **Struggling** (Note: Shared mock ID usage). |
| **Priya** | `8888888888` | `ACC888002` | ₹1.2L | ₹4.5L (Current) | **Debt Trap**. High Income, High Debt. |
| **Kavita** | `2222222222` | `ACC222008` | ₹75k | ₹500 (Bounce Risk) | **Defaulter**. "Cheque Bounce" in txns. |
| **Rahul** | `7777777777` | `ACC777003` | ₹45k | ₹15k (Savings) | **Entry Level**. Thin File. |
| **Mahesh** | `9876543210` | `ACC987011` | ₹40k | ₹3.5L (Pension) | **Senior Citizen**. Check "Pension Credit". |

---

## 📂 Detailed Profiles & Test Scenarios

### 1. Neha Chopra (Ultra HNI)
*   **Mobile**: `1010101010`
*   **Bank Account**: `ACC101010` (Wealth Account - ₹1.5 Cr)
*   **Test**: Ask "What is my balance?". Bot should show the high amount.
*   **Loans**: Home Loan (HDFC), Car Loan (Mercedes).

### 2. Priya Sharma (Business / High Debt)
*   **Mobile**: `8888888888`
*   **Bank Account**: `ACC888002` (Current Account - ₹4.5L)
*   **Test**: Ask "Show transactions". Look for "Client Payment" and "Office Rent".
*   **Warning**: High Credit Utilization.

### 3. Kavita Reddy (Risk / Defaulter)
*   **Mobile**: `2222222222`
*   **Bank Account**: `ACC222008` (Savings - ₹500)
*   **Test**: Ask "Last transactions". You will see a **"Cheque Bounce Charge"**.
*   **History**: Settled Debt.

### 4. Anjali Desai (Struggling Junior)
*   **Mobile**: `4444444444`
*   **Bank Account**: `ACC444006` (Savings - ₹1,200)
*   **Test**: Ask for loan. Bot might hesitate due to 1 Late Payment.

### 5. Sneha Gupta (High Savings)
*   **Mobile**: `6666666666`
*   **Bank Account**: `ACC666004` (Premium Savings - ₹8.5L)
*   **Test**: Ask "Check Balance". Ask for Investment products (FD/Mutual Funds).

### 6. Arjun Kumar (Standard)
*   **Mobile**: `9999999999`
*   **Bank Account**: `ACC999001` (Salary Account - ₹1.25L)
*   **Test**: Standard "Home Loan" or "Personal Loan" flow.

### 7. Rohan Mehta (Business Owner)
*   **Mobile**: `3333333333`
*   **Bank Account**: `ACC333007` (Current Account - ₹12.5L)
*   **Test**: Ask for Business Loan. Bot should see "Business Income".

### 8. Vikram Singh (Recent Rejection)
*   **Mobile**: `5555555555`
*   **Bank Account**: `ACC444006` (Savings - ₹8,500)
*   **Test**: Ask for Personal Loan. Bot should flag "Recent Rejection".

### 9. Rahul Verma (Entry Level)
*   **Mobile**: `7777777777`
*   **Bank Account**: `ACC777003` (Savings - ₹15k)
*   **Test**: Basic queries. "How do I start an SIP?".

### 10. Guest User (New Walk-in)
*   **Mobile**: Any other number
*   **Bank**: Wallet (₹0)
*   **Test**: General FAQs.

### 11. Mahesh Kumar (Senior Citizen)
*   **Mobile**: `9876543210`
*   **Bank Account**: `ACC987011` (Pension Account - ₹3.5L)
*   **Test**: Ask "Show last transactions". Verifies "Govt Pension Credit".
*   **Loans**: Closed Home Loan (SBI). Good Upsell for "Senior Citizen FD".
