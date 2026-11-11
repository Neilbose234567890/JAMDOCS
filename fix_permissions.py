import paramiko
import sys

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
    if out: print(out)
    if err: print(f"ERR: {err}")
    return exit_status

# Fix permissions - move dist to a more accessible location
run("mkdir -p /var/www/jamdocs")
run("cp -r /root/JAMDOCS/dist/* /var/www/jamdocs/")
run("chown -R www-data:www-data /var/www/jamdocs")
run("chmod -R 755 /var/www/jamdocs")

# Update nginx config to use /var/www/jamdocs
nginx_conf = """server {
    listen 80;
    server_name _;
    root /var/www/jamdocs;
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

# Test
run("su -s /bin/bash -c 'cat /var/www/jamdocs/index.html | head -5' www-data 2>&1")

print("\n=== Testing site ===")
import urllib.request
try:
    resp = urllib.request.urlopen("http://194.195.116.170/", timeout=10)
    print(f"Status: {resp.status}")
    print(f"Content: {resp.read()[:200]}")
except Exception as e:
    print(f"Error: {e}")

ssh.close()