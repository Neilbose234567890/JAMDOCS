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

run("echo '=== Site status ===' && curl -s -o /dev/null -w '%{http_code}' http://localhost/")
run("echo '=== Git status ===' && cd /root/JAMDOCS && git status 2>&1")
run("echo '=== SSH key ===' && cat /root/.ssh/id_ed25519.pub")
run("echo '=== Webhook server ===' && ps aux | grep -i webhook")
run("echo '=== Nginx config ===' && cat /etc/nginx/sites-enabled/default")

ssh.close()