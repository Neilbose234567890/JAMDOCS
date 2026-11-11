import paramiko
import os
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

host = "194.195.116.170"
user = "root"
password = "@Ciscotest1234$"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

sftp = ssh.open_sftp()

def run(cmd):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out[:1000])
    if err: print(f"ERR: {err[:500]}")
    return exit_status

# Step 3: Build the project
print("="*60)
print("STEP 3: Building the project")
print("="*60)
run("cd /root/JAMDOCS && npm run build 2>&1")

# Step 4: Configure Nginx
print("\n" + "="*60)
print("STEP 4: Configuring Nginx")
print("="*60)
nginx_conf = """server {
    listen 80;
    server_name _;
    root /root/JAMDOCS/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}"""

stdin, stdout, stderr = ssh.exec_command("tee /etc/nginx/sites-available/jamdocs > /dev/null")
stdin.write(nginx_conf)
stdin.flush()
stdin.channel.shutdown_write()
stdout.channel.recv_exit_status()

run("ln -sf /etc/nginx/sites-available/jamdocs /etc/nginx/sites-enabled/default")
run("nginx -t")
run("systemctl restart nginx")

# Step 4b: Copy build to web directory and set permissions
print("\n" + "="*60)
print("STEP 4b: Copying to web directory")
print("="*60)
run("rm -rf /var/www/jamdocs/*")
run("cp -r /root/JAMDOCS/dist/* /var/www/jamdocs/")
run("chown -R www-data:www-data /var/www/jamdocs")
run("chmod -R 755 /var/www/jamdocs")

# Step 5: Set up auto-deploy webhook
print("\n" + "="*60)
print("STEP 5: Setting up auto-deploy webhook")
print("="*60)

deploy_script = """#!/bin/bash
cd /root/JAMDOCS
git pull origin main 2>/dev/null || echo "No git repo, skipping pull"
npm install 2>&1
npm run build 2>&1
rm -rf /var/www/jamdocs/*
cp -r dist/* /var/www/jamdocs/
chown -R www-data:www-data /var/www/jamdocs
chmod -R 755 /var/www/jamdocs
systemctl reload nginx || systemctl restart nginx
echo "Deployment complete!"
"""
stdin, stdout, stderr = ssh.exec_command("tee /root/deploy.sh > /dev/null")
stdin.write(deploy_script)
stdin.flush()
stdin.channel.shutdown_write()
stdout.channel.recv_exit_status()
run("chmod +x /root/deploy.sh")

# Create webhook server
webhook_code = """const http = require('http');
const { exec } = require('child_process');
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/deploy') {
        console.log('Deploy triggered!');
        exec('bash /root/deploy.sh', (err, stdout, stderr) => {
            if (err) { res.writeHead(500); res.end('Failed'); return; }
            res.writeHead(200); res.end('OK');
        });
    } else {
        res.writeHead(404); res.end('Not found');
    }
});
server.listen(3000, '127.0.0.1', () => console.log('Webhook on :3000'));
"""
stdin, stdout, stderr = ssh.exec_command("tee /root/webhook-server.js > /dev/null")
stdin.write(webhook_code)
stdin.flush()
stdin.channel.shutdown_write()
stdout.channel.recv_exit_status()

run("npm install -g pm2 -q 2>/dev/null")
run("pm2 start /root/webhook-server.js --name webhook 2>/dev/null")
run("pm2 save 2>/dev/null")

# Step 6: Configure firewall
print("\n" + "="*60)
print("STEP 6: Configuring firewall")
print("="*60)
run("ufw allow 80/tcp 2>/dev/null")
run("ufw allow 22/tcp 2>/dev/null")
run("ufw --force enable 2>/dev/null")

print("\n" + "="*60)
print("DEPLOYMENT COMPLETE!")
print("="*60)
print(f"Site: http://194.195.116.170")
print(f"Webhook: POST http://194.195.116.170:3000/deploy")

sftp.close()
ssh.close()