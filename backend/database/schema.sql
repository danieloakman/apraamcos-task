CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    date_of_birth DATE,
    phone_number TEXT,
    
    -- Address section
    post_address TEXT,
    home_address TEXT,
    
    -- Banking section
    bank_name TEXT,
    bsb TEXT,
    account_name TEXT,
    account_number TEXT,
    
    -- Social links section
    facebook_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;