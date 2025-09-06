# Upload Functionality Debug Guide

## Current Issue
The consultation photo upload is not working in the profile page. Users can select concerns and add notes, but clicking "Upload Consultation Photo" doesn't work.

## Debug Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Try uploading a photo
   - Look for any JavaScript errors

2. **Check Network Tab**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Try uploading a photo
   - Check if the request is being made to `/api/upload/skin-photo`
   - Check response status and error messages

3. **Check Server Logs**
   - Look at the terminal running the server
   - Check for any upload-related errors

## Common Issues & Solutions

### Issue 1: File Input Not Triggering
**Symptoms**: Button click doesn't open file dialog
**Solution**: Check if `consultationFileInputRef` is properly attached

### Issue 2: Upload Request Fails
**Symptoms**: File selected but upload fails
**Solutions**:
- Check authentication token in localStorage
- Verify server is running on port 5000
- Check CORS configuration

### Issue 3: File Size/Type Restrictions
**Symptoms**: Upload rejected with error message
**Solutions**:
- Ensure file is under 10MB
- Use supported formats: JPG, PNG, WebP
- Select at least one concern before uploading

## Quick Fixes to Try

1. **Refresh the page** and try again
2. **Log out and log back in** to refresh authentication
3. **Clear browser cache** and reload
4. **Check if server is running** - go to http://localhost:5000 in browser

## Technical Details

### Upload Endpoint
- URL: `POST /api/upload/skin-photo`
- Authentication: Required (Bearer token)
- Content-Type: `multipart/form-data`
- File field: `photo`

### File Validation
- Max size: 10MB
- Allowed types: image/jpeg, image/png, image/webp
- Requires at least one concern selected

### Expected Response
```json
{
  "message": "Consultation photo uploaded successfully",
  "photoUrl": "http://localhost:5000/uploads/consultation/photo-123456789.jpg",
  "filename": "photo-123456789.jpg"
}
```

## If All Else Fails
1. Check server logs for detailed error messages
2. Test with a smaller image file (under 1MB)
3. Try uploading profile photo first to test if upload system works
4. Contact developer with browser console errors
