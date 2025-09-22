Here's the information formatted into a clear and easy-to-read markdown summary.

# Hybrid Encryption Process for File Management

This document outlines the hybrid encryption process used for file handling, which combines the speed of **AES** for file encryption with the security of **RSA** for key management.

---

## File Upload (Encryption) 🔒

1.  **File Initiation:** A user uploads a file from the `frontend/src/components/Upload.js` component.
2.  **Controller Action:** The file is sent to the `upload` method in the `backend/app/Http/Controllers/FileController.php`.
3.  **AES Key Generation:** The `FileController` uses the `EncryptionService` to generate a unique, random 256-bit AES key with the `generateAESKey()` method.
4.  **File Encryption:** The file content is encrypted using the newly generated AES key via the `openssl_encrypt` function with the `AES-256-CBC` cipher, performed in the `encryptFile()` method.
5.  **Key Encryption:** The AES key itself is then encrypted using the **uploading user's public RSA key**. This is handled by the `encryptWithRSA()` method.
6.  **Storage:** The final encrypted file is stored in a designated location, and the RSA-encrypted AES key is saved in the `encrypted_key` column of the `files` table, as defined by the `File` model.

---

## File Download (Decryption) 🔑

1.  **Download Request:** A user requests a file download from the `frontend/src/components/FileList.js` component.
2.  **Controller Action:** The request is processed by the `download` method in the `backend/app/Http/Controllers/FileController.php`.
3.  **Key Retrieval & Decryption:** The `FileController` retrieves the RSA-encrypted AES key from the database. It then uses the **user's private RSA key** (stored in the `User` model) to decrypt the AES key via the `decryptWithRSA()` method.
4.  **File Decryption:** The encrypted file content is retrieved from storage and decrypted using the now-accessible AES key, which is handled in the `decryptFile()` method.
5.  **File Delivery:** The fully decrypted file content is sent back to the user for download.

---

## Why this approach?

This hybrid encryption model is a robust solution because it leverages the strengths of both algorithms:

* **Performance:** **AES** is significantly faster than RSA for encrypting large amounts of data, making it ideal for the file content itself.
* **Security:** **RSA** provides a secure way to manage and exchange the AES key, ensuring that only the intended user can decrypt the file.

This combination offers an efficient and highly secure method for handling sensitive files.