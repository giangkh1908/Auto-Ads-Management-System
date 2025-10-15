import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './ConnectAdAccount.css'
import { useToast } from '../../hooks/useToast'
import axiosInstance from '../../utils/axios'
import logo from "../../assets/Logo_Fchat.png";

function ConnectAdAccount() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [fbAdAccounts, setFbAdAccounts] = useState([])
  const [connectedAccountIds, setConnectedAccountIds] = useState([])
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('status')
  const [selectAll, setSelectAll] = useState(false)
  
  // Tải dữ liệu tài khoản quảng cáo từ Facebook API
  useEffect(() => {
    const loadAdAccounts = async () => {
      try {
        setLoading(true)
        
        // Lấy danh sách tài khoản quảng cáo đã kết nối từ database (đã connect)
        const connectedRes = await axiosInstance.get('/api/ads-accounts')
        const connectedAccounts = connectedRes.data?.items || []
        setConnectedAccountIds(connectedAccounts.map(acc => acc.external_id))

        // Lấy danh sách tài khoản quảng cáo trực tiếp từ Facebook (KHÔNG lưu DB)
        const fbRes = await axiosInstance.get('/api/ads-accounts/facebook')
        const fbAccounts = fbRes.data?.items || []
        setFbAdAccounts(fbAccounts)
      } catch (e) {
        console.error('Load ad accounts error:', e)
        toast.error('Không tải được danh sách tài khoản quảng cáo từ Facebook')
      } finally {
        setLoading(false)
      }
    }
    loadAdAccounts()
  }, [toast])

  // Chuẩn hóa dữ liệu tài khoản quảng cáo từ API
  const adAccounts = useMemo(() => {
    const getStatusLabel = (accountStatus) => {
      const status = Number(accountStatus)
      switch (status) {
        case 1: return 'Hoạt động'
        case 2: return 'Vô hiệu hóa'
        case 3: return 'Chưa xác minh'
        default: return 'Không hoạt động'
      }
    }

    return (fbAdAccounts || []).map(acc => ({
      id: acc.external_id || acc._id,
      name: acc.name || 'Facebook Ad Account',
      externalId: acc.external_id,
      currency: acc.currency || 'USD',
      timezone: acc.timezone_name || 'UTC',
      status: getStatusLabel(acc.account_status),
      isConnected: connectedAccountIds.includes(acc.external_id),
      isSelected: false,
      avatar: `https://graph.facebook.com/${acc.external_id}/picture?type=square`,
    }))
  }, [fbAdAccounts, connectedAccountIds])

  //Đếm số tài khoản đã kết nối và còn lại
  const connectedCount = adAccounts.filter(acc => acc.isConnected).length
  const remainingCount = adAccounts.length - connectedCount

  // Loại bỏ các tài khoản đã kết nối khỏi selectedAccounts
  useEffect(() => {
    setSelectedAccounts(prev => 
      prev.filter(accountId => {
        const account = adAccounts.find(acc => acc.id === accountId)
        return account && !account.isConnected
      })
    )
  }, [adAccounts])

  //Xử lý chọn tài khoản quảng cáo
  const handleAccountSelect = (accountId) => {
    const account = adAccounts.find(acc => acc.id === accountId)
    // Không cho phép chọn tài khoản đã kết nối
    if (account && account.isConnected) {
      return
    }
    //Thêm tài khoản vào selectedAccounts
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  //Xử lý chọn tất cả
  const handleSelectAll = () => {
    const selectableAccounts = filteredAccounts.filter(acc => !acc.isConnected)
    
    if (selectAll) {
      // Bỏ chọn tất cả
      setSelectedAccounts([])
    } else {
      // Chọn tất cả các tài khoản có thể chọn được
      setSelectedAccounts(selectableAccounts.map(acc => acc.id))
    }
  }

  //Xử lý kết nối các tài khoản quảng cáo đã chọn
  const handleConnectSelected = async () => {
    const selected = adAccounts.filter(acc => selectedAccounts.includes(acc.id))
    if (selected.length === 0) return
    
    try {
      setSyncing(true)
      // Chỉ khi bấm kết nối mới lưu tài khoản vào DB
      for (const acc of selected) {
        await axiosInstance.post('/api/ads-accounts/connect', { account_id: acc.externalId })
      }
      setConnectedAccountIds(prev => Array.from(new Set([...prev, ...selected.map(acc => acc.externalId)])))
      toast.success(`Đã kết nối ${selected.length} tài khoản quảng cáo`)
      navigate('/account-management')
    } catch (e) {
      console.error('Connect ad account error:', e)
      toast.error('Kết nối thất bại, vui lòng thử lại')
    } finally {
      setSyncing(false)
    }
  }

  //Xử lý làm mới kết nối
  const handleRefresh = async () => {
    try {
      setSyncing(true)
      // Làm mới danh sách tài khoản quảng cáo từ Facebook (KHÔNG lưu DB)
      const fbRes = await axiosInstance.get('/api/ads-accounts/facebook')
      const fbAccounts = fbRes.data?.items || []
      setFbAdAccounts(fbAccounts)
      toast.success('Làm mới danh sách tài khoản quảng cáo thành công!')
    } catch (error) {
      console.log('Refresh ad accounts error:', error)
      toast.error('Lỗi khi làm mới: ' + (error.message || 'Unknown error'))
    } finally {
      setSyncing(false)
    }
  };

  //Xử lý quay lại danh sách tài khoản Quảng cáo
  const handleBackToList = () => {
    navigate(-1)
  }

  //Lọc danh sách tài khoản quảng cáo theo tên và trạng thái
  const filteredAccounts = adAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.externalId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'status' || 
      (statusFilter === 'connected' && account.isConnected) ||
      (statusFilter === 'not-connected' && !account.isConnected)
    return matchesSearch && matchesStatus
  })

  // Cập nhật trạng thái selectAll khi selectedAccounts thay đổi
  useEffect(() => {
    const selectableAccounts = filteredAccounts.filter(account => !account.isConnected)
    setSelectAll(selectableAccounts.length > 0 && selectedAccounts.length === selectableAccounts.length)
  }, [selectedAccounts, filteredAccounts])

  return (
    <div className="connect-page">
      <div className="connect-container">
        {/* Logo */}
        <div className="logo-section">
        <div className="logo">
            <img className="logo-img" src={logo}></img>
          </div>
        </div>

        {/* Status Info */}
        <div className="status-info">
          Đã kết nối {connectedCount} tài khoản quảng cáo, còn lại: {remainingCount} tài khoản
        </div>

        {/* Ad Account Management Section */}
        <div className="page-management-container">
          {loading ? (
            <div className="empty-state">
              <p>Đang tải danh sách tài khoản quảng cáo...</p>
            </div>
          ) : adAccounts.length === 0 ? (
            <div className="empty-state">
              <p>Không có tài khoản quảng cáo nào để hiển thị. Hãy đăng nhập Facebook và cấp quyền quảng cáo.</p>
            </div>
          ) : (
          <>
          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-section">
              <input 
                type="text" 
                className="search-input"
                placeholder="Tìm tài khoản quảng cáo"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Filter Section */}
            <div className="filter-section-connect-account">
              <select 
                className="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="status">Trạng thái</option>
                <option value="connected">Đã kết nối</option>
                <option value="not-connected">Chưa kết nối</option>
              </select>
              <span className="page-count">{filteredAccounts.length} tài khoản</span>
            </div>
          </div>

          {/* Ad Account List Table */}
          <div className="page-list-table">
            <div className="table-header">
              <div className="col-page-name">Tên tài khoản</div>
              <div className="col-role">Trạng thái</div>
              <div className="col-status">Kết nối</div>
              <div className="col-select">
                <input 
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="select-all-checkbox"
                  disabled={
                    // Disable khi không còn tài khoản nào có thể chọn (chưa kết nối)
                    filteredAccounts.filter(account => !account.isConnected).length === 0
                  }
                />
                {/* <span className="select-all-label">Chọn tất cả</span> */}
              </div>
            </div>
            
            {filteredAccounts.map((account) => (
              <div key={account.id} className="table-row">
                <div className="col-page-name">
                  <div className="page-info">
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="page-avatar"
                    />
                    <div className="page-details">
                        <div className="page-name">
                          {account.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {account.externalId}
                        </div>
                    </div>
                  </div>
                </div>
                <div className="col-role">
                  <span className="role-badge">{account.status}</span>
                </div>
                <div className="col-status">
                  <div className="status-info">
                    <div className="status-text">
                      {account.isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                    </div>
                  </div>
                </div>
                
                <div className="col-select">
                  <input 
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => handleAccountSelect(account.id)}
                    className="page-checkbox"
                    disabled={account.isConnected}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Connect Button Bottom */}
          <div className="connect-bottom">
            <button 
              className="connect-selected-btn"
              onClick={handleConnectSelected}
              disabled={selectedAccounts.length === 0 || syncing}
            >
              {syncing ? 'Đang kết nối...' : `Kết nối ${selectedAccounts.length}`}
            </button>
          </div>
          </>
          )}
        </div>
            
        {/* Help Section */}
        <div className="help-section">
          <h3 className="help-title">Bạn không nhìn thấy tài khoản quảng cáo?</h3>
          <p className="help-text">
            Vui lòng làm mới để cập nhật danh sách tài khoản quảng cáo từ Facebook.
          </p>
          <button className="refresh-btn" onClick={handleRefresh} disabled={syncing}>
            <span className="refresh-icon">↻</span>
            {syncing ? 'ĐANG LÀM MỚI...' : 'LÀM MỚI DANH SÁCH'}
          </button>
        </div>

        {/* Contact Info
        <div className="contact-info">
          <p className="permission-text">
            Chúng tôi sẽ cần quyền ADMIN các Fanpages của bạn để kết nối với Chatbot.
          </p>
          <p className="contact-text">
            Mọi thắc mắc vui lòng liên hệ <strong>0898 986 008</strong> hoặc tham gia nhóm hỗ trợ <strong>Group Fchat</strong>
          </p>
        </div> */}

        {/* Back Button */}
        <div className="back-section">
          <button className="back-btn" onClick={handleBackToList}>
            <span className="back-icon">←</span>
            Về trang trước
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectAdAccount
