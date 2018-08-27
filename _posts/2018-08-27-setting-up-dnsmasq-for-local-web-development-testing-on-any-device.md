---
layout: post
title: Setting Up Dnsmasq For Local Web Development Testing On Any Device
category: [Linux工具]
tags: [Dnsmasq]
description: >
    First, you need to get the IP address of your machine on your local network. In OS X, the easiest place to find this is in System Preferences > Network. If you're using DHCP on your local network, you will want to make sure your computer requests the same IP address when it renews it's IP address lease.
excerpt: >
    First, you need to get the IP address of your machine on your local network. In OS X, the easiest place to find this is in System Preferences > Network. If you're using DHCP on your local network, you will want to make sure your computer requests the same IP address when it renews it's IP address lease.
---

Please note, these instructions are for OS X Lion.

First, you need to get the IP address of your machine on your local network. In OS X, the easiest place to find this is in `System Preferences > Network`. If you're using DHCP on your local network, you will want to make sure your computer requests the same IP address when it renews it's IP address lease. I recommend configuring the DCHP Reservation settings on your router to accomplish this. Otherwise, you can specify a manual address in your network settings:

1. Go to *System Preferences > Network*
1. Click *Advanced...*
1. Click the *TCP/IP* tab
1. Change the *Configure IPv4* dropdown to *Using DHCP with manual address*
1. Enter your current IP address in the textbox that appears
1. Click *Ok* then *Apply*

For the purpose of these instructions, let's assume your local network IP address is 192.168.x.x.

## Install dnsmasq

1. Go to [Downloads for Apple Developers](https://developer.apple.com/downloads/index.action) and download the most recent release of *Command Line Tools for Xcode* and install it.
1. Go to the [MacPorts install page](http://www.macports.org/install.php), then download and install the *Mac OS X Package (.pkg) Installer* for Lion.
1. In Terminal, run  
`sudo port -v selfupdate`
1. Install dnsmasq  
`sudo port install dnsmasq`

## Configure dnsmasq

1. Add the following line to /opt/local/etc/dnsmasq.conf. (Don't forget to replace the IP address.)  
`address=/.dev/192.168.x.x`  
This will point all hostnames ending with .dev at 192.168.x.x. If you'd prefer a hostname extension other than .dev, you can always edit this later and add additional lines.
1. `sudo cp /etc/resolv.conf /opt/local/etc/`

## Start dnsmasq automatically on boot

1. `sudo mkdir -p /System/Library/StartupItems/DNSMASQ`
1. Create `/System/Library/StartupItems/DNSMASQ/DNSMASQ` and fill it with the following:

```bash
    #!/bin/sh
    . /etc/rc.common
 
    if [ "${DNSMASQ}" = "-YES-" ]; then
        ConsoleMessage "Starting DNSMASQ"
        /opt/local/sbin/dnsmasq
    fi
```

1. Create `/System/Library/StartupItems/DNSMASQ/Startup\ Parameters.plist` and fill it with the following:

```bash
{
    Description = "Local DNSMASQ Server";
    Provides = ("DNS Masq");
    OrderPreference = "None";
    Messages =
    {
        start = "Starting DNSMASQ";
        stop = "Stopping DNSMASQ";
    };
}
```

1. Add the following line to /etc/hostconfig  
`DNSMASQ=-YES-`
2. Make it executable  
`sudo chmod +x /System/Library/StartupItems/DNSMASQ/DNSMASQ`

## Start dnsmasq for the first time

1. Open a separate Terminal window and run `tail -f /var/log/system.log`
2. `sudo /System/Library/StartupItems/DNSMASQ/DNSMASQ`  

You should see dnsmasq starting up in the system.log. Make sure there are no errors.

## Add your IP to your DNS settings

1. Go to *System Preferences > Network*
2. Click *Advanced...*
3. Click the *DNS* tab
4. Add 192.168.x.x (your IP address) to the list and drag it to the top of the list if you can
5. Click *Ok* then *Apply*

**\*\* MOST MOST MOST IMPORTANT \*\***  
**You will need to do this on any device you would like to access your .dev hostnames, including VMWare instances and iOS devices.**

## Test

1. Clear Cache: `dscacheutil -flushcache`

1. Dig a domain: `dig google.com`  
You should see something like this near the bottom:  
`;; SERVER: 192.168.x.x#53(192.168.x.x)`
 
1. `ping somewhere.dev`  
You should see something like this:

```bash
PING somewhere.dev (192.168.x.x): 56 data bytes
64 bytes from 192.168.x.x: icmp_seq=0 ttl=64 time=0.035 ms
64 bytes from 192.168.x.x: icmp_seq=1 ttl=64 time=0.046 ms
```