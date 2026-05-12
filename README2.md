# CV TECH - Backend Maintenance Guide (README2)

This guide explains how to manage project assets (ZIP files, images) and update system configurations.

## 1. How to Add a New Project Asset

To add a project to the marketplace, you need two things:
1. The **ZIP file** uploaded to your AWS S3 bucket.
2. The **Project Record** saved in your MongoDB database.

### Step A: Upload the ZIP to AWS S3
1. Log in to your [AWS S3 Console](https://s3.console.aws.amazon.com/).
2. Open the bucket: `cvtech-projects-storage-india`.
3. Upload your project ZIP file (e.g., `ecommerce-monolith.zip`).
4. **Copy the "Key"** (the filename) of the uploaded file. You will need this for the next step.

### Step B: Add the Project to the Database
Run the helper script from the `backend` folder:

```bash
# Template:
node scripts/addProject.js "Title" "Description" Price "Category" "Tech1,Tech2" "Difficulty" "S3-ZIP-KEY" "ImageURL1,ImageURL2"

# Example:
node scripts/addProject.js "Modern E-commerce Core" "A full-scale React and Node.js marketplace template." 59.99 "Web App" "React,Node.js,MongoDB" "Intermediate" "ecommerce-monolith.zip" "https://example.com/img1.jpg"
```

---

## 2. Updating Environment Keys (.env)

If you need to change your Database, AWS, or Razorpay keys in the future:

1.  Open the `.env` file in the `backend` folder.
2.  Update the relevant values:
    *   **MongoDB**: `MONGO_URI`
    *   **Razorpay**: `RAZORPAY_KEY_ID` and `RAZORPAY_SECRET`
    *   **AWS**: `AWS_ACCESS_KEY` and `AWS_SECRET_KEY`
3.  **Restart the server** for changes to take effect:
    ```bash
    # In the root folder
    npm run dev
    ```

---

## 3. Possible Errors & Solutions

| Error | Cause | Solution |
| :--- | :--- | :--- |
| `MongoDB Connection Failed` | IP not whitelisted or wrong URI. | Check MongoDB Atlas "Network Access" and ensure your IP is added. |
| `S3 Signature Error` | Wrong AWS Keys or Bucket name. | Double check `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` in `.env`. |
| `Razorpay Signature mismatch` | Wrong Razorpay Secret. | Ensure `RAZORPAY_SECRET` in `.env` matches your Razorpay Dashboard. |
| `413 Payload Too Large` | Image/JSON too big. | The server limit is set to 10MB. Reduce file size if possible. |
| `UnauthorizedAccess (npm)` | PowerShell Security. | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`. |

---

## 4. Maintenance Commands

*   **Seed Admin User**: `node seedAdmin.js` (Creates the default admin if missing).
*   **Test DB Connection**: `node test_conn.js`
*   **Clear Logs**: Delete files inside the `backend/logs/` directory.

---
*CV TECH Architectural OS © 2024*
