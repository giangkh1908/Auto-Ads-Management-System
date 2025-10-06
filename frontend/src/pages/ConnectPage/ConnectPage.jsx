import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './ConnectPage.css'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
// import { handleSelectAllWithFilter, handleSelectItemWithFilter } from '../../utils/selectionUtils'


function ConnectPage() {
  const navigate = useNavigate()
  const { fbPages } = useAuth()
  const toast = useToast()
  const [connectedPageIds, setConnectedPageIds] = useState(() => {
    try {
      const raw = localStorage.getItem('fb_connected_pages')
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr.map(p => p.id) : []
    } catch {
      return []
    }
  })
  const [selectedPages, setSelectedPages] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('status')
  const [selectAll, setSelectAll] = useState(false)
  
  // Chuẩn hóa dữ liệu page từ AuthContext
  const pages = useMemo(() => {
    const deriveRole = (tasks = []) => {
      const normalized = new Set((tasks || []).map(t => String(t).toUpperCase()))
      // Priority from highest to lowest
      if (normalized.has('ADMINISTER') || normalized.has('MANAGE')) return 'ADMIN'
      if (normalized.has('CREATE_CONTENT')) return 'EDITOR'
      if (normalized.has('MODERATE')) return 'MODERATOR'
      if (normalized.has('ADVERTISE')) return 'ADVERTISER'
      if (normalized.has('ANALYZE')) return 'ANALYST'
      return 'PAGE'
    }
    return (fbPages || []).map(p => ({
      id: p.id,
      name: p.name,
      avatar: `https://graph.facebook.com/${p.id}/picture?type=square`,
      link: `https://www.facebook.com/${p.id}`,
      role: deriveRole(p.tasks),
      status: connectedPageIds.includes(p.id) ? 'Đã kết nối' : 'Chưa kết nối',
      connectedBy: null,
      isSelected: false,
    }))
  }, [fbPages, connectedPageIds])

  //Đếm số page đã kết nối và còn lại
  const connectedCount = pages.filter(page => page.status === 'Đã kết nối').length
  const remainingCount = pages.length - connectedCount

  // Loại bỏ các page đã kết nối khỏi selectedPages
  useEffect(() => {
    setSelectedPages(prev => 
      prev.filter(pageId => {
        const page = pages.find(p => p.id === pageId)
        return page && page.status !== 'Đã kết nối'
      })
    )
  }, [pages])

  //Xử lý chọn page
  const handlePageSelect = (pageId) => {
    const page = pages.find(p => p.id === pageId)
    // Không cho phép chọn page đã kết nối
    if (page && page.status === 'Đã kết nối') {
      return
    }
    //Thêm page vào selectedPages
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    )
  }

  //Xử lý chọn tất cả
  const handleSelectAll = () => {
    const selectablePages = filteredPages.filter(page => page.status !== 'Đã kết nối')
    
    if (selectAll) {
      // Bỏ chọn tất cả
      setSelectedPages([])
    } else {
      // Chọn tất cả các page có thể chọn được
      setSelectedPages(selectablePages.map(page => page.id))
    }
  }

  //Xử lý kết nối các page đã chọn
  const handleConnectSelected = () => {
    const selected = pages.filter(p => selectedPages.includes(p.id))
    if (selected.length === 0) return
    try {
      // Lưu tạm các page đã kết nối (có thể thay bằng API trong tương lai)
      const existingRaw = localStorage.getItem('fb_connected_pages')
      const existing = existingRaw ? JSON.parse(existingRaw) : []
      const mergedMap = new Map()
      ;[...existing, ...selected].forEach(p => mergedMap.set(p.id, p))
      const merged = Array.from(mergedMap.values())
      localStorage.setItem('fb_connected_pages', JSON.stringify(merged))
      setConnectedPageIds(merged.map(p => p.id))
      toast.success(`Đã kết nối ${selected.length} page`)
      navigate('/account-management')
    } catch {
      toast.error('Không thể lưu kết nối, vui lòng thử lại')
    }
  }

  //Xử lý làm mới kết nối
  const handleRefresh = () => {
    // Logic làm mới kết nối
  }

  //Xử lý quay lại danh sách tài khoản Quảng cáo
  const handleBackToList = () => {
    navigate('/account-management')
  }

  //Lọc danh sách page theo tên và trạng thái
  const filteredPages = pages.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'status' || 
      (statusFilter === 'connected' && page.status === 'Đã kết nối') ||
      (statusFilter === 'not-connected' && page.status === 'Chưa kết nối')
    return matchesSearch && matchesStatus
  })

  // Cập nhật trạng thái selectAll khi selectedPages thay đổi
  useEffect(() => {
    const selectablePages = filteredPages.filter(page => page.status !== 'Đã kết nối')
    setSelectAll(selectablePages.length > 0 && selectedPages.length === selectablePages.length)
  }, [selectedPages, filteredPages])

  return (
    <div className="connect-page">
      <div className="connect-container">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">F</div>
            <span className="logo-text">AAMS</span>
          </div>
        </div>

        {/* Status Info */}
        <div className="status-info">
          Shop đã kết nối {connectedCount} pages, còn lại: {remainingCount} pages
        </div>

        {/* Page Management Section */}
        <div className="page-management-container">
          {pages.length === 0 ? (
            <div className="empty-state">
              <p>Không có Page nào để hiển thị. Hãy đăng nhập Facebook và cấp quyền phù hợp.</p>
            </div>
          ) : (
          <>
          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-section">
              <input 
                type="text" 
                className="search-input"
                placeholder="Tìm page"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Filter Section */}
            <div className="filter-section">
              <select 
                className="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="status">Trạng thái</option>
                <option value="connected">Đã kết nối</option>
                <option value="not-connected">Chưa kết nối</option>
              </select>
              <span className="page-count">{filteredPages.length} pages</span>
            </div>
            {/* Connect Button */}
            <div className="connect-section">
              <button 
                className="connect-selected-btn"
                onClick={handleConnectSelected}
                disabled={selectedPages.length === 0}
              >
                Kết nối {selectedPages.length}
              </button>
            </div>

          </div>

          {/* Page List Table */}
          <div className="page-list-table">
            <div className="table-header">
              <div className="col-page-name">Tên Page</div>
              <div className="col-role">Quyền</div>
              <div className="col-status">Trạng thái</div>
              <div className="col-select">
                <input 
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="select-all-checkbox"
                />
                {/* <span className="select-all-label">Chọn tất cả</span> */}
              </div>
            </div>
            
            {filteredPages.map((page) => (
              <div key={page.id} className="table-row">
                <div className="col-page-name">
                  <div className="page-info">
                    <img src={page.avatar} alt={page.name} className="page-avatar" />
                    <div className="page-details">
                        <div className="page-name">
                          {page.name}
                          <a 
                            href={page.link} className="external-link" target="_blank" rel="noopener noreferrer">
                            ↗
                          </a>
                        </div>
                    </div>
                  </div>
                </div>
                <div className="col-role">
                  <span className="role-badge">{page.role}</span>
                </div>
                <div className="col-status">
                  <div className="status-info">
                    <div className="status-text">{page.status}</div>
                    {page.connectedBy && (
                      <div className="connected-by">{page.connectedBy}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-select">
                  <input 
                    type="checkbox"
                    checked={selectedPages.includes(page.id)}
                    onChange={() => handlePageSelect(page.id)}
                    className="page-checkbox"
                    disabled={page.status === 'Đã kết nối'}
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
              disabled={selectedPages.length === 0}
            >
              Kết nối {selectedPages.length}
            </button>
          </div>
          </>
          )}
        </div>
            
        {/* Help Section */}
        <div className="help-section">
          <h3 className="help-title">Bạn không nhìn thấy Fanpage?</h3>
          <p className="help-text">
            Vui lòng làm mới quyền để cập nhật danh sách Page được phân quyền.
          </p>
          <button className="refresh-btn" onClick={handleRefresh}>
            <span className="refresh-icon">↻</span>
            LÀM MỚI KẾT NỐI
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
            Về danh sách tài khoản Quảng cáo
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectPage
