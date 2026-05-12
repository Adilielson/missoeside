UPDATE profiles 
SET role = 'admin', 
    permissions = '{"projects", "events", "posts", "team", "users"}' 
WHERE email = 'eltoncalixto7@gmail.com';