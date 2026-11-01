---
title: Recon and scanning
stage: Recon
summary: nmap, service enumeration, content discovery
updated: 2026-11-01
---

## Port scanning

| Task | Command |
|------|---------|
| All TCP ports, fast | `nmap -p- --min-rate 5000 -T4 -oN ports.txt <ip>` |
| Scripts and versions on open ports | `nmap -sCV -p 22,80,443 -oN services.txt <ip>` |
| Top UDP ports | `sudo nmap -sU --top-ports 50 <ip>` |

## Web content

| Task | Command |
|------|---------|
| Directory brute force | `ffuf -u http://<ip>/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt` |
| Virtual hosts | `ffuf -u http://<ip> -H "Host: FUZZ.<domain>" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs <size>` |

## SMB

| Task | Command |
|------|---------|
| List shares anonymously | `smbclient -L //<ip> -N` |
| Shares and permissions | `netexec smb <ip> -u '' -p '' --shares` |
