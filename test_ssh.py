import paramiko
import sys

host = "194.195.116.170"
user = "root"
password = "@Ciscotest1234$"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    client.connect(host, username=user, password=password, timeout=10)
    stdin, stdout, stderr = client.exec_command("echo 'SUCCESS'; hostname; cat /etc/os-release | head -3")
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print("STDERR:", err)
    print("SSH connection to Linode successful!")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
finally:
    client.close()