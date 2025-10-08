import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './AccountManagement.css'

function AccountManagement() {
    const navigate = useNavigate()
    const { fbAdAccounts } = useAuth()
    const hasConnectedPages = useMemo(() => {
        try {
            const raw = localStorage.getItem('fb_connected_pages')
            const arr = raw ? JSON.parse(raw) : []
            return Array.isArray(arr) && arr.length > 0
        } catch {
            return false
        }
    }, [])
    
    const accounts = useMemo(() => {
        return (fbAdAccounts || []).map((acc, idx) => ({
            id: acc.id || idx,
            name: acc.name || 'Facebook Ad Account',
            number: acc.accountId,
            budget: Number(acc.amountSpent || 0),
            status: acc.status === 1 ? 'Hoạt động' : 'Không hoạt động',
            updatedAt: new Date(acc.createdTime || Date.now()).toLocaleString('vi-VN')
        }))
    }, [fbAdAccounts])

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
                                className="add-account"
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
                            {!hasConnectedPages ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280' }}>
                                        Vui lòng kết nối Fanpage trước khi hiển thị tài khoản quảng cáo.
                                    </td>
                                </tr>
                            ) : accounts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280' }}>
                                        Không tìm thấy tài khoản quảng cáo nào.
                                    </td>
                                </tr>
                            ) : (
                            accounts.map((acc, idx) => (
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
                            ))
                            )}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>
        </div>
    )
}
export default AccountManagement
