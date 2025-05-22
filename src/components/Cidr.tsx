import React, { useEffect, useState, useRef } from 'react';
import { Netmask } from 'netmask';

interface CidrProps {
    embed?: boolean;
}

export default function Cidr({ embed = false }: CidrProps) {
    const [ip, setIp] = useState([10, 88, 135, 144]);
    const [cidr, setCidr] = useState(28);
    const [cols] = useState(["bg-purple-400", "bg-red-400", "bg-green-400", "bg-yellow-400", "bg-slate-300"]);
    const [isCopied, setIsCopied] = useState(false);
    const [isShared, setIsShared] = useState(false);

    // Refs for the input elements
    const ipInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const cidrInputRef = useRef<HTMLInputElement | null>(null);

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

    // This function will now be called by our manual event listener
    // Note: The event type is now native WheelEvent, not React.WheelEvent
    const processWheelEvent = (event: WheelEvent, i: number, max: number) => {
        event.preventDefault(); // This will now be respected
        const min = 0;
        const target = event.currentTarget as HTMLInputElement; // currentTarget is the element the listener is attached to
        let value = parseInt(target.value, 10); // Always provide radix for parseInt

        if (isNaN(value)) value = 0; // Handle cases where input might be non-numeric temporarily

        if (event.deltaY > 0 && value > min) {
            value -= 1;
        }
        if (event.deltaY < 0 && value < max) {
            value += 1;
        }

        if (i === 4) { // Differentiate based on index passed, 4 for CIDR
            setCidr(value);
        } else {
            setIpOctet(i, value);
        }
    }


    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, i: number, max: number) => {
        const min = 0;
        const target = event.currentTarget as HTMLInputElement;
        let value = parseInt(target.value, 10);

        if (isNaN(value)) value = 0;

        if (event.key === "ArrowDown" && value > min) {
            value -= 1;
        }
        else if (event.key === "ArrowUp" && value < max) {
            value += 1;
        }
        else if (event.key === '.') {
            event.preventDefault();
            // Find the next IP octet input
            if (i < 3 && ipInputRefs.current[i + 1]) {
                ipInputRefs.current[i + 1]?.select();
                ipInputRefs.current[i + 1]?.focus();
            } else if (i === 3 && cidrInputRef.current) { // From last octet to CIDR with '.'
                cidrInputRef.current.select();
                cidrInputRef.current.focus();
            }
            return; // Important: return early so value isn't set incorrectly
        }
        else if (event.key === "/") {
            event.preventDefault();
            // Find the CIDR input
            if (cidrInputRef.current) {
                cidrInputRef.current.select();
                cidrInputRef.current.focus();
            }
            return; // Important: return early
        }
        // Allow only numbers for manual input, backspace, delete, arrows
        else if (!/^[0-9]$/.test(event.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key)) {
            if (!(event.ctrlKey || event.metaKey)) { // Allow Ctrl+A, Ctrl+C, etc.
                event.preventDefault();
                return;
            }
        }


        if (i === 4) {
            setCidr(value);
        } else {
            setIpOctet(i, value);
        }
    }

    const updateCidrString = (val: string) => {
        const parts = val.split("/");
        if (parts.length !== 2) return;

        const ipParts = parts[0].split(".").map(Number);
        const cidrVal = Number(parts[1]);

        if (ipParts.length !== 4 || ipParts.some(octet => isNaN(octet) || octet < 0 || octet > 255)) {
            // Optionally provide feedback for invalid IP
            return;
        }
        setIp(ipParts);

        if (isNaN(cidrVal) || cidrVal < 0 || cidrVal > 32) {
            // Optionally provide feedback for invalid CIDR
            return;
        }
        setCidr(cidrVal);
    }

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        if (event.clipboardData === null) return;
        const text = event.clipboardData.getData('Text');
        updateCidrString(text);
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(pretty);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleShare = async () => {
        const frag = "#" + ip.join(".") + "/" + cidr;
        window.location.hash = frag;
        await navigator.clipboard.writeText(window.location.toString());
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
    };

    useEffect(() => {
        const fragment = window.location.hash.slice(1);
        if (fragment) {
            updateCidrString(fragment);
        }
    }, []);


    // Effect to add and remove non-passive wheel event listeners
    useEffect(() => {
        const currentIpInputs = ipInputRefs.current;
        const currentCidrInput = cidrInputRef.current;

        // Add listeners for IP octets
        currentIpInputs.forEach((input, index) => {
            if (input) {
                const wheelHandler = (e: WheelEvent) => processWheelEvent(e, index, 255);
                input.addEventListener('wheel', wheelHandler, { passive: false });
                // Store handler on the element for removal, or manage in a separate array
                (input as any).__customWheelHandler = wheelHandler;
            }
        });

        // Add listener for CIDR input
        if (currentCidrInput) {
            const wheelHandler = (e: WheelEvent) => processWheelEvent(e, 4, 32); // Use 4 as index for CIDR
            currentCidrInput.addEventListener('wheel', wheelHandler, { passive: false });
            (currentCidrInput as any).__customWheelHandler = wheelHandler;
        }

        // Cleanup function
        return () => {
            currentIpInputs.forEach((input) => {
                if (input && (input as any).__customWheelHandler) {
                    input.removeEventListener('wheel', (input as any).__customWheelHandler);
                    delete (input as any).__customWheelHandler; // Clean up the property
                }
            });
            if (currentCidrInput && (currentCidrInput as any).__customWheelHandler) {
                currentCidrInput.removeEventListener('wheel', (currentCidrInput as any).__customWheelHandler);
                delete (currentCidrInput as any).__customWheelHandler;
            }
        };
        // Rerun effect if these state setters change, or if IP length changes (though it shouldn't)
        // Key dependencies are the functions that might be recreated if not memoized,
        // and `ip` because its length determines the number of ipInputRefs,
        // and `setIp`, `setCidr` because they are used inside processWheelEvent.
    }, [ip, setIp, setCidr]); // Add ip, setIp, setCidr as dependencies

    const pretty = ip.join('.') + '/' + cidr;
    let netmaskInstance;
    let details;

    try {
        netmaskInstance = new Netmask(pretty);
        details = {
            "Netmask": netmaskInstance.mask,
            "CIDR Base IP": netmaskInstance.base,
            "Broadcast IP": netmaskInstance.broadcast || "None",
            "Count": netmaskInstance.size.toLocaleString(),
            "First Usable IP": netmaskInstance.first || "None", // Handle cases like /31, /32
            "Last Usable IP": netmaskInstance.last || "None"  // Handle cases like /31, /32
        };
    } catch (e) {
        // Handle invalid CIDR string gracefully, e.g., during initial render or bad input
        details = {
            "Netmask": "Invalid",
            "CIDR Base IP": "Invalid",
            "Broadcast IP": "Invalid",
            "Count": "Invalid",
            "First Usable IP": "Invalid",
            "Last Usable IP": "Invalid"
        };
        console.error("Netmask error:", e);
    }


    return (
        <div className={`pt-1 ${embed ? 'my-2' : 'my-6'} border-0 sm:border border-gray-300 rounded-lg bg-white/70 shadow-md`}>
            <div className="flex flex-wrap justify-center gap-4 my-10">
                {ip.map((octet, i) => (
                    <div key={`octet-${i}`}>
                        <input
                            ref={el => { ipInputRefs.current[i] = el; }} // Assign ref
                            key={`inp-${i}`}
                            type="text" // Changed to text to allow better control, validation on keydown
                            inputMode="numeric" // Helps mobile keyboards
                            value={octet}
                            onChange={(e) => setIpOctet(i, parseOctet(e.target.value, 255))}
                            // onWheel prop is removed, handled by useEffect
                            onKeyDown={(e) => handleKeyDown(e, i, 255)}
                            onPaste={handlePaste}
                            className={`w-20 h-20 text-3xl text-center rounded-md ${cols[i]}`}
                            maxLength={3}
                            aria-label={`Octet ${i + 1}`}
                        />
                        <span className="text-5xl pl-4" key={`sep-${i}`}>{i === 3 ? "/" : "."}</span>
                    </div>
                ))}
                <input
                    ref={cidrInputRef} // Assign ref
                    type="text" // Changed to text
                    inputMode="numeric"
                    key={`inp-cidr`}
                    value={cidr}
                    onChange={(e) => setCidr(parseOctet(e.target.value, 32))}
                    // onWheel prop is removed
                    onKeyDown={(e) => handleKeyDown(e, 4, 32)} // Use 4 as index for CIDR
                    onPaste={handlePaste}
                    className={`w-20 h-20 text-3xl text-center rounded-md ${cols[4]}`}
                    maxLength={2}
                    aria-label={`Network bits`}
                />
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-10">
                {bits.map((octet, i) => <span key={`octet-${i}`} className="px-1">
                    {octet.map((bit, j) => <span key={`octet-${i}-bit-${j}`} className={`font-mono border-y ${j === 0 && "border-l"} border-r border-gray-700 px-2 py-1 ${i * 8 + j < cidr ? cols[i] : cols[4]}`}>{bit}</span>)}
                </span>)}
            </div>

            <div className="text-center text-xl mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(details).map(([label, val]) =>
                    <div className="sm:p-3 " key={`detail-${label}`}>
                        <div className="font-mono">{val}</div>
                        <div className="font-bold tracking-tight text-slate-500 sm:text-3xl text-2xl">{label}</div>
                    </div>)
                }
            </div>

            {embed && (<h2 className="text-lg text-gray-700 text-center mt-4 font-bold">
                CIDR Calculator by <a
                    href="https://cidr.xyz"
                    target="_blank"
                    className="text-blue-600 hover:underline">cidr.xyz</a
                >
            </h2>)}

            <div className="flex justify-center lg:justify-end p-5">
                <div className="mx-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-100 bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        {isCopied ? "Copied!" : "Copy CIDR"}
                    </button>
                </div>
                <div className="mx-2">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-100 bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        {isShared ? "Copied!" : "Copy Share Link"}
                    </button>
                </div>
            </div>
        </div>
    );
}