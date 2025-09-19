CREATE DATABASE IF NOT EXISTS secure_vault;
CREATE USER IF NOT EXISTS 'vault_user'@'%' IDENTIFIED BY 'vault_password';
GRANT ALL PRIVILEGES ON secure_vault.* TO 'vault_user'@'%';
FLUSH PRIVILEGES;
