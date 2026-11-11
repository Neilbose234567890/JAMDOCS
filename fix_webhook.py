import paramiko

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

# Kill any process on port 3000
run("fuser -k 3000/tcp 2>/dev/null || true")
run("sleep 1")

# Restart webhook
run("systemctl restart webhook 2>&1")
run("sleep 2")
run("systemctl is-active webhook 2>&1")

# Test webhook
run("curl -s -X POST http://localhost:3000/webhook -H 'Content-Type: application/json' -d '{\"test\": true}' 2>&1")

# Test site
run("curl -s -o /dev/null -w 'Site HTTP: %{http_code}\n' http://localhost/")

ssh.close()