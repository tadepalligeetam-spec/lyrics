# How to Enable Firestore Database

To make your website work, you need to enable the database in the Firebase Console. Follow these steps:

1.  **Go to Firebase Console**
    *   Visit [console.firebase.google.com](https://console.firebase.google.com)
    *   Click on your project **`lyrics-840cc`**.

2.  **Create Database**
    *   In the left sidebar, click on **Build** -> **Firestore Database**.
    *   Click the **Create Database** button.

3.  **Select Location**
    *   Leave the default location (or choose one close to you).
    *   Click **Next**.

4.  **Set Security Rules (Important)**
    *   Choose **Start in Test Mode**.
    *   *Why?* This allows anyone with your API key (your website) to read and write data immediately without authentication setup.
    *   Click **Create** or **Enable**.

5.  **Verify Rules**
    *   Once the database is created, go to the **Rules** tab at the top.
    *   Ensure your rules look like this:
    ```
    allow read, write: if true;
    ```
    *   Or specifically for test mode (often with a timestamp):
    ```
    allow read, write: if request.time < timestamp.date(2025, 12, 30);
    ```

6.  **Done!**
    *   Refresh your website. You should now be able to add songs from the Admin Panel and see them on the Home Page.
