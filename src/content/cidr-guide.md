## What is CIDR?

**Classless Inter-Domain Routing (CIDR)** is the system that replaced the old class-A/B/C scheme in 1993.
A network is written as

```
address/prefix-length → 10.0.0.0/24
```

The *prefix length* (the number after the slash) tells routers how many of the 32 bits belong to the network portion:

* `10.0.0.0/24` → 24 network bits + 8 host bits → **256** addresses (254 usable)
* `10.0.0.0/30` → 30 network bits + 2 host bits → **4** addresses (2 usable)

CIDR lets ISPs advertise aggregated “supernets” such as `203.0.113.0/22` instead of listing a thousand individual /24 routes—shrinking global routing tables and conserving address space.

## CIDR → IP Range Converter

Paste any block—say `192.168.15.64/27`—into the calculator. Behind the scenes it:

1. **Bitwise-ANDs** the IP with the mask to find the **network address**.
2. **Inverts** the mask and ORs it with the IP to get the **broadcast address**.
3. Offsets ±1 to reveal the **first** and **last usable hosts**.

Hit **Copy Share Link** to bookmark or send an exact result.

## Subnetting Tutorial — Quick Steps

Subnetting seems daunting until you break it into four predictable moves:

1. **Convert the prefix** `/26` → `255 .255 .255 .192`
2. **Find block size** 256 − 192 = 64
3. **List subnet starts** 0, 64, 128, 192
4. **Pick your block** Usable hosts = block size − 2 (62 in a /26)

### Example

Split `172.16.0.0/16` into at least 10 equal subnets.

*Need ≥10 blocks → 4 extra bits (2⁴ = 16)*

New prefix = **/20**. Each /20 holds 4094 hosts.

Ranges begin 172.16.0.0, 172.16.16.0, 172.16.32.0 … to 172.16.240.0.

## IPv6 Subnetting Basics

The slash notation is identical in IPv6—just with 128-bit addresses.

* **/64**  is the standard LAN size → 18 quintillion addresses
* Providers often delegate:

  * `/48`  — 65 536 customer /64s
  * `/56`  — 256 /64s
  * `/60`  — 16 /64s

## Further Reading & Tools

* RFC 4632 — *Classless Inter-Domain Routing for IPv6*
* RFC 1519 — *CIDR Address Allocation for IPv4*
* [cidr.xyz source code](https://github.com/yuvadm/cidr.xyz)
