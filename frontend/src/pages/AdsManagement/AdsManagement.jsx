import React, { useMemo, useState } from 'react'
import './AdsManagement.css'
import CreateAdsWizard from '../../components/feature/CreateAdsWizard/CreateAdsWizard'

function AdsManagement() {
    const [activeTab, setActiveTab] = useState('campaigns')
    const [showWizard, setShowWizard] = useState(false)

    //Setdata tĩnh ngẫu nhiên
    const makeData = useMemo(() => {
        const base = (count, mapRow) => Array.from({ length: count }).map((_, i) => mapRow(i))
        return {
            campaigns: base(12, (i) => ({
                id: i + 1,
                name: `Chiến dịch Lượt tương tác #${i + 1}`,
                status: i < 3 ? 'Hoạt động' : 'Đang tắt',
                budget: `${(100_000_000 - i * 123_456).toLocaleString('vi-VN')}đ`,
                impressions: (1_000_001 + i * 1234).toLocaleString('vi-VN'),
                reach: (1000 + i * 27).toLocaleString('vi-VN'),
                enabled: i < 3,
                isChecked: false,
            })),
            adsets: base(12, (i) => ({
                id: i + 1,
                name: `Nhóm quảng cáo Tương tác #${i + 1}`,
                status: i % 2 === 0 ? 'Hoạt động' : 'Đang tắt',
                budget: `${(50_000_000 - i * 77_777).toLocaleString('vi-VN')}đ`,
                impressions: (555_000 + i * 2222).toLocaleString('vi-VN'),
                reach: (700 + i * 15).toLocaleString('vi-VN'),
                enabled: i % 2 === 0,
                isChecked: false,
            })),
            ads: base(12, (i) => ({
                id: i + 1,
                name: `Quảng cáo Bài viết #${i + 1}`,
                status: i % 3 === 0 ? 'Hoạt động' : 'Đang tắt',
                budget: `${(5_000_000 + i * 33_333).toLocaleString('vi-VN')}đ`,
                impressions: (120_000 + i * 999).toLocaleString('vi-VN'),
                reach: (320 + i * 9).toLocaleString('vi-VN'),
                enabled: i % 3 === 0,
                isChecked: false,
            })),
        }
    }, [])

    //Lấy data từ hàm makeData
    const [datasets, setDatasets] = useState(makeData)

    //Tạo và gắn false cho checkbox
    const [checkAll, setCheckAll] = useState(false)

    // Set dữ liệu để hiển thị tùy thuộc vào tab
    const rows = datasets[activeTab === 'campaigns' ? 'campaigns' : activeTab === 'adsets' ? 'adsets' : 'ads']

    //Function on/off trạng thái
    const toggleRow = (id) => {
        setDatasets(prev => {
            const key = activeTab === 'campaigns' ? 'campaigns' : activeTab === 'adsets' ? 'adsets' : 'ads'
            return {
                ...prev,
                [key]: prev[key].map(r => {
                    if (r.id !== id) return r
                    const nextEnabled = !r.enabled
                    return { ...r, enabled: nextEnabled, status: nextEnabled ? 'Hoạt động' : 'Đang tắt' }
                })
            }
        })
    }

    // Hàm xử lý chọn tất cả
    const handleCheckAll = (event) => {
        const isChecked = event.target.checked
        setCheckAll(isChecked)
        setDatasets(prev => {
            const key = activeTab === 'campaigns' ? 'campaigns' : activeTab === 'adsets' ? 'adsets' : 'ads'
            return { ...prev, [key]: prev[key].map(item => ({ ...item, isChecked })) }
        })
    }

    //Hàm xử lý chọn đơn lẻ
    const handleCheckItem = (id) => {
        setDatasets(prev => {
            const key = activeTab === 'campaigns' ? 'campaigns' : activeTab === 'adsets' ? 'adsets' : 'ads'
            const updated = prev[key].map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item)
            const allChecked = updated.every(item => item.isChecked)
            setCheckAll(allChecked)
            return { ...prev, [key]: updated }
        })
    }
    return (
        <div className="ads-management-layout">
            <div className="ads-management-content">
                <div className="ads-management-center">
                    <div className="ads-card">
                        <div className="ads-toolbar">
                            <div className="account-select">
                                <select>
                                    <option>Salemall.Fchat - 5 (2733322083474120)</option>
                                    <option>Salemall.Fchat - 4 (2733322083474234)</option>
                                    <option>Salemall.Fchat - 3 (2733322083474587)</option>
                                </select>
                                {/* Show Wizard tạo chiến dịch */}
                                <button className="btn-create" onClick={() => { setShowWizard(true) }}>+ Tạo chiến dịch</button>
                            </div>
                        
                        {/* Tạo trường dữ liệu thời gian để tìm kiếm chiến dịch và nhóm quảng cáo */}
                            <div className="filters">
                                <input type="date" />
                                <span> - </span>
                                <input type="date" />
                                <button className="btn-filter">▾</button>
                            </div>

                        </div>

                        <div className="ads-tabs">
                            <button className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => { setActiveTab('campaigns'); setCheckAll(false); }}>
                                <span className="tab-icon">▦</span>
                                Chiến dịch
                            </button>
                            <button className={`tab ${activeTab === 'adsets' ? 'active' : ''}`} onClick={() => { setActiveTab('adsets'); setCheckAll(false); }}>
                                <span className="tab-icon">▣</span>
                                Nhóm quảng cáo
                            </button>
                            <button className={`tab ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => { setActiveTab('ads'); setCheckAll(false); }}>
                                <span className="tab-icon">▥</span>
                                Quảng cáo
                            </button>
                        </div>

                        {/* Content chính */}
                        <div className="ads-table-wrapper">
                            <table className="ads-table">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" 
                                                   checked={checkAll}
                                                   onChange={handleCheckAll}/> 
                                        </th>
                                        <th>Tắt/Bật</th>
                                        <th>Chiến dịch</th>
                                        <th>Trạng thái</th>
                                        <th>Ngân sách</th>
                                        <th>Lượt hiển thị</th>
                                        <th>Người tiếp cận</th>
                                    </tr>
                                </thead>
                                <tbody>
                                     {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <input type="checkbox"
                                                   checked={row.isChecked}
                                                   onChange={() => handleCheckItem(row.id)} />
                                            </td>
                                             <td className="cell-name">
                                                 <button
                                                    type="button"
                                                    className={`switch ${row.enabled ? 'on' : 'off'}`}
                                                    aria-pressed={row.enabled}
                                                    onClick={() => toggleRow(row.id)}
                                                 />          
                                            </td>
                                            <td>{row.name}</td>
                                            <td className={row.status === 'Hoạt động' ? 'status-active' : 'status-inactive'}>{row.status}</td>
                                            <td className="text-center">{row.budget}</td>
                                            <td className="text-right">{row.impressions}</td>
                                            <td className="text-right">{row.reach}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {/* Đóng Wizard tạo chiến dịch */}
            {showWizard && (<CreateAdsWizard onClose={() => setShowWizard(false)} />)}
        </div>
    )
}

export default AdsManagement


