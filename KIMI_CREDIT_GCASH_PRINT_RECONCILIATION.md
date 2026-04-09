# Credit System, GCash Checkout, and Printing Admin Reconciliation Report

> Generated: 2026-04-09  
> Status: IMPLEMENTATION REQUIRED - Core modules missing from repo

---

## 1. Executive Summary

**CRITICAL FINDING**: The checkout, orders, payments, products, offers, and printing modules were **never committed to the repository**, despite the live Supabase database already containing the schema support for these features.

This is a significant repo/live-DB mismatch where:
- **Live DB**: Has tables for orders, payments, products, offers, offer_products, printing_requests with appropriate columns
- **Repo Code**: Has NO implementation of these features - no routes, no components, no actions

The repo currently only contains: members, departments, events, treasury, announcements, access control, and member portal features.

---

## 2. Repo vs Live-DB Gap Analysis

### 2.1 Tables in Live DB (per schema snapshot)

| Table | In Live DB | In Repo Types | Status |
|-------|------------|---------------|--------|
| `orders` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `order_items` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `payments` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `products` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `product_categories` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `offers` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `offer_products` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `printing_requests` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `printing_request_items` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `debtors` / `credits` | Likely exists | ❌ Missing | To verify |

### 2.2 Enum Types in Live DB

| Enum | In Live DB | In Repo | Status |
|------|------------|---------|--------|
| `payment_method` | ✅ Yes (cash, gcash, credit) | ❌ Missing | **CRITICAL GAP** |
| `order_status` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |
| `payment_status` | ✅ Yes | ❌ Missing | **CRITICAL GAP** |

### 2.3 Key Columns in Live DB (per snapshot)

**orders table:**
- `payment_method` - enum-backed
- `status`
- `total_cents`
- `church_id`, `member_id`
- `code` - human-readable order code

**payments table:**
- `method` - enum-backed (cash, gcash, credit)
- `balance_due_cents` - already exists
- `reference_number` - already exists
- `gcash_ref` - already exists  
- `proof_url` - already exists
- `status` - pending, verified, rejected, etc.
- `verified_at`, `verified_by`

**products table:**
- `badge_text` - already exists
- `is_active`, `stock_quantity`, `price_cents`

### 2.4 Application Routes/Modules

| Module | Expected Path | Exists | Status |
|--------|--------------|--------|--------|
| Checkout | `app/checkout/CheckoutClient.tsx` | ❌ NO | **MISSING** |
| Order Success | `app/order/success/[code]/page.tsx` | ❌ NO | **MISSING** |
| Admin Orders | `app/admin/(protected)/orders/OrdersClient.tsx` | ❌ NO | **MISSING** |
| Admin Printing | `app/admin/(protected)/printing/PrintingAdminClient.tsx` | ❌ NO | **MISSING** |
| Products | `app/products/` | ❌ NO | **MISSING** |
| Offers | `app/offers/` | ❌ NO | **MISSING** |

### 2.5 Classified Status

| Area | Classification | Notes |
|------|---------------|-------|
| Checkout payment methods | **MISSING** | No checkout module exists |
| Credit mode in checkout | **MISSING** | No checkout module exists |
| Payments row creation | **MISSING** | No payment actions exist |
| GCash receipt/reference validation | **MISSING** | No validation code exists |
| Proof upload persistence | **MISSING** | No upload logic exists |
| Admin order display | **MISSING** | No admin orders page exists |
| Printing admin PDF/print | **MISSING** | No printing admin page exists |
| Database types | **OUTDATED** | database.ts missing all commerce tables |

---

## 3. Credit Checkout Restoration Summary

**Status**: CANNOT RESTORE - No code exists to restore

The credit checkout feature needs to be **built from scratch**, not restored. The requirements are:

### Required Implementation:

1. **Database Types** (`src/types/database.ts`):
   - Add `orders`, `order_items`, `payments`, `products`, `offers`, `offer_products` table types
   - Add `payment_method` enum type
   - Add `order_status` enum type
   - Add `payment_status` enum type

2. **Checkout Client** (`src/app/(commerce)/checkout/CheckoutClient.tsx`):
   - Product/offer selection
   - Payment method selector (cash, gcash, credit)
   - Credit mode: no GCash fields shown
   - GCash mode: reference number + receipt upload (at least one required)
   - Cash mode: simple confirmation
   - Review step with balance display

3. **Order Success Page** (`src/app/(commerce)/order/success/[code]/page.tsx`):
   - Credit-specific notice for unpaid orders
   - Order details display

4. **Server Actions** (`src/features/commerce/actions.ts`):
   - `createOrderAction` - creates order + order items + payment row
   - `uploadPaymentProofAction` - handles receipt upload to storage

### Credit Mode Behavior:
- Payment method = `credit`
- `balance_due_cents` = order total
- `status` = `pending` (not paid)
- No proof required
- No reference number required
- Clear messaging: "This creates an unpaid balance"

---

## 4. GCash Validation Fix Summary

**Status**: CANNOT FIX - No code exists to fix

### Required GCash Validation Rules:

```
For GCash payment, customer must provide:
  ✓ reference number only
  ✓ receipt upload only  
  ✓ both reference AND receipt
  ✗ NEITHER = INVALID (must reject)
```

### Implementation Points:

1. **Client-side validation** (`CheckoutClient.tsx`):
   ```typescript
   const hasReference = gcashRef.trim().length > 0;
   const hasReceipt = proofFile !== null;
   const isValid = hasReference || hasReceipt;
   ```

2. **User-facing copy**:
   - "Provide at least one: reference number or receipt upload"
   - Clear error: "Please enter a GCash reference number or upload a receipt"

3. **State management**:
   - Switching from GCash to Cash: clear gcashRef and proofFile
   - Switching from GCash to Credit: clear gcashRef and proofFile

4. **Payment truth preservation**:
   - Proof submitted ≠ paid verified
   - Order confirmed ≠ payment verified
   - GCash orders with proof remain `pending` until admin verification

---

## 5. Payment Row Creation Reconciliation Summary

**Status**: CANNOT RECONCILE - No code exists

### Required Payment Insert Logic:

**For Cash Orders:**
```typescript
{
  order_id: orderId,
  method: 'cash',
  amount_cents: totalCents,
  balance_due_cents: 0,  // Cash = fully paid
  status: 'verified',     // Cash assumed verified at creation
  reference_number: null,
  gcash_ref: null,
  proof_url: null
}
```

**For GCash Orders:**
```typescript
{
  order_id: orderId,
  method: 'gcash',
  amount_cents: totalCents,
  balance_due_cents: totalCents,  // Unpaid until verified
  status: 'pending',              // Requires admin verification
  reference_number: gcashRef || null,
  gcash_ref: gcashRef || null,
  proof_url: uploadedUrl || null
}
```

**For Credit Orders:**
```typescript
{
  order_id: orderId,
  method: 'credit',
  amount_cents: totalCents,
  balance_due_cents: totalCents,  // Full balance unpaid
  status: 'pending',              // Credit = debt
  reference_number: null,
  gcash_ref: null,
  proof_url: null
}
```

### Live DB Field Mapping (CONFIRMED):
- Use `reference_number` for GCash reference (canonical field)
- Use `proof_url` for receipt upload URL
- `gcash_ref` exists but may be legacy
- `balance_due_cents` tracks outstanding amount

---

## 6. Admin Orders Visibility Summary

**Status**: CANNOT IMPLEMENT - No admin orders module exists

### Required Admin Orders Features:

1. **Orders List** (`src/app/(church)/c/[churchSlug]/office/orders/`):
   - Filter by status: unpaid, proof-submitted, paid, credit
   - Display payment method badge
   - Display verification status
   - Quick actions: verify payment, view details

2. **Order Detail View**:
   - Order items
   - Payment details
   - Proof image viewer (for GCash)
   - Verification controls
   - Credit settlement flow

3. **Status Display Logic**:
   ```
   Unpaid normal orders: payment.status = 'pending' && method != 'credit'
   Proof-submitted: method = 'gcash' && (proof_url || reference_number)
   Paid/verified: payment.status = 'verified'
   Credit orders: method = 'credit'
   Settled credit: method = 'credit' && balance_due_cents = 0
   ```

---

## 7. Printing Admin PDF/Print Button Summary

**Status**: CANNOT IMPLEMENT - No printing admin module exists

### Required Implementation:

1. **Printing Admin Page** (`src/app/(church)/c/[churchSlug]/office/printing/page.tsx`):
   - List of printing requests
   - Status management
   - PDF viewer/print actions

2. **Print Actions**:
   - `Open PDF` - opens pdf_url in new tab
   - `Print PDF` - opens pdf_url in new tab with print intent
   - Handle missing PDF gracefully

3. **PDF Viewer Behavior**:
   ```typescript
   // Open in new tab
   window.open(pdfUrl, '_blank');
   
   // Or with print intent
   const printWindow = window.open(pdfUrl, '_blank');
   printWindow?.print();
   ```

4. **Required Fields** (per printing_requests table):
   - `pdf_url` - link to stored PDF
   - `status` - pending, processing, completed, cancelled
   - `notes` - staff notes
   - `quantity`, `paper_size`, `color_mode`

---

## 8. Confirmed Bugs Fixed

**NONE** - No code existed to fix.

Instead, this report documents the need for **new feature implementation**.

---

## 9. Remaining Fragile Areas

### High Priority (Blocks Commerce):

1. **Database types out of sync** - `src/types/database.ts` missing all commerce tables
2. **No storage bucket setup** - Where are receipt PDFs stored?
3. **No RLS policies verified** - Commerce tables need RLS
4. **No RPC functions** - Complex transactions need security definer functions

### Medium Priority:

5. **No product catalog** - Products/offers not queryable
6. **No inventory tracking** - Stock quantity management missing
7. **No debtor management** - Credit tracking UI missing

### Low Priority:

8. **No receipt email** - Order confirmation emails not implemented
9. **No payment reminders** - Credit reminder system missing

---

## 10. Manual Test Cases Recommended

### Phase 1: Basic Checkout (Cash)
1. Navigate to products page
2. Add item to cart
3. Checkout with cash payment
4. Verify order created with status = confirmed
5. Verify payment row created with method = cash, status = verified

### Phase 2: GCash Checkout
1. Checkout with GCash + reference number only
2. Verify order created, payment status = pending
3. Checkout with GCash + receipt only
4. Verify proof_url saved
5. Checkout with GCash + both
6. Verify admin can see proof-submitted status
7. Attempt checkout with GCash + neither (should reject)

### Phase 3: Credit Checkout
1. Checkout with credit payment
2. Verify order created
3. Verify payment row: method = credit, balance_due_cents = total
4. Verify success page shows credit notice
5. Verify appears in debtors list

### Phase 4: Admin Verification
1. View orders list
2. Filter by credit orders
3. Filter by proof-submitted orders
4. Verify GCash payment (marks as verified)
5. Settle credit order (reduce balance)

### Phase 5: Printing Admin
1. Create printing request with PDF
2. Open PDF in new tab
3. Print PDF
4. Update printing status

---

## 11. Supabase SQL Editor Scripts

### Script 1: Verify Commerce Tables Exist

**Purpose**: Confirm all required tables exist in live DB

**Precheck Query**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'payments', 'products', 'offers', 'offer_products', 'printing_requests');
```

**Expected Effect**: Returns list of existing commerce tables

---

### Script 2: Verify Payment Method Enum

**Purpose**: Confirm payment_method enum has correct values

**Precheck Query**:
```sql
SELECT e.enumlabel as value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'payment_method';
```

**Expected Effect**: Should return: cash, gcash, credit

---

### Script 3: Verify Payment Columns

**Purpose**: Confirm payments table has required columns

**Precheck Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN ('method', 'balance_due_cents', 'reference_number', 'gcash_ref', 'proof_url', 'status');
```

**Expected Effect**: All columns should exist with appropriate types

---

### Script 4: Verify Products Badge Column

**Purpose**: Confirm products.badge_text exists

**Precheck Query**:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'badge_text';
```

**Expected Effect**: Returns badge_text column

---

### Script 5: Create Storage Bucket for Payment Proofs (If Missing)

**Purpose**: Create storage bucket for GCash receipts if not exists

**Precheck Query**:
```sql
SELECT id, name
FROM storage.buckets
WHERE name = 'payment-proofs';
```

**Safe SQL** (only if missing):
```sql
-- Requires storage admin privileges
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  gen_random_uuid(),
  'payment-proofs', 
  false, 
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);
```

**Expected Effect**: Creates bucket for storing payment receipts

---

## 12. Repo vs Live DB Alignment Status

### Summary Table

| Feature | Repo Status | Live DB Status | Aligned? |
|---------|-------------|----------------|----------|
| orders table | ❌ Missing types | ✅ Exists | **NO** |
| order_items table | ❌ Missing types | ✅ Exists | **NO** |
| payments table | ❌ Missing types | ✅ Exists | **NO** |
| products table | ❌ Missing types | ✅ Exists | **NO** |
| offers table | ❌ Missing types | ✅ Exists | **NO** |
| offer_products table | ❌ Missing types | ✅ Exists | **NO** |
| printing_requests table | ❌ Missing types | ✅ Exists | **NO** |
| checkout UI | ❌ Missing | N/A | N/A |
| order admin UI | ❌ Missing | N/A | N/A |
| printing admin UI | ❌ Missing | N/A | N/A |

### Overall Assessment

**The repository is NOT aligned with the live database for commerce features.**

- Live DB has full schema support for commerce
- Repo has ZERO implementation of commerce features
- This is not a reconciliation task - it's a **new feature implementation** task

### Required to Achieve Alignment

**Phase 1: Database Types** (1-2 hours)
- Update `src/types/database.ts` with all commerce tables
- Verify enum types match live DB

**Phase 2: Core Commerce Features** (2-3 days)
- Product catalog pages
- Shopping cart functionality
- Checkout flow
- Order creation actions

**Phase 3: Payment Features** (1-2 days)
- GCash validation
- Credit payment support
- Payment proof upload
- Payment verification admin

**Phase 4: Admin Features** (1-2 days)
- Orders management
- Printing management
- Debtor tracking

**Phase 5: Integration** (1 day)
- Testing
- Bug fixes
- Polish

**Total estimated effort: 5-8 days for full commerce implementation**

---

## 13. Recommendations

### Immediate Actions:

1. **Accept that this is new development, not restoration**
   - No code was "lost" - it was never written
   - Design from scratch using live DB as schema guide

2. **Start with database types**
   - Update `database.ts` first to enable type-safe development
   - Query live DB for exact column types

3. **Implement incrementally**
   - Start with product catalog (view products)
   - Add checkout with cash only
   - Add GCash support
   - Add credit support
   - Add admin features

4. **Verify storage setup**
   - Check if payment-proofs bucket exists
   - Set up RLS policies for file access

5. **Consider if commerce is actually needed**
   - If not, remove commerce tables from live DB
   - If yes, prioritize implementation

---

## 14. Files That Would Need Creation

### Database Types
- `src/types/database.ts` - Add commerce table types

### Routes
- `src/app/(commerce)/products/page.tsx`
- `src/app/(commerce)/products/[productId]/page.tsx`
- `src/app/(commerce)/checkout/page.tsx`
- `src/app/(commerce)/checkout/CheckoutClient.tsx`
- `src/app/(commerce)/order/success/[code]/page.tsx`
- `src/app/(church)/c/[churchSlug]/office/orders/page.tsx`
- `src/app/(church)/c/[churchSlug]/office/orders/OrdersClient.tsx`
- `src/app/(church)/c/[churchSlug]/office/printing/page.tsx`
- `src/app/(church)/c/[churchSlug]/office/printing/PrintingAdminClient.tsx`

### Features
- `src/features/commerce/actions.ts` - Order/payment creation
- `src/features/commerce/queries.ts` - Product/order queries
- `src/features/commerce/types.ts` - Commerce type definitions
- `src/features/commerce/validation.ts` - Checkout validation
- `src/features/printing/actions.ts` - Printing request actions
- `src/features/printing/queries.ts` - Printing queries
- `src/features/debtors/queries.ts` - Debtor tracking

### Components
- `src/features/commerce/components/ProductCard.tsx`
- `src/features/commerce/components/CartSummary.tsx`
- `src/features/commerce/components/PaymentMethodSelector.tsx`
- `src/features/commerce/components/GCashFields.tsx`
- `src/features/commerce/components/CreditNotice.tsx`
- `src/features/printing/components/PrintingRequestCard.tsx`
- `src/features/printing/components/PdfViewer.tsx`

---

## Conclusion

The task as described ("restore" credit system, "fix" GCash validation, "add" print button) cannot be completed as stated because the underlying commerce infrastructure does not exist in the repository.

**The actual work required is:**
1. Update TypeScript database types to match live schema
2. Implement full commerce module from scratch
3. Build checkout with cash, GCash, and credit support
4. Build admin interfaces for orders and printing

This is a **5-8 day implementation task**, not a reconciliation/fix task.
