"use client"

import React, { useEffect, useState } from 'react';
import { Netmask } from 'netmask';

export default function Cidr() {
  const [ip, setIp] = useState([10, 88, 135, 144]);
  const [cidr, setCidr] = useState(28);
  const [cols] = useState(["bg-purple-400", "bg-red-400", "bg-green-400", "bg-yellow-400", "bg-slate-300"]);

  const bits = ip.map(octet => Array.from({ length: 8 }, (_, i) => (octet >> (7 - i)) & 1));

  const parseOctet = (val: string, max: number) => {
    const num = Number(val);
    if (isNaN(num) || num < 0) return 0;
    if (num > max) return max;
    return num;
  }

  const setIpOctet = (i: number, val: number) => {
    const newIp = [...ip];
    newIp[i] = val;
    setIp(newIp);
  }

  const handleWheel = (event: React.WheelEvent<HTMLInputElement>, i: number, max: number) => {
    const min = 0;
    const target = event.currentTarget as HTMLInputElement;
    let value = parseInt(target.value);

    if (event.deltaY > 0 && value > min) {
      value -= 1;
    }
    if (event.deltaY < 0 && value < max) {
      value += 1;
    }

    if (i == 4) {
      setCidr(value);
    }
    else {
      setIpOctet(i, value);
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, i: number, max: number) => {
    const min = 0;
    const target = event.currentTarget as HTMLInputElement;
    let value = parseInt(target.value);

    if (event.key == "ArrowDown" && value > min) {
      value -= 1;
    }
    if (event.key == "ArrowUp" && value < max) {
      value += 1;
    }

    if (i == 4) {
      setCidr(value);
    }
    else {
      setIpOctet(i, value);
    }
  }

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    console.log(fragment);
    if (fragment) {
      const parts = fragment.split("/");
      const ip = parts[0].split(".").map(Number);
      const cidr = Number(parts[1]);

      if (ip.length != 4) {
        return
      }

      ip.forEach(octet => {
        if (octet < 0 || octet > 255) {
          return
        }
      })

      if (cidr < 0 || cidr > 32) {
        return
      }

      setIp(ip);
      setCidr(cidr);
    }
  }, []);

  const pretty = ip.join('.') + '/' + cidr;
  const netmask = new Netmask(pretty);

  const details = {
    "Netmask": netmask.mask,
    "CIDR Base IP": netmask.base,
    "Broadcast IP": netmask.broadcast,
    "Count": netmask.size.toLocaleString(),
    "First Usable IP": netmask.first,
    "Last Usable IP": netmask.last
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-2">
      <div className="max-w-6xl w-full sm:p-8 p-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          IP / CIDR Calculator
        </h1>

        <div className="my-6 text-lg leading-8 text-gray-600">
          <p>CIDR (Classless Inter-Domain Routing) notation is a compact method for specifying IP address ranges and network masks. It is widely used in network configuration and management.</p>
          <p>An IP address consists of 4 octets, each containing 8 bits that represent values from 0 to 255. In CIDR notation, a forward slash (/) followed by a number indicates the length of the network prefix in bits.</p>
          <p>This prefix length determines the network mask and the number of available host addresses within the specified IP range. This calculator helps you visualize and understand these CIDR blocks, making network planning and configuration easier.</p>
        </div>

        <div className='border border-gray-300 rounded-lg'>
          <div className="flex flex-wrap justify-center gap-4 my-10">
            {ip.map((octet, i) => (
              <div key={`octet-${i}`}>
                <input
                  key={`inp-${i}`}
                  type="text"
                  value={octet}
                  onChange={(e) => setIpOctet(i, parseOctet(e.target.value, 255))}
                  onWheel={(e) => handleWheel(e, i, 255)}
                  onKeyDown={(e) => handleKeyDown(e, i, 255)}
                  className={`w-20 h-20 text-3xl text-center rounded-md ${cols[i]}`}
                  maxLength={3}
                />
                <span className="text-5xl pl-4" key={`sep-${i}`}>{i == 3 ? "/" : "."}</span>
              </div>
            ))}
            <input
              type="text"
              key={`inp-cidr`}
              value={cidr}
              onChange={(e) => setCidr(parseOctet(e.target.value, 32))}
              onWheel={(e) => handleWheel(e, 4, 32)}
              onKeyDown={(e) => handleKeyDown(e, 4, 32)}
              className={`w-20 h-20 text-3xl text-center rounded-md ${cols[4]}`}
              maxLength={2}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-4 my-10">
            {bits.map((octet, i) => <span key={`octet-${i}`} className="px-1">
              {octet.map((bit, j) => <span key={`octet-${i}-bit-${j}`} className={`font-mono border-y ${j == 0 && "border-l"} border-r border-gray-700 px-2 py-1 ${i * 8 + j < cidr ? cols[i] : cols[4]}`}>{bit}</span>)}
            </span>)}
          </div>

          <div className="text-center text-xl mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(details).map(([label, val]) =>
              <div className="p-3" key={`detail-${label}`}>
                <div className="font-mono">{val}</div>
                <div className="text-lg font-bold tracking-tight text-gray-900 sm:text-3xl">{label}</div>
              </div>)
            }
          </div>
        </div>
      </div>

      <footer className="text-left">
        <p>Created by <a href="https://yuv.al" className="text-blue-600 hover:underline">Yuval Adam</a>. Source available on <a href="https://github.com/yuvadm/cidr.xyz" className="text-blue-600 hover:underline">Github</a>.</p>
      </footer>
    </div >
  );
}
