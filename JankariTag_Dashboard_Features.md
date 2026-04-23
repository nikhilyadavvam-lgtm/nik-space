# JankariTag Admin Dashboard Features

This document outlines the administrative features available in the JankariTag (EventWisher) system, based on the `admin.routes.js` and `admin-secret` dashboard implementation.

## 1. Operational Intelligence (Dashboard Stats)
The dashboard provides a real-time high-level overview of the platform's health:
- **Active Tags**: Total number of QR tags registered in the system.
- **Total Members**: Count of registered users.
- **Paid Orders**: Number of successful transactions for physical tags.
- **Revenue Tracker**: Total revenue generated from sales (₹).
- **Sticker Volume**: Total count of stickers ordered.
- **Live QR Codes**: Count of tags with generated images.
- **Shop Partners**: Number of active shopkeeper accounts.

## 2. Asset & Tag Registry
- **Complete Inventory**: A searchable list of every tag in the database.
- **Custom ID Filtering**: Quick search by Tag ID (e.g., #BLK-XXXX).
- **Metadata Status**: Visual indicator of whether the QR image and Card image are synchronized on Cloudinary.
- **Deep Link Access**: One-click navigation to the public data view of any tag.
- **Tag Deletion**: Ability to permanently remove assets from the registry.

## 3. Bulk QR & Retail Management
This is the "factory" section for managing physical distribution:
- **Direct Assignment Generation**: 
    - Create tags directly for a specific user email.
    - Specialized asset profiles: Water Coolers, Vehicles, Shops, Personal Items, etc.
    - Pre-fill maintenance data (TDS, Cleaner Name, Filter Change Dates) or Business info (Timings, Description).
- **Auto-Generate Retail QRs (Method 1)**:
    - Generate unassigned tags with unique **Passcodes**.
    - Instant CSV/Excel download for printing and manufacturing.
- **Seamless Email Assignment (Method 2)**:
    - Manually link an unassigned retail tag to a customer's email after purchase.

## 4. Order & Fulfillment System
- **Physical Order Tracking**: Manage orders for physical "JTags".
- **Status Workflow**: Update order states from `Processing` → `Shipped` → `Delivered` (or `Cancelled`).
- **Customer Metadata**: View shipping addresses, contact details, and associated Tag IDs for each order.

## 5. Shopkeeper & Partner Ecosystem
- **Partner Directory**: List of all users with the "shopkeeper" role.
- **Approval System**: Grant or revoke shopkeeper privileges.
- **Performance Metrics**:
    - Sales volume per partner.
    - Commission tracking (Total, Paid, Pending).
    - Referral count for each shopkeeper.
- **Commission Management**: Update commission payment status from `Pending` to `Paid` with custom payment notes.

## 6. Promotion & Pricing Control
- **Global Settings**:
    - Update **Tag Price** (e.g., ₹100).
    - Update **Sticker Price Text** (marketing copy).
    - **Messaging Channel Selector**: Toggle between `WhatsApp` and `HTTP SMS` for system notifications.
- **Coupon Factory**:
    - Create unique coupon codes (e.g., SAVE50).
    - Set **Max Uses** and **Discount Percent**.
    - Delete active promotions.

## 7. Security & Access
- **Admin Secret Entry**: Protected by a dedicated admin login system with rate limiting (5 attempts per 15 min).
- **Session Control**: Token-based authentication (JWT) with "Terminate Session" (Logout) capability.
- **Role Verification**: Strict middleware ensures only authorized Admins or Shopkeepers (where applicable) can hit these endpoints.
