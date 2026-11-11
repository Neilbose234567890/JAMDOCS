import paramiko
import sys
import io

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
    if out: print(out[:2000])
    if err: print(f"ERR: {err[:1000]}")
    return exit_status

run("echo '=== Local check ===' && curl -s -o /dev/null -w 'HTTP %{http_code}' http://localhost/")
run("echo '=== Nginx active ===' && systemctl is-active nginx")
run("echo '=== Uptime ===' && uptime")
run("echo '=== Firewall ===' && ufw status 2>/dev/null || echo 'ufw not active'")
run("echo '=== Listening ports ===' && ss -tlnp | grep -E ':(80|443|3000)'")
run("echo '=== Public IP check ===' && curl -s ifconfig.me")

ssh.close()