# SkinBloom Upload Fix - Quick Test Guide

## Test Account Details
- **Email**: test@test.com
- **Password**: test123

## How to Test Upload

1. **Open the application**: http://localhost:5173
2. **Login** with the test account above
3. **Go to Profile** (click on "Hi Test User" or navigate to Profile)
4. **Scroll down** to "Photos for Dermatologist Consultation"
5. **Select at least one concern** (required)
6. **Click "Upload Consultation Photo"**
7. **Select an image file** (under 10MB, JPG/PNG/WebP)

## What Should Happen
- File dialog opens when you click the button
- After selecting file, upload should start
- Success message should appear
- Photo should be added to the list below

## Debug Information
Check the browser console (F12 → Console) for detailed logs including:
- File selection details
- Upload progress
- Server responses
- Any error messages

## Server Logs
The server terminal will show detailed upload information:
- Authentication status
- File details
- Generated URLs
- Any server errors

## Common Issues & Solutions

### Issue: Button doesn't respond
- **Solution**: Refresh page and try again
- **Check**: Browser console for JavaScript errors

### Issue: "Please select at least one concern"
- **Solution**: Check at least one checkbox in the concerns section before uploading

### Issue: Upload fails with authentication error
- **Solution**: Log out and log back in to refresh your session

### Issue: File too large
- **Solution**: Use an image smaller than 10MB

### Issue: File type not supported
- **Solution**: Use JPG, PNG, or WebP format

## Server Status Check
Visit http://localhost:5000 in your browser. You should see:
```json
{"ok":true,"service":"Skinbloom API"}
```

If you see this, the server is running correctly.

## Current State
- ✅ Server running on port 5000
- ✅ Client running on port 5173
- ✅ MongoDB connected
- ✅ Upload endpoints configured
- ✅ Authentication working
- ✅ Enhanced error logging added

The upload functionality should now work correctly with detailed debugging information.
