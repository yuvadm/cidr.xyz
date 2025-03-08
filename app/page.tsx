"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Netmask } from 'netmask';

export default function Cidr() {
  const [ip, setIp] = useState([10, 88, 135, 144]);
  const [cidr, setCidr] = useState(28);
  const [cols] = useState(["bg-purple-400", "bg-red-400", "bg-green-400", "bg-yellow-400", "bg-slate-300"]);
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Subnet mask styling
const subnetCols = ["bg-blue-400", "bg-gray-300"];
const bits = ip.map(octet => Array.from({ length: 8 }, (_, i) => (octet >> (7 - i)) & 1)); // Fixed line
const subnetBits = Array.from({ length: 32 }, (_, i) => i < cidr ? 1 : 0);

  const parseOctet = (val: string, max: number) => {
    const num = Number(val);
    if (isNaN(num) || num < 0) return 0;
    if (num > max) return max;
    return num;
  };

  const setIpOctet = (i: number, val: number) => {
    const newIp = [...ip];
    newIp[i] = val;
    setIp(newIp);
  };

  const handleWheel = (event: React.WheelEvent<HTMLInputElement>, i: number, max: number) => {
    event.preventDefault();
    const min = 0;
    const target = event.currentTarget as HTMLInputElement;
    let value = parseInt(target.value);

    if (event.deltaY > 0 && value > min) value -= 1;
    if (event.deltaY < 0 && value < max) value += 1;

    i === 4 ? setCidr(value) : setIpOctet(i, value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, i: number, max: number) => {
    const min = 0;
    const target = event.currentTarget as HTMLInputElement;
    let value = parseInt(target.value);

    if (event.key === "ArrowDown" && value > min) value -= 1;
    else if (event.key === "ArrowUp" && value < max) value += 1;
    else if (event.key === '.') {
      event.preventDefault();
      const nextInput = (event.target as HTMLElement).parentElement?.nextElementSibling?.querySelector('input');
      nextInput?.focus();
    }
    else if (event.key === "/") {
      event.preventDefault();
      (document.querySelector('input[aria-label="Network bits"]') as HTMLInputElement)?.focus();
    }

    i === 4 ? setCidr(value) : setIpOctet(i, value);
  };

  const updateCidrString = (val: string) => {
    const [ipPart, cidrPart] = val.split("/");
    const newIp = ipPart.split(".").map(Number);
    const newCidr = Number(cidrPart);

    if (newIp.length === 4 && newIp.every(octet => !isNaN(octet) && octet >= 0 && octet <= 255)) {
      setIp(newIp);
    }

    if (!isNaN(newCidr) && newCidr >= 0 && newCidr <= 32) {
      setCidr(newCidr);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    updateCidrString(event.clipboardData.getData('Text'));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${ip.join('.')}/${cidr}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/#${ip.join('.')}/${cidr}`;
    await navigator.clipboard.writeText(url);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2000);
  };

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (fragment) updateCidrString(fragment);
  }, []);

  const netmask = new Netmask(`${ip.join('.')}/${cidr}`);
  const details = {
    "Netmask": netmask.mask,
    "CIDR Base IP": netmask.base,
    "Broadcast IP": netmask.broadcast || "None",
    "Count": netmask.size.toLocaleString(),
    "First Usable IP": netmask.first,
    "Last Usable IP": netmask.last
  };

  const renderSubnetBits = useCallback(() => (
    <div className="flex flex-wrap justify-center mt-10">
      <div className="w-full text-center mb-2 text-lg font-semibold text-gray-700">
        Subnet Mask Bits
      </div>
  
      {subnetBits.map((bit, index) => (
        <span
          key={`subnet-${index}`}
          className={`font-mono border-y ${index % 8 === 0 ? "border-l" : ""} border-r border-gray-700 px-2 py-1 ${
            (index + 1) % 8 === 0 ? "mr-4" : "" 
          } ${index < cidr ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`} 
        >
          {bit}
        </span>
      ))}
    </div>
  ), [cidr, subnetBits]);
  
  
  
  
  
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-2">
      <div className="max-w-6xl w-full sm:p-8 p-2">
        <h1 className="my-3 sm:my-1 text-center sm:text-left text-4xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          IP / CIDR Calculator
        </h1>

        <div className="my-6 border-0 sm:border border-gray-300 rounded-lg">
          <div className="flex flex-wrap justify-center gap-4 my-10">
          <div className="w-full text-center mb-2 text-lg font-semibold text-gray-700">
                IP Address / CIDR Notation
           </div>

            {ip.map((octet, i) => (
              <div key={`octet-${i}`} className="flex items-center">
                <input
                  type="text"
                  value={octet}
                  onChange={(e) => setIpOctet(i, parseOctet(e.target.value, 255))}
                  onWheel={(e) => handleWheel(e, i, 255)}
                  onKeyDown={(e) => handleKeyDown(e, i, 255)}
                  onPaste={handlePaste}
                  className={`w-20 h-20 text-3xl text-center rounded-md ${cols[i]}`}
                  maxLength={3}
                  aria-label={`Octet ${i + 1}`}
                />
                <span className="text-5xl pl-4">{i === 3 ? "/" : "."}</span>
              </div>
            ))}
            <input
              type="text"
              value={cidr}
              onChange={(e) => setCidr(parseOctet(e.target.value, 32))}
              onWheel={(e) => handleWheel(e, 4, 32)}
              onKeyDown={(e) => handleKeyDown(e, 4, 32)}
              onPaste={handlePaste}
              className={`w-20 h-20 text-3xl text-center rounded-md ${cols[4]}`}
              maxLength={2}
              aria-label="Network bits"
            />
          </div>

         

          <div className="flex flex-wrap justify-center gap-4 mt-10">
          <div className="w-full text-center mb-2 text-lg font-semibold text-gray-700">
                IP Bits
           </div>

            {
            bits.map((octet, i) => (
              <span key={`octet-${i}`} className="px-1">
                {octet.map((bit, j) => (
                  <span 
                    key={`octet-${i}-bit-${j}`} 
                    className={`font-mono border-y ${j === 0 ? "border-l" : ""} border-r border-gray-700 px-2 py-1 ${
                      i * 8 + j < cidr ? cols[i] : cols[4]
                    }`}
                  >
                    {bit}
                  </span>
                ))}
              </span>
            ))
            
            }
          </div>

           {renderSubnetBits()}

          <div className="text-center text-xl mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(details).map(([label, val]) => (
              <div className="sm:p-3" key={`detail-${label}`}>
                <div className="font-mono">{val}</div>
                <div className="font-bold tracking-tight text-slate-500 sm:text-3xl text-2xl">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-end p-5 gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm text-gray-100 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {isCopied ? "Copied!" : "Copy CIDR"}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 text-sm text-gray-100 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {isShared ? "Copied!" : "Share Link"}
            </button>
          </div>
        </div>

        <div className="my-6 text-lg leading-8 text-slate-900 space-y-4">
          <p>CIDR (Classless Inter-Domain Routing) notation is a compact method for specifying IP address ranges and network masks. It is widely used in network configuration and management.</p>
          <p>An IP address consists of 4 octets, each containing 8 bits that represent values from 0 to 255. In CIDR notation, a forward slash (/) followed by a number indicates the length of the network prefix in bits.</p>
          <p>This prefix length determines the network mask and the number of available host addresses within the specified IP range. This calculator helps you visualize and understand these CIDR blocks, making network planning and configuration easier.</p>
        </div>
      </div>

      <footer className="text-center mt-8 text-gray-600">
        <p>Created by <a href="https://yuv.al" className="text-blue-600 hover:underline">Yuval Adam</a>. Source available on <a href="https://github.com/yuvadm/cidr.xyz" className="text-blue-600 hover:underline">GitHub</a>.</p>
      </footer>
    </div>
  );
}