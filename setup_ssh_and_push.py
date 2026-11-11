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
    if out: print(out[:3000])
    if err: print(f"ERR: {err[:1000]}")
    return exit_status

# Generate SSH key
run("mkdir -p /root/.ssh")
run("ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519 -N '' -q")
run("cat /root/.ssh/id_ed25519.pub")

print("\n\n=== Copy the above SSH public key and add it to GitHub ===")
print("Go to: https://github.com/settings/keys")
print("Click 'New SSH Key' and paste the key above")
print("Then run the push command again")

ssh.close()