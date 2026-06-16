import React, { useEffect, useState } from 'react';
import { Cpu, HardDrive, Server } from 'lucide-react';
import ElSelect from '../ElSelect';

type ServerStatus = {
    id: string;
    cpu: number;
    memory: number;
    disk: number;
};

const servers: ServerStatus[] = [
    { id: 'BestLink-IOT-001', cpu: 80.27, memory: 90.37, disk: 76.44 },
    { id: 'BestLink-IOT-002', cpu: 65.12, memory: 72.88, disk: 58.33 },
    { id: 'BestLink-IOT-003', cpu: 42.56, memory: 55.19, disk: 83.71 },
    { id: 'BestLink-IOT-004', cpu: 91.03, memory: 68.45, disk: 49.82 },
];

function Gauge({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
    const numeric = parseFloat(value);
    return (
        <div className="gauge-item">
            <div
                className="gauge"
                style={
                    {
                        '--gauge-color': color,
                        '--gauge-value': `${numeric}%`,
                    } as React.CSSProperties
                }
            >
                <div className="gauge-inner">{value}</div>
            </div>
            <div className="gauge-label">
                {icon}
                <span>{label}</span>
            </div>
        </div>
    );
}

export default function ServerStatusPanel() {
    const [activeId, setActiveId] = useState(servers[0].id);
    const server = servers.find((item) => item.id === activeId) ?? servers[0];

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveId((prev) => {
                const index = servers.findIndex((item) => item.id === prev);
                return servers[(index + 1) % servers.length].id;
            });
        }, 10000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <section className="panel server-panel">
            <div className="server-head">
                <h3>服务器状态</h3>
                <ElSelect
                    value={activeId}
                    options={servers.map((item) => ({ label: item.id, value: item.id }))}
                    onChange={setActiveId}
                    dropdownAlign="right"
                />
            </div>
            <div className="gauge-row" key={server.id}>
                <Gauge label="CPU" value={`${server.cpu.toFixed(2)}%`} color="#5b8def" icon={<Cpu size={12} />} />
                <Gauge label="内存" value={`${server.memory.toFixed(2)}%`} color="#f15864" icon={<Server size={12} />} />
                <Gauge label="磁盘" value={`${server.disk.toFixed(2)}%`} color="#15a8de" icon={<HardDrive size={12} />} />
            </div>
        </section>
    );
}
