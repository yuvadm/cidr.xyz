"use client"

import React, { useState } from 'react';
// import { Netmask } from 'netmask';

export default function Cidr() {
  const [ip, setIp] = useState([10, 88, 135, 144]);
  const [cidr, setCidr] = useState(28);
  const [cols] = useState(["bg-purple-400", "bg-red-400", "bg-green-400", "bg-yellow-400"]);

  const bits = ip.map(octet => Array.from({ length: 8 }, (_, i) => (octet >> (7 - i)) & 1));

  const parseOctet = (val: string, max: number) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 0) return 0;
    if (num > max) return max;
    return num;
  }

  const setIpOctet = (i: number, val: number) => {
    const newIp = [...ip];
    newIp[i] = val;
    setIp(newIp);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-5xl w-full p-8">
        <h1 className="text-4xl font-bold text-left mb-4">IP / CIDR Visualizer</h1>
        <p className="text-sm text-left text-gray-600 mb-8">
          <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing">CIDR</a> is a notation for describing
          blocks of IP addresses and is used heavily in various networking configurations. IP addresses contain 4
          octets, each consisting of 8 bits giving values between 0 and 255. The decimal value that comes after the
          slash is the number of bits consisting of the routing prefix. This in turn can be translated into a netmask,
          and also designates how many available addresses are in the block.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {ip.map((octet, i) => (
            <div key={`octet-${i}`}>
              <input
                key={`inp-${i}`}
                type="text"
                value={octet}
                onChange={(e) => setIpOctet(i, parseOctet(e.target.value, 255))}
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
            className="w-20 h-20 text-3xl text-center rounded-md bg-slate-300"
            maxLength={2}
          />
        </div>

        <div className="text-center text-xl mb-8">
          <div className="bits text-xs">
            {bits.map((octet, i) => <span key={`octet-${i}`} className="px-4">
              {octet.map((bit, j) => <span key={`octet-${i}-bit-${j}`} className={`font-mono border-y ${j == 0 && "border-l"} border-r border-gray-700 px-2 py-1 ${cols[i]}`}>{bit}</span>)}
            </span>)}
          </div>
        </div>

        <div className="text-center text-xl mb-8">
          <span className="font-semibold">IP Address: </span>
          {ip.join('.')}
          <span className="font-semibold ml-4">CIDR: </span>/{cidr}
        </div>

        <footer className="flex justify-center space-x-4">
          <a href="#" className="flex items-center text-blue-600 hover:underline">
            GitHub
          </a>
          <a href="#" className="flex items-center text-blue-600 hover:underline">
            About
          </a>
        </footer>
      </div>
    </div >
  );
}
