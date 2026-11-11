import paramiko
import sys
import io

# Fix stdout encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

host = "194.195.116.170"
user = "root"
password = "@Ciscotest1234$"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=10)

def run(cmd):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out[:3000])
    if err: print(f"ERR: {err[:1000]}")
    return exit_status

DOMAIN = "jamhardware.com"

# Step 1: Update Nginx config for the domain
nginx_conf = f"""server {{
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};
    root /var/www/jamdocs;
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {{
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }}
}}"""

run("cat > /etc/nginx/sites-available/jamdocs << 'NGINX_EOF'\n" + nginx_conf + "\nNGINX_EOF")
run("ln -sf /etc/nginx/sites-available/jamdocs /etc/nginx/sites-enabled/default")
run("nginx -t && systemctl reload nginx")

# Step 2: Install Certbot for SSL
run("apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx 2>&1 | tail -5")

# Step 3: Set up auto-deploy webhook
deploy_script = """#!/bin/bash
cd /root/JAMDOCS
git pull origin main
npm install
npm run build
rm -rf /var/www/jamdocs/*
cp -r dist/* /var/www/jamdocs/
systemctl reload nginx
echo "Deploy complete at $(date)"
"""

run("cat > /root/deploy.sh << 'DEPLOY_EOF'\n" + deploy_script + "\nDEPLOY_EOF")
run("chmod +x /root/deploy.sh")

# Step 4: Create webhook server
webhook_server = """const http = require('http');
const { exec } = require('child_process');

const PORT = 3000;

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('Webhook received:', new Date().toISOString());
                
                exec('/root/deploy.sh', (error, stdout, stderr) => {
                    if (error) {
                        console.error('Deploy error:', error.message);
                        res.writeHead(500);
                        res.end('Deploy failed');
                        return;
                    }
                    console.log('Deploy output:', stdout);
                    res.writeHead(200);
                    res.end('Deploy successful');
                });
            } catch (e) {
                console.error('Parse error:', e.message);
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('Webhook server running on port ' + PORT);
});
"""

run("cat > /root/webhook-server.js << 'WEBHOOK_EOF'\n" + webhook_server + "\nWEBHOOK_EOF")

# Step 5: Create systemd service
webhook_service = """[Unit]
Description=GitHub Webhook Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/bin/node /root/webhook-server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""

run("cat > /etc/systemd/system/webhook.service << 'SERVICE_EOF'\n" + webhook_service + "\nSERVICE_EOF")
run("systemctl daemon-reload")
run("systemctl enable webhook 2>&1")
run("systemctl restart webhook 2>&1")
run("systemctl is-active webhook 2>&1")

# Step 6: Test the webhook
run("curl -s -X POST http://localhost:3000/webhook -H 'Content-Type: application/json' -d '{\"test\": true}' 2>&1")

print("\n\n=== SETUP COMPLETE ===")
print(f"Domain: {DOMAIN}")
print(f"Server IP: {host}")
print(f"Site: http://{host}/")
print(f"Webhook: http://{host}:3000/webhook")
print(f"\nNext steps:")
print(f"1. Add SSH key to GitHub: https://github.com/settings/keys")
print(f"   Key: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJQkvO0ijlnsAqwF2invO1Nwl+VzVzUd1U4xgFSWQNrD root@localhost")
print(f"2. Point jamhardware.com DNS A record to {host}")
print(f"3. Run: certbot --nginx -d {DOMAIN} -d www.{DOMAIN}")
print(f"4. Push code to GitHub repo: Neilbose234567890/JAMDOCS")

ssh.close()