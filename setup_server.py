import paramiko
import time

host = "194.195.116.170"
user = "root"
password = "@Ciscotest1234$"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=10)

def run(cmd):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print(f"STDERR: {err}")
    return exit_status

print("=== Step 1: Update system ===")
run("apt-get update -qq && apt-get upgrade -y -qq")

print("\n=== Step 2: Install Node.js 20 ===")
run("curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
run("apt-get install -y nodejs -qq")
run("node --version && npm --version")

print("\n=== Step 3: Install Nginx ===")
run("apt-get install -y nginx -qq")
run("nginx -v")

print("\n=== Step 4: Install PM2 (process manager) ===")
run("npm install -g pm2 -q")

print("\n=== Step 5: Clone the repo ===")
run("cd /root && rm -rf JAMDOCS")
run("git clone https://github.com/Neilbose234567890/JAMDOCS.git")
run("cd /root/JAMDOCS && npm install --production=false")

print("\n=== Step 6: Build the project ===")
run("cd /root/JAMDOCS && npm run build")

print("\n=== Step 7: Configure Nginx ===")
nginx_conf = """
server {
    listen 80;
    server_name _;
    root /root/JAMDOCS/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
"""
# Write nginx config
stdin, stdout, stderr = client.exec_command("cat > /etc/nginx/sites-available/jamdocs << 'EOF'")
stdin.write(nginx_conf)
stdin.flush()
stdin.channel.shutdown_write()
exit_status = stdout.channel.recv_exit_status()
print(stdout.read().decode())

run("ln -sf /etc/nginx/sites-available/jamdocs /etc/nginx/sites-enabled/default")
run("nginx -t && systemctl restart nginx")

print("\n=== Step 8: Set up auto-deploy webhook ===")
# Create a deploy script
deploy_script = """#!/bin/bash
cd /root/JAMDOCS
git pull origin main
npm install
npm run build
systemctl restart nginx
echo "Deployment complete!"
"""
stdin, stdout, stderr = client.exec_command("cat > /root/deploy.sh << 'EOF'")
stdin.write(deploy_script)
stdin.flush()
stdin.channel.shutdown_write()
exit_status = stdout.channel.recv_exit_status()

run("chmod +x /root/deploy.sh")

# Create a simple webhook server using Node.js
webhook_server = """
const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/deploy') {
        console.log('Deploy webhook triggered!');
        exec('bash /root/deploy.sh', (err, stdout, stderr) => {
            if (err) {
                console.error('Deploy error:', err);
                res.writeHead(500);
                res.end('Deploy failed');
                return;
            }
            console.log('Deploy output:', stdout);
            res.writeHead(200);
            res.end('Deployed successfully');
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3000, '127.0.0.1', () => {
    console.log('Webhook server listening on port 3000');
});
"""
stdin, stdout, stderr = client.exec_command("cat > /root/webhook-server.js << 'EOF'")
stdin.write(webhook_server)
stdin.flush()
stdin.channel.shutdown_write()
exit_status = stdout.channel.recv_exit_status()

# Start webhook server with PM2
run("pm2 start /root/webhook-server.js --name webhook")
run("pm2 save")
run("pm2 startup systemd -u root --hp /root")

print("\n=== Step 9: Configure firewall ===")
run("ufw allow 80/tcp")
run("ufw allow 22/tcp")
run("ufw --force enable")

print("\n=== DEPLOYMENT COMPLETE! ===")
print("Site should be live at: http://194.195.116.170")
print("Auto-deploy webhook: POST http://194.195.116.170:3000/deploy")

client.close()