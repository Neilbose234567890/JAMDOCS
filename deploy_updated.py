import paramiko, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
host = '194.195.116.170'; user = 'root'; pw = '@Ciscotest1234$'

print('Connecting...')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pw, timeout=30)
sftp = ssh.open_sftp()

src_root = r'c:\Document Projects\OCR DOC'
server_root = '/root/JAMDOCS'

relative_paths = [
    'index.html', 'package.json', 'package-lock.json', 'vite.config.js', '.env',
    'src/App.jsx', 'src/App.css', 'src/index.css', 'src/main.jsx',
    'src/components/AdminDashboard.jsx', 'src/components/UserDashboard.jsx',
    'src/components/LoginScreen.jsx', 'src/components/Sidebar.jsx',
    'src/components/debug.json',
    'src/assets/logo.jpg', 'src/assets/react.svg', 'src/assets/vite.svg',
    'src/utils/mockData.js', 'src/utils/usersData.js', 'src/utils/docCategories.js',
    'src/utils/entityFields.js', 'src/utils/ocrScanner.js',
    'public/favicon.svg', 'public/icons.svg', 'public/manifest.json',
]

print(f'Uploading {len(relative_paths)} files...')
for relpath in relative_paths:
    local_path = os.path.join(src_root, relpath)
    remote_path = os.path.join(server_root, relpath).replace('\\', '/')
    remote_dir = os.path.dirname(remote_path)
    try:
        sftp.stat(remote_dir)
    except:
        stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {remote_dir}')
        stdout.channel.recv_exit_status()
    try:
        sftp.put(local_path, remote_path)
        print(f'  OK: {relpath}')
    except Exception as e:
        print(f'  FAIL: {relpath} - {e}')

sftp.close()
print('\nUpload complete. Building on server...')

stdin, stdout, stderr = ssh.exec_command('cd /root/JAMDOCS && npm install 2>&1 | tail -3')
out = stdout.read().decode(errors='replace')
err = stderr.read().decode(errors='replace')
if out: print(out[-300:])
if err: print(f'ERR: {err[-300:]}')

stdin, stdout, stderr = ssh.exec_command('cd /root/JAMDOCS && npm run build 2>&1')
out = stdout.read().decode(errors='replace')
err = stderr.read().decode(errors='replace')
if out: print(out[-500:])
if err: print(f'ERR: {err[-300:]}')

stdin, stdout, stderr = ssh.exec_command('rm -rf /var/www/jamdocs/* && cp -r /root/JAMDOCS/dist/* /var/www/jamdocs/ && chown -R www-data:www-data /var/www/jamdocs && chmod -R 755 /var/www/jamdocs && systemctl reload nginx || systemctl restart nginx')
out = stdout.read().decode(errors='replace')
err = stderr.read().decode(errors='replace')
if out: print(out)
if err: print(f'ERR: {err}')

ssh.close()
print('Deployment complete!')