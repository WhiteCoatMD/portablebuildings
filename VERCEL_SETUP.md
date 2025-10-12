# Vercel Blob Storage Setup

This project uses Vercel Blob Storage to store building images uploaded via the admin panel.

## Setup Instructions

### 1. Connect Blob Storage to Your Vercel Project

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your `portablebuildings` project
3. Click on the **Storage** tab
4. You should see your `gracelandbuildings` Blob store already created
5. Click on it to view the settings

### 2. Get Your Blob Storage Token

1. In the Blob store settings, you'll see a section called "Environment Variables"
2. Copy the `BLOB_READ_WRITE_TOKEN` value
3. It should look something like: `vercel_blob_rw_AbCdEfGh123456...`

### 3. Add Token to Vercel Project

The token should already be added to your Vercel project automatically when you created the Blob store. To verify:

1. Go to your project settings in Vercel
2. Click on **Environment Variables**
3. Look for `BLOB_READ_WRITE_TOKEN`
4. If it's missing, add it with the value you copied above

### 4. Local Development (Optional)

If you want to test image uploads locally:

1. Copy `.env.example` to `.env`
2. Add your `BLOB_READ_WRITE_TOKEN` to the `.env` file
3. Install dependencies: `npm install`
4. Run a local dev server (you'll need vercel dev or similar)

## How It Works

- **Upload**: Images are uploaded to `/api/upload-image` which stores them in Vercel Blob
- **Retrieve**: Images are fetched from `/api/images?serialNumber=XXX`
- **Delete**: Images are deleted via `/api/images` with DELETE method
- **Storage Path**: `buildings/{serialNumber}/{timestamp}-{filename}`
- **Access**: All images are public (accessible via their URL)

## Image Specifications

- **Max images per building**: 5
- **Automatic processing**:
  - HEIC files are automatically converted to JPEG
  - All images are resized to max 800px on longest side
  - Quality: 70% JPEG compression
- **Supported formats**: HEIC, JPEG, PNG, WebP (all converted to JPEG)

## Troubleshooting

### Images not uploading
- Check browser console for errors
- Verify `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables
- Ensure the blob store name is `gracelandbuildings`

### Images not displaying
- Check if the API routes are deployed (`/api/images`, `/api/upload-image`)
- Verify blob URLs are accessible (should be `https://...blob.vercel-storage.com/...`)
- Check browser network tab for failed requests

### API errors
- View Vercel function logs in the dashboard
- Check that the `@vercel/blob` package is installed
- Ensure API routes are using ES modules (import/export syntax)
