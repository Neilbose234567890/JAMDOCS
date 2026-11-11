import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.195.116.170', username='root', password='@Ciscotest1234$', timeout=10)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(f"$ {cmd}")
    if out: print(out[:2000])
    if err: print(f"ERR: {err[:500]}")
    print("---")

run("ls -la /root/JAMDOCS/dist/")
run("cat /etc/nginx/sites-enabled/default")
run("cat /var/log/nginx/error.log | tail -30")
run("ls -la /root/JAMDOCS/dist/index.html")
run("cat /root/JAMDOCS/dist/index.html | head -20")

ssh.close()