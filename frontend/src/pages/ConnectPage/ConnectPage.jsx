import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './ConnectPage.css'
import { useToast } from '../../hooks/useToast'
import profileService from '../../services/profileService'
import shopService from '../../services/shopService'
// import { handleSelectAllWithFilter, handleSelectItemWithFilter } from '../../utils/selectionUtils'

function ConnectPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [shopId, setShopId] = useState(null)
  const [connectedPageIds, setConnectedPageIds] = useState([])
  const [fbPages, setFbPages] = useState([])
  const [selectedPages, setSelectedPages] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('status')
  const [selectAll, setSelectAll] = useState(false)
  
  // Tải dữ liệu thật từ BE
  useEffect(() => {
    const load = async () => {
      try {
        const me = await profileService.getCurrentProfile()
        const shop = me?.data?.shop || me?.shop
        setShopId(shop?._id || null)
        const connected = Array.isArray(shop?.facebook_pages) ? shop.facebook_pages.filter(p => p.connected_status === 'connected').map(p => p.page_id) : []
        setConnectedPageIds(connected)

        const pagesRes = await shopService.fetchFacebookPages()
        const realPages = pagesRes?.data?.pages || []
        setFbPages(realPages)
      } catch (e) {
        console.error('Load facebook pages error:', e)
        toast.error('Không tải được danh sách page từ Facebook')
      }
    }
    load()
  }, [])

  // Chuẩn hóa dữ liệu page từ API
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
      avatar: p.picture || `https://graph.facebook.com/${p.id}/picture?type=square`,
      link: `https://www.facebook.com/${p.id}`,
      role: deriveRole(p.tasks),
      status: connectedPageIds.includes(p.id) ? 'Đã kết nối' : 'Chưa kết nối',
      connectedBy: null,
      isSelected: false,
      pageAccessToken: p.pageAccessToken,
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
  const handleConnectSelected = async () => {
    const selected = pages.filter(p => selectedPages.includes(p.id))
    if (selected.length === 0) return
    if (!shopId) {
      toast.error('Không xác định được shop hiện tại')
      return
    }
    try {
      // Kết nối lần lượt nhiều page
      for (const page of selected) {
        await shopService.connectFacebookPage({
          shopId,
          pageId: page.id,
          pageAccessToken: page.pageAccessToken,
        })
      }
      setConnectedPageIds(prev => Array.from(new Set([...prev, ...selected.map(p => p.id)])))
      toast.success(`Đã kết nối ${selected.length} page`)
      navigate('/dashboard')
    } catch (e) {
      console.error('Connect page error:', e)
      toast.error('Kết nối thất bại, vui lòng thử lại')
    }
  }

  //Xử lý làm mới kết nối
  const handleRefresh = async () => {
    try {
      const response = await shopService.refreshFacebookToken();
      if (response.success) {
        toast.success('Làm mới thành công!');
        // Reload pages after successful token refresh
        const pagesRes = await shopService.fetchFacebookPages();
        const realPages = pagesRes?.data?.pages || [];
        setFbPages(realPages);
      } else {
        toast.error(response.message || 'Không thể làm mới.');
      }
    } catch (error) {
      console.log('Refresh token error:', error);
      toast.error('Lỗi khi làm mới: ' + (error.message || 'Unknown error'));
    }
  };

  //Xử lý quay lại danh sách tài khoản Quảng cáo
  const handleBackToList = () => {
    navigate(-1)
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
            Về trang trước
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectPage
