# DigitalOcean Setup Guide

This guide will help you set up automated inventory syncing on a DigitalOcean droplet.

## Step 1: Create a Droplet

1. Log in to [DigitalOcean](https://cloud.digitalocean.com)
2. Click **Create** → **Droplets**
3. Choose settings:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic
   - **CPU**: Regular (1 GB RAM / $6/month is plenty)
   - **Datacenter**: Choose closest to you
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: `inventory-sync-server`
4. Click **Create Droplet**
5. Wait 1-2 minutes for it to be created
6. Copy the IP address shown

## Step 2: Connect to Your Droplet

### Using SSH (Mac/Linux or Windows with WSL):
```bash
ssh root@YOUR_DROPLET_IP
```

### Using PuTTY (Windows):
1. Download [PuTTY](https://www.putty.org/)
2. Enter your droplet IP
3. Click Open
4. Login as `root` with your password

## Step 3: Run the Setup Script

Once connected to your droplet, run these commands:

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/WhiteCoatMD/portablebuildings/master/setup-digitalocean.sh
chmod +x setup-digitalocean.sh
./setup-digitalocean.sh
```

This will take 5-10 minutes and will install:
- Node.js
- Git
- Your repository
- Playwright browser
- PM2 process manager

## Step 4: Configure Your Credentials

After setup completes, edit the environment file:

```bash
cd ~/portable_buildings
nano .env
```

Update these values:
```
GPB_USERNAME=your_actual_email@example.com
GPB_PASSWORD=your_actual_password
SITE_URL=https://buytheshed.com
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

## Step 5: Start the Sync Scheduler

```bash
# Start the scheduler
pm2 start npm --name inventory-sync -- run schedule

# Save the PM2 process list
pm2 save

# Set up auto-start on reboot
pm2 startup
# Copy and run the command it gives you
```

## Step 6: Verify It's Working

```bash
# Check status
pm2 status

# View logs
pm2 logs inventory-sync

# Run a manual sync to test
npm run sync
```

## Useful Commands

### View Logs
```bash
pm2 logs inventory-sync          # Live logs
pm2 logs inventory-sync --lines 100  # Last 100 lines
```

### Restart Sync
```bash
pm2 restart inventory-sync
```

### Stop Sync
```bash
pm2 stop inventory-sync
```

### Check Sync Status
```bash
pm2 status
```

### Update Code
```bash
cd ~/portable_buildings
git pull
npm install
pm2 restart inventory-sync
```

### Test Sync Manually
```bash
cd ~/portable_buildings
npm run sync
```

## Troubleshooting

### Sync Not Running
```bash
pm2 status  # Check if process is running
pm2 logs inventory-sync  # Check for errors
```

### Update Credentials
```bash
cd ~/portable_buildings
nano .env  # Edit credentials
pm2 restart inventory-sync  # Restart with new credentials
```

### Browser Issues
```bash
cd ~/portable_buildings
npx playwright install chromium --with-deps
pm2 restart inventory-sync
```

## Security Notes

1. **Firewall**: DigitalOcean droplets are exposed to the internet. Consider setting up a firewall:
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

2. **SSH Key**: Use SSH keys instead of passwords for better security

3. **Updates**: Keep your system updated:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

## Cost

- **Basic Droplet (1 GB RAM)**: $6/month
- **Basic Droplet (512 MB RAM)**: $4/month (might work for light usage)

You can check your usage and resize if needed from the DigitalOcean dashboard.

## Support

If you run into issues:
1. Check the logs: `pm2 logs inventory-sync`
2. Test manually: `npm run sync`
3. Check the GitHub repository issues

---

**That's it!** Your inventory will now sync automatically every day at 2 AM.
