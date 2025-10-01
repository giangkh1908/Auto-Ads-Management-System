import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AccountManagement.css'

function AccountManagement() {
    const navigate = useNavigate()
    
    // temporary fixed data
    const accounts = [
        { id: 1, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 2, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 3, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 4, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 5, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 6, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 7, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 8, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 9, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 10, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 11, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },
        { id: 12, name: 'Salemall.Fchat -5', number: '2733322083474120', budget: 25000, status: 'Hoạt động', updatedAt: '13/06/2025 10:52' },

    ]

    return (
        <div className="account-management-layout">
            <div className="account-management-content">
                <div className="account-management-center">
                <div className="account-management-card">
                    <div className="account-management-header">
                        <div>
                            <h3>Tài khoản quảng cáo</h3>
                            <p>Kết nối tài khoản quảng cáo Facebook để đo hiệu quả của từng Chiến dịch.</p>
                            <div className="search-row">
                                <input className="search-input" placeholder="Tìm kiếm ID, tên tài khoản" />
                                <button className="btn-find">Tìm</button>
                            </div>
                        </div>
                        <div>
                            <button 
                                className="btn btn-success"
                                onClick={() => navigate('/connect')}
                            >
                                + Thêm tài khoản
                            </button>
                        </div>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Tên tài khoản</th>
                                <th className="text-right">Chiến dịch</th>
                                <th className="text-right">Nhóm quảng cáo</th>
                                <th className="text-right">Quảng cáo</th>
                                <th>Trạng thái</th>
                                <th>Cập nhật cuối</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc, idx) => (
                                <tr key={acc.id}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <div>{acc.name}</div>
                                        <div style={{ color: '#6b7280', fontSize: 12 }}>{acc.number}</div>
                                    </td>
                                    <td className="text-right">{acc.budget.toLocaleString()}</td>
                                    <td className="text-right">{acc.budget.toLocaleString()}</td>
                                    <td className="text-right">{acc.budget.toLocaleString()}</td>
                                    <td className="status-active">{acc.status}</td>
                                    <td>{acc.updatedAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>
        </div>
    )
}
export default AccountManagement
