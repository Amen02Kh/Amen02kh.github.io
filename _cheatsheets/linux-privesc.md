---
title: Linux privilege escalation
stage: Privesc
summary: SUID, sudo, cron, capabilities and kernel checks
updated: 2026-11-01
---

## Quick wins

| Task | Command |
|------|---------|
| What can I run as root? | `sudo -l` |
| Find SUID binaries | `find / -perm -4000 -type f 2>/dev/null` |
| File capabilities | `getcap -r / 2>/dev/null` |
| Kernel and OS version | `uname -a; cat /etc/os-release` |

## Scheduled jobs and processes

| Task | Command |
|------|---------|
| System crontab | `cat /etc/crontab; ls -la /etc/cron.*` |
| Watch processes without root | `./pspy64` |
| Running services | `ps aux --forest` |

## Files worth a look

| Task | Command |
|------|---------|
| World-writable files | `find / -writable -type f -not -path "/proc/*" 2>/dev/null` |
| Readable shadow file? | `ls -la /etc/shadow` |
| SSH keys lying around | `find / -name "id_rsa*" 2>/dev/null` |

Found a SUID binary or a sudo rule? Look it up on [GTFOBins](https://gtfobins.github.io/).
