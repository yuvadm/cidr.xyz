import React, { useEffect, useRef, useState } from 'react';

interface Cidr6Props {
    embed?: boolean;
}

const FULL = (1n << 128n) - 1n;

// Region colours: global routing prefix, subnet ID, interface ID (SLAAC)
const IID_COL = "bg-amber-400";

// Same colours as hex, for per-bit gradients inside the hex inputs.
// "free" shades = bits beyond the prefix but above bit 64 (yours to assign).
const HEX = {
    net: "#c084fc", netFree: "#e9d5ff",
    subnet: "#4ade80", subnetFree: "#bbf7d0",
    iid: "#fbbf24",
} as const;
type Region = keyof typeof HEX;
// Structure: routing prefix | subnet ID (subnetW bits ending at bit 64) | interface ID.
// Solid = inside the entered /prefix, light = outside it.
const regionOf = (idx: number, prefix: number, subnetW: number): Region => {
    if (idx >= 64) return "iid";
    const free = idx >= prefix;
    if (idx >= 64 - subnetW) return free ? "subnetFree" : "subnet";
    return free ? "netFree" : "net";
};
const CLASS: Record<Region, string> = {
    net: "bg-purple-400", netFree: "bg-purple-200",
    subnet: "bg-green-400", subnetFree: "bg-green-200",
    iid: "bg-amber-400",
};

// Diagonal stripes = "machine generated" (SLAAC)
const HATCH: React.CSSProperties = {
    backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.13) 0 3px, transparent 3px 7px)",
};

const toBig = (g: number[]) => g.reduce((a, x) => (a << 16n) | BigInt(x), 0n);
const fromBig = (n: bigint) => Array.from({ length: 8 }, (_, i) => Number((n >> BigInt((7 - i) * 16)) & 0xffffn));
const maskFor = (p: number) => FULL ^ ((1n << BigInt(128 - p)) - 1n);

// RFC 5952 compression: longest run (>=2) of zero groups, first on ties
function compress(g: number[]): string {
    let bestStart = -1, bestLen = 0;
    for (let i = 0; i < 8;) {
        if (g[i] !== 0) { i++; continue; }
        let j = i;
        while (j < 8 && g[j] === 0) j++;
        if (j - i > bestLen) { bestStart = i; bestLen = j - i; }
        i = j;
    }
    const h = g.map(x => x.toString(16));
    if (bestLen < 2) return h.join(":");
    return h.slice(0, bestStart).join(":") + "::" + h.slice(bestStart + bestLen).join(":");
}

const expand = (g: number[]) => g.map(x => x.toString(16).padStart(4, "0")).join(":");

function parseAddr(str: string): number[] | null {
    str = str.trim().replace(/^\[|\]$/g, "");
    if (!/^[0-9a-fA-F:]+$/.test(str) || str.includes(":::")) return null;
    const halves = str.split("::");
    if (halves.length > 2) return null;
    const toGroups = (s: string) => (s === "" ? [] : s.split(":"));
    const head = toGroups(halves[0]);
    const tail = halves.length === 2 ? toGroups(halves[1]) : [];
    const all = [...head, ...tail];
    if (all.some(x => x.length < 1 || x.length > 4)) return null;
    if (halves.length === 1 ? head.length !== 8 : head.length + tail.length > 7) return null;
    const zeros = halves.length === 2 ? new Array(8 - head.length - tail.length).fill("0") : [];
    return [...head, ...zeros, ...tail].map(x => parseInt(x, 16));
}

function parseCidr6(str: string): { groups: number[]; prefix: number | null } | null {
    const parts = str.trim().split("/");
    if (parts.length > 2) return null;
    const groups = parseAddr(parts[0]);
    if (!groups) return null;
    let prefix: number | null = null;
    if (parts.length === 2) {
        if (!/^\d{1,3}$/.test(parts[1])) return null;
        prefix = Number(parts[1]);
        if (prefix > 128) return null;
    }
    return { groups, prefix };
}

function addressType(g: number[]): string {
    const n = toBig(g);
    if (n === 0n) return "Unspecified (::)";
    if (n === 1n) return "Loopback (::1)";
    if (g[0] >> 8 === 0xff) return "Multicast (ff00::/8)";
    if ((g[0] & 0xffc0) === 0xfe80) return "Link-local (fe80::/10)";
    if ((g[0] & 0xfe00) === 0xfc00) return "Unique local (fc00::/7)";
    if (g[0] === 0x2001 && g[1] === 0x0db8) return "Documentation (2001:db8::/32)";
    if ((g[0] & 0xe000) === 0x2000) return "Global unicast (2000::/3)";
    return "Other / reserved";
}

// Describe how the lower 64 bits (interface identifier) look
function describeIid(g: number[]): { title: string; text: string } {
    const hex = (x: number) => x.toString(16).padStart(2, "0");
    if ((g[5] & 0xff) === 0xff && g[6] >> 8 === 0xfe) {
        const mac = [(g[4] >> 8) ^ 2, g[4] & 0xff, g[5] >> 8, g[6] & 0xff, g[7] >> 8, g[7] & 0xff].map(hex).join(":");
        return { title: "EUI-64 (SLAAC)", text: `Derived from MAC address ${mac} (ff:fe inserted in the middle, universal/local bit flipped).` };
    }
    if (g[4] === 0 && g[5] === 0 && g[6] === 0 && g[7] < 0x100) {
        return { title: "Manually assigned", text: "Looks hand-picked (a small number such as ::1), the typical style for static servers and routers." };
    }
    return { title: "Random / opaque (SLAAC)", text: "Looks like a privacy (RFC 4941) or stable-opaque (RFC 7217) identifier, what most modern devices generate on their own." };
}

const EXAMPLE_MAC = "00:1a:2b:3c:4d:5e";

function parseMac(str: string): number[] | null {
    const clean = str.trim().replace(/[:\-.\s]/g, "");
    if (!/^[0-9a-fA-F]{12}$/.test(clean)) return null;
    return Array.from({ length: 6 }, (_, i) => parseInt(clean.slice(i * 2, i * 2 + 2), 16));
}

// MAC -> modified EUI-64 interface ID (4 groups)
const macToIid = (m: number[]): number[] => [
    ((m[0] ^ 2) << 8) | m[1],
    (m[2] << 8) | 0xff,
    (0xfe << 8) | m[3],
    (m[4] << 8) | m[5],
];

const randomIid = (): number[] => {
    const r = new Uint16Array(4);
    crypto.getRandomValues(r);
    r[0] &= ~0x0200; // universal/local bit = 0 (locally generated)
    return Array.from(r);
};

export default function Cidr6({ embed = false }: Cidr6Props) {
    const [groups, setGroups] = useState([0x2001, 0x0db8, 0x1234, 0x5678, 0x021a, 0x2bff, 0xfe3c, 0x4d5e]);
    const [prefix, setPrefix] = useState(64);
    const [subnetW, setSubnetW] = useState(16);
    const [macText, setMacText] = useState(EXAMPLE_MAC);
    const mac = parseMac(macText);
    const [isCopied, setIsCopied] = useState(false);
    const [isShared, setIsShared] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const prefixRef = useRef<HTMLInputElement | null>(null);

    const bitAt = (i: number) => (groups[i >> 4] >> (15 - (i & 15))) & 1;

    const setGroup = (i: number, v: number) => setGroups(gs => gs.map((x, k) => (k === i ? v : x)));

    const toggleBit = (idx: number) => setGroup(idx >> 4, groups[idx >> 4] ^ (1 << (15 - (idx & 15))));

    const focusEl = (el: HTMLInputElement | null | undefined) => { el?.focus(); el?.select(); };

    const applyString = (val: string) => {
        const parsed = parseCidr6(val);
        if (!parsed) return;
        setGroups(parsed.groups);
        if (parsed.prefix !== null) setPrefix(parsed.prefix);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        applyString(e.clipboardData?.getData("Text") ?? "");
    };

    const handleGroupKey = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === ":" || e.key === ".") {
            e.preventDefault();
            focusEl(i < 7 ? inputRefs.current[i + 1] : prefixRef.current);
        } else if (e.key === "/") {
            e.preventDefault();
            focusEl(prefixRef.current);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setGroup(i, Math.min(0xffff, groups[i] + 1));
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setGroup(i, Math.max(0, groups[i] - 1));
        } else if (e.key.length === 1 && !/^[0-9a-fA-F]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handlePrefixKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === "ArrowUp") { e.preventDefault(); setPrefix(p => Math.min(128, p + 1)); }
        else if (e.key === "ArrowDown") { e.preventDefault(); setPrefix(p => Math.max(0, p - 1)); }
        else if (e.key.length === 1 && !/^[0-9]$/.test(e.key)) e.preventDefault();
    };

    // Non-passive wheel listeners (so the page doesn't scroll while adjusting a value)
    useEffect(() => {
        const cleanups: (() => void)[] = [];
        const add = (el: HTMLInputElement | null, fn: (dir: number) => void) => {
            if (!el) return;
            const h = (e: WheelEvent) => { e.preventDefault(); fn(e.deltaY < 0 ? 1 : -1); };
            el.addEventListener("wheel", h, { passive: false });
            cleanups.push(() => el.removeEventListener("wheel", h));
        };
        inputRefs.current.forEach((el, i) =>
            add(el, d => setGroups(gs => gs.map((x, k) => (k === i ? Math.min(0xffff, Math.max(0, x + d)) : x)))));
        add(prefixRef.current, d => setPrefix(p => Math.min(128, Math.max(0, p + d))));
        return () => cleanups.forEach(c => c());
    }, []);

    useEffect(() => {
        const frag = window.location.hash.slice(1);
        if (frag) applyString(decodeURIComponent(frag));
    }, []);

    const full = toBig(groups);
    const mask = maskFor(prefix);
    const base = full & mask;
    const last = base | (FULL ^ mask);
    const hostBits = 128 - prefix;
    const pretty = compress(groups) + "/" + prefix;
    const iid = describeIid(groups);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(pretty);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleShare = async () => {
        window.location.hash = "#" + pretty;
        await navigator.clipboard.writeText(window.location.toString());
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
    };

    const details: { label: string; val: string; sub?: string }[] = [
        { label: "Network", val: compress(fromBig(base)) + "/" + prefix },
        { label: "First Address", val: compress(fromBig(base)) },
        { label: "Last Address", val: compress(fromBig(last)) },
        { label: "Addresses", val: (1n << BigInt(hostBits)).toLocaleString(), sub: `2^${hostBits}` },
        prefix <= 64
            ? { label: "/64 Subnets", val: (1n << BigInt(64 - prefix)).toLocaleString(), sub: `2^${64 - prefix}` }
            : { label: "/64 Subnets", val: "Smaller than a /64", sub: "SLAAC needs a /64" },
        { label: "Type", val: addressType(groups) },
    ];

    // Background for a hex box: one colour per bit, hard stops where the region changes
    const groupStyle = (i: number): React.CSSProperties => {
        const regs = Array.from({ length: 16 }, (_, j) => regionOf(i * 16 + j, prefix, subnetW));
        const stops: string[] = [];
        for (let j = 0; j < 16;) {
            let k = j;
            while (k < 16 && regs[k] === regs[j]) k++;
            stops.push(`${HEX[regs[j]]} ${(j / 16) * 100}% ${(k / 16) * 100}%`);
            j = k;
        }
        const grad = `linear-gradient(to right, ${stops.join(", ")})`;
        return { backgroundImage: i >= 4 ? `${HATCH.backgroundImage}, ${grad}` : grad };
    };

    const bitClass = (idx: number) => {
        const col = CLASS[regionOf(idx, prefix, subnetW)];
        const boundary = idx === prefix && idx > 0 ? "border-l-2 border-l-red-600" : "";
        return `${col} ${boundary}`;
    };

    const subnetBits = Math.max(0, 64 - prefix);
    const routingBits = 64 - subnetW;
    const structure = subnetW > 0
        ? `Routing prefix (${routingBits} bits) + optional subnet ID (${subnetW} bits).`
        : "Routing prefix (64 bits), no subnet ID.";
    const prefixNote = prefix > 64
        ? ` /${prefix} reaches ${prefix - 64} bits into the interface ID.`
        : prefix === 64
            ? " /64 is exactly one subnet."
            : ` /${prefix} spans the first ${prefix} bits, leaving ${subnetBits} for 2^${subnetBits} /64 subnets.`;
    const upperCaption = structure + prefixNote;

    const renderHalf = (half: 0 | 1) => {
        const isIid = half === 1;
        return (
            <div className={`rounded-lg border-2 p-3 ${isIid ? "border-dashed border-amber-500 bg-amber-50" : "border-solid border-purple-300 bg-white/60"}`}>
                <div className="text-center mb-3 w-0 min-w-full">
                    <div className={`font-bold ${isIid ? "text-amber-800" : "text-purple-800"}`}>
                        {isIid ? "Interface ID · lower 64 bits" : "Network prefix · upper 64 bits"}
                    </div>
                    <div className="text-sm text-gray-600">
                        {isIid
                            ? "Normally generated by the device itself (SLAAC), but you can edit it"
                            : upperCaption}
                    </div>
                </div>

                <div className="flex justify-center items-center gap-1">
                    {[0, 1, 2, 3].map(k => {
                        const i = half * 4 + k;
                        const style = groupStyle(i);
                        return (
                            <React.Fragment key={i}>
                                <input
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="text"
                                    autoCapitalize="off"
                                    autoComplete="off"
                                    spellCheck={false}
                                    value={groups[i].toString(16)}
                                    onChange={e => {
                                        const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 4);
                                        setGroup(i, v === "" ? 0 : parseInt(v, 16));
                                    }}
                                    onFocus={e => e.target.select()}
                                    onKeyDown={e => handleGroupKey(e, i)}
                                    onPaste={handlePaste}
                                    style={style}
                                    className="w-16 h-16 sm:w-[5.5rem] sm:h-[5.5rem] text-2xl sm:text-3xl font-mono text-center rounded-md"
                                    maxLength={4}
                                    aria-label={`Group ${i + 1} (hex)${isIid ? ", interface ID" : ""}`}
                                />
                                <span className="text-2xl sm:text-5xl">{i === 3 || i === 7 ? "" : ":"}</span>
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="mt-4 flex flex-col items-center gap-1">
                    {[0, 1, 2, 3].map(k => {
                        const i = half * 4 + k;
                        return (
                            <div key={i} className="flex">
                                {Array.from({ length: 16 }, (_, j) => {
                                    const idx = i * 16 + j;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => toggleBit(idx)}
                                            style={idx >= 64 ? HATCH : undefined}
                                            className={`font-mono text-xs sm:text-sm border-y border-r ${j === 0 ? "border-l" : ""} ${j % 4 === 0 && j > 0 ? "ml-1 border-l" : ""} border-gray-700 px-[5px] sm:px-2 py-1 cursor-pointer hover:brightness-90 active:brightness-75 transition ${bitClass(idx)}`}
                                            title={`Toggle bit ${idx + 1} (click to flip)`}
                                            aria-label={`Bit ${idx + 1}, current value ${bitAt(idx)}, click to toggle`}
                                        >{bitAt(idx)}</button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className={`pt-1 ${embed ? "my-2" : "my-6"} border-0 sm:border border-gray-300 rounded-lg bg-white/70 shadow-md`}>
            <div className="flex flex-wrap justify-center items-center gap-4 my-8 px-2">
                {renderHalf(0)}
                {renderHalf(1)}
                <div className="flex items-center gap-2">
                    <span className="text-4xl sm:text-5xl">/</span>
                    <input
                        ref={prefixRef}
                        type="text"
                        inputMode="numeric"
                        value={prefix}
                        onChange={e => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                            setPrefix(Math.min(128, v === "" ? 0 : Number(v)));
                        }}
                        onFocus={e => e.target.select()}
                        onKeyDown={handlePrefixKey}
                        onPaste={handlePaste}
                        className="w-20 h-20 sm:w-24 sm:h-24 text-3xl sm:text-4xl text-center rounded-md bg-slate-300"
                        maxLength={3}
                        aria-label="Prefix length"
                    />
                </div>
            </div>

            <div className="mx-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-gray-700">
                <span className="flex items-center gap-1"><i className="inline-block w-4 h-4 border border-gray-700 bg-purple-400" /> Routing prefix (first {routingBits} bits)</span>
                {subnetW > 0 && <span className="flex items-center gap-1"><i className="inline-block w-4 h-4 border border-gray-700 bg-green-400" /> Subnet ID ({subnetW} bits)</span>}
                <span className="flex items-center gap-1"><i style={HATCH} className={`inline-block w-4 h-4 border border-gray-700 ${IID_COL}`} /> Interface ID (SLAAC)</span>
                <span className="flex items-center gap-1"><i className="inline-block w-4 h-4 border border-gray-700 bg-gradient-to-r from-purple-400 to-purple-200" /> Solid = inside /{prefix}, light = outside{subnetBits > 0 ? ` (${subnetBits} bits)` : ""}</span>
            </div>

            <div className="mt-3 flex justify-center items-center gap-2 text-sm text-gray-700">
                <label htmlFor="subnet-width" className="font-semibold">Subnet ID width:</label>
                <input
                    id="subnet-width"
                    type="number"
                    min={0}
                    max={64}
                    value={subnetW}
                    onChange={e => setSubnetW(Math.min(64, Math.max(0, Math.floor(Number(e.target.value)) || 0)))}
                    className="w-20 px-2 py-1 text-center font-mono rounded-md border border-green-600 bg-white"
                />
                <span>bits (usually 16 when a site gets a /48)</span>
            </div>

            <div className="mx-4 mt-5 max-w-3xl sm:mx-auto rounded-lg border border-dashed border-amber-500 bg-amber-50 p-3 text-center">
                <div className="font-bold text-amber-900">Interface ID: {iid.title}</div>
                <div className="text-gray-700">{iid.text}</div>
                {prefix > 64 && (
                    <div className="mt-1 text-sm text-red-700 font-semibold">
                        A prefix longer than /64 cuts into the interface ID. SLAAC only works on /64 subnets.
                    </div>
                )}
                <div className="mt-3 flex justify-center items-center gap-2 flex-wrap">
                    <label htmlFor="mac-input" className="text-sm font-semibold text-amber-900">Build from MAC address:</label>
                    <input
                        id="mac-input"
                        type="text"
                        value={macText}
                        placeholder={EXAMPLE_MAC}
                        autoCapitalize="off"
                        autoComplete="off"
                        spellCheck={false}
                        onChange={e => {
                            const t = e.target.value;
                            setMacText(t);
                            const m = parseMac(t);
                            if (m) setGroups(gs => [...gs.slice(0, 4), ...macToIid(m)]);
                        }}
                        onFocus={e => e.target.select()}
                        aria-invalid={mac === null}
                        aria-label="MAC address"
                        className={`w-56 px-2 py-1 font-mono text-center rounded-md border ${mac ? "border-amber-500 bg-white" : "border-red-500 bg-red-50"}`}
                    />
                    <button
                        onClick={() => { setMacText(EXAMPLE_MAC); setGroups(gs => [...gs.slice(0, 4), ...macToIid(parseMac(EXAMPLE_MAC)!)]); }}
                        className="px-3 py-1 text-sm text-white bg-amber-600 rounded-md hover:bg-amber-700"
                    >Use example</button>
                </div>
                {mac === null && <div className="text-sm text-red-700">Enter 6 hex bytes, e.g. {EXAMPLE_MAC}</div>}
                <div className="mt-2 flex justify-center gap-2 flex-wrap">
                    <button
                        onClick={() => setGroups(gs => [...gs.slice(0, 4), ...randomIid()])}
                        className="px-3 py-1 text-sm text-white bg-amber-600 rounded-md hover:bg-amber-700"
                    >Generate random ID</button>
                    <button
                        onClick={() => setGroups(gs => [...gs.slice(0, 4), 0, 0, 0, 1])}
                        className="px-3 py-1 text-sm text-white bg-amber-600 rounded-md hover:bg-amber-700"
                    >Set to ::1</button>
                </div>
            </div>

            <div className="text-center text-xl mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
                {details.map(d => (
                    <div className="sm:p-3" key={d.label}>
                        <div className="font-mono break-all">{d.val}</div>
                        {d.sub && <div className="font-mono text-sm text-gray-500">{d.sub}</div>}
                        <div className="font-bold tracking-tight text-slate-500 sm:text-3xl text-2xl">{d.label}</div>
                    </div>
                ))}
            </div>
            <div className="text-center text-sm text-gray-500 mt-2 font-mono break-all px-2">{expand(groups)}</div>

            {embed && (<h2 className="text-lg text-gray-700 text-center mt-4 font-bold">
                CIDR Calculator by <a href="https://cidr.xyz" target="_blank" className="text-blue-600 hover:underline">cidr.xyz</a>
            </h2>)}

            <div className="flex justify-center lg:justify-end p-5">
                <div className="mx-2">
                    <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-100 bg-blue-600 rounded-md hover:bg-blue-700">
                        {isCopied ? "Copied!" : "Copy CIDR"}
                    </button>
                </div>
                <div className="mx-2">
                    <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-100 bg-blue-600 rounded-md hover:bg-blue-700">
                        {isShared ? "Copied!" : "Copy Share Link"}
                    </button>
                </div>
            </div>
        </div>
    );
}
