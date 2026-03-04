import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

function StatCard({ icon, label, value, color, bg }: { icon: string; label: string; value: string | number; color: string; bg: string }) {
    return (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, background: bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: color, fontWeight: 600, marginTop: 4 }}>{label}</div>
            </div>
        </div>
    );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max === 0 ? 0 : Math.round((value / max) * 100);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: '#475569', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
            <div style={{ flex: 1, height: 22, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                    {pct > 15 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{value}</span>}
                </div>
            </div>
            <div style={{ width: 28, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{pct > 15 ? '' : value}</div>
        </div>
    );
}

const HOUR_LABELS = ['08', '09', '10', '11', '12', '13', '14'];

export function AnalyticsPage() {
    const { bookings, classrooms } = useApp();

    const approved = bookings.filter(b => b.status === 'approved');
    const pending = bookings.filter(b => b.status === 'pending');
    const rejected = bookings.filter(b => b.status === 'rejected');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    const total = bookings.length;
    const approvalRate = total === 0 ? 0 : Math.round((approved.length / total) * 100);

    // Top rooms by approved bookings
    const roomUsage = useMemo(() => {
        const counts: Record<string, number> = {};
        approved.forEach(b => { counts[b.classroomName] = (counts[b.classroomName] || 0) + 1; });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [approved]);
    const maxRoomCount = roomUsage[0]?.count || 1;

    // Bookings by user role
    const roleBreakdown = useMemo(() => {
        const student = bookings.filter(b => b.userRole === 'student').length;
        const faculty = bookings.filter(b => b.userRole === 'faculty').length;
        return [
            { label: 'Students', count: student, color: '#3b82f6', icon: '🎓' },
            { label: 'Faculty', count: faculty, color: '#8b5cf6', icon: '📚' },
        ];
    }, [bookings]);

    // Peak hours heatmap: count approved bookings starting in each hour slot
    const peakHours = useMemo(() => {
        const counts: Record<string, number> = {};
        HOUR_LABELS.forEach(h => { counts[h] = 0; });
        approved.forEach(b => {
            const h = b.startTime.substring(0, 2);
            if (counts[h] !== undefined) counts[h]++;
        });
        return counts;
    }, [approved]);
    const maxPeak = Math.max(...Object.values(peakHours), 1);

    // Campus utilization
    const campuses = useMemo(() => {
        const map: Record<string, { total: number; used: number }> = {};
        classrooms.forEach(c => {
            if (!map[c.campus]) map[c.campus] = { total: 0, used: 0 };
            map[c.campus].total++;
            const hasApproved = approved.some(b => b.classroomId === c.id);
            if (hasApproved) map[c.campus].used++;
        });
        return Object.entries(map).map(([name, d]) => ({ name, ...d, pct: Math.round((d.used / d.total) * 100) }));
    }, [classrooms, approved]);

    // Top requesters
    const topRequesters = useMemo(() => {
        const counts: Record<string, number> = {};
        bookings.forEach(b => { counts[b.userName] = (counts[b.userName] || 0) + 1; });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [bookings]);
    const maxRequesterCount = topRequesters[0]?.count || 1;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 20, padding: '24px 28px', color: '#fff' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>📊 Usage Analytics</h2>
                <p style={{ margin: 0, color: '#93c5fd', fontSize: 14 }}>Real-time insights into classroom usage, booking trends, and campus utilization</p>
            </div>

            {/* Key Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                <StatCard icon="📋" label="Total Bookings" value={total} color="#2563eb" bg="#eff6ff" />
                <StatCard icon="✅" label="Approved" value={approved.length} color="#16a34a" bg="#f0fdf4" />
                <StatCard icon="⏳" label="Pending" value={pending.length} color="#d97706" bg="#fffbeb" />
                <StatCard icon="❌" label="Rejected" value={rejected.length} color="#dc2626" bg="#fef2f2" />
                <StatCard icon="🚫" label="Cancelled" value={cancelled.length} color="#64748b" bg="#f1f5f9" />
                <StatCard icon="🎯" label="Approval Rate" value={`${approvalRate}%`} color="#7c3aed" bg="#f5f3ff" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                {/* Top Rooms */}
                <div style={{ background: '#fff', borderRadius: 18, padding: 22, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                        🏆 Top Booked Rooms
                    </h3>
                    {roomUsage.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No approved bookings yet</div>
                    ) : roomUsage.map((r, i) => (
                        <BarRow key={r.name} label={r.name} value={r.count} max={maxRoomCount}
                            color={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#3b82f6'} />
                    ))}
                </div>

                {/* Top Requesters */}
                <div style={{ background: '#fff', borderRadius: 18, padding: 22, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                        👤 Most Active Requesters
                    </h3>
                    {topRequesters.map(r => (
                        <BarRow key={r.name} label={r.name} value={r.count} max={maxRequesterCount} color="#8b5cf6" />
                    ))}
                </div>

                {/* Peak Hours Heatmap */}
                <div style={{ background: '#fff', borderRadius: 18, padding: 22, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>🕐 Peak Booking Hours</h3>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
                        {HOUR_LABELS.map(h => {
                            const count = peakHours[h] || 0;
                            const heightPct = maxPeak === 0 ? 0 : (count / maxPeak) * 100;
                            const isHot = heightPct >= 70;
                            return (
                                <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: isHot ? '#dc2626' : '#94a3b8' }}>{count}</div>
                                    <div style={{
                                        width: '100%', height: `${Math.max(heightPct, 5)}%`,
                                        background: isHot ? 'linear-gradient(180deg,#ef4444,#f97316)' : 'linear-gradient(180deg,#3b82f6,#6366f1)',
                                        borderRadius: '6px 6px 2px 2px', transition: 'height 0.4s',
                                    }} />
                                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{h}:00</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Role Breakdown */}
                <div style={{ background: '#fff', borderRadius: 18, padding: 22, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>👥 Bookings by Role</h3>
                    <div style={{ display: 'flex', gap: 14 }}>
                        {roleBreakdown.map(r => {
                            const pct = total === 0 ? 0 : Math.round((r.count / total) * 100);
                            return (
                                <div key={r.label} style={{ flex: 1, background: '#f8fafc', borderRadius: 14, padding: 16, textAlign: 'center', border: `2px solid ${r.color}22` }}>
                                    <div style={{ fontSize: 28 }}>{r.icon}</div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: r.color, margin: '6px 0 2px' }}>{r.count}</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{r.label}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{pct}% of total</div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Status breakdown bar */}
                    <div style={{ marginTop: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Status Distribution</div>
                        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
                            {[
                                { count: approved.length, color: '#22c55e' },
                                { count: pending.length, color: '#f59e0b' },
                                { count: rejected.length, color: '#ef4444' },
                                { count: cancelled.length, color: '#94a3b8' },
                            ].map((s, i) => (
                                <div key={i} style={{ flex: s.count, background: s.color, transition: 'flex 0.5s' }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Approved', color: '#22c55e', count: approved.length },
                                { label: 'Pending', color: '#f59e0b', count: pending.length },
                                { label: 'Rejected', color: '#ef4444', count: rejected.length },
                                { label: 'Cancelled', color: '#94a3b8', count: cancelled.length },
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                                    <div style={{ width: 8, height: 8, background: s.color, borderRadius: 999 }} />
                                    <span style={{ color: '#64748b' }}>{s.label}: {s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Campus Utilization */}
                <div style={{ background: '#fff', borderRadius: 18, padding: 22, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>🏛️ Multi-Campus Utilization</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        {campuses.map(c => (
                            <div key={c.name} style={{ background: '#f8fafc', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0' }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 6 }}>{c.name}</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                                    {c.used} of {c.total} rooms have bookings
                                </div>
                                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${c.pct}%`, background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: 999, transition: 'width 0.5s' }} />
                                </div>
                                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{c.pct}% active</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
