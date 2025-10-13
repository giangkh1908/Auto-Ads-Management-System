import { useState, useEffect, useMemo } from 'react'
import './AdsManagement.css'
import CreateAdsWizard from '../../components/feature/CreateAdsWizard/CreateAdsWizard'
import { handleSelectAll, handleSelectItem } from '../../utils/selectionUtils'

function AdsManagement() {
  const [activeTab, setActiveTab] = useState('campaigns')
  const [showWizard, setShowWizard] = useState(false)

  const [adAccounts, setAdAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')

  const [campaigns, setCampaigns] = useState([])
  const [adsets, setAdsets] = useState([])
  const [ads, setAds] = useState([])

  const [checkAll, setCheckAll] = useState(false)

  // Bộ lọc thời gian
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const API_BASE = 'http://localhost:5001/api'

  // 🔹 Chuẩn hoá 1 campaign để hiển thị bảng
  const normalizeCampaign = (c) => ({
    _id: c._id,
    name: c.name,
    statusText: c.status === 'ACTIVE' ? 'Hoạt động' : 'Đang tắt',
    status: c.status || 'PAUSED',
    daily_budget: c.daily_budget || 0,
    impressions: c.impressions || 0,
    reach: c.reach || 0,
    enabled: c.status === 'ACTIVE',
    isChecked: false,
  })

  // 🔹 Lấy danh sách AdsAccount khi vào trang
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token =
          localStorage.getItem('accessToken') ||
          localStorage.getItem('auth_token') ||
          localStorage.getItem('token')

        if (!token) {
          console.warn('⚠️ Không tìm thấy token trong localStorage')
          return
        }

        const headers = { Authorization: `Bearer ${token}` }
        const accRes = await fetch(`${API_BASE}/ads-accounts`, { headers })
        const accJson = await accRes.json()
        setAdAccounts(accJson?.items || [])
      } catch (err) {
        console.error('❌ Fetch error (ads-accounts):', err)
      }
    }

    fetchAccounts()
  }, [])

  // 🔹 Đồng bộ Campaign khi chọn tài khoản quảng cáo
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!selectedAccount) return
      try {
        const token =
          localStorage.getItem('accessToken') ||
          localStorage.getItem('auth_token') ||
          localStorage.getItem('token')
        if (!token) return

        const headers = { Authorization: `Bearer ${token}` }

        console.log(`🔄 Đồng bộ campaign cho account: ${selectedAccount}`)
        const res = await fetch(
          `${API_BASE}/ads-campaigns/sync?ad_account_id=${selectedAccount}`,
          { headers }
        )
        const json = await res.json()

        if (!json.success) {
          console.warn('⚠️ Sync campaign thất bại:', json.message)
          return
        }

        const list = (json.data || []).map(normalizeCampaign)
        setCampaigns(list)
        console.log(`✅ Đã đồng bộ ${list.length} campaign.`)
      } catch (err) {
        console.error('❌ Fetch campaigns error:', err)
      }
    }
    return [];
  };

    fetchCampaigns()
  }, [selectedAccount])

  // 🔹 Lọc campaign theo khoảng thời gian
  const handleFilterByDate = async () => {
    if (!selectedAccount || !startDate || !endDate) return

    try {
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token')

      const headers = { Authorization: `Bearer ${token}` }

      console.log(`🔍 Lọc campaign từ ${startDate} đến ${endDate}`)
      const res = await fetch(
        `${API_BASE}/ads-campaigns?account_id=${selectedAccount}&start_date=${startDate}&end_date=${endDate}`,
        { headers }
      )

      const json = await res.json()
      const list = (json.items || json.data || []).map(normalizeCampaign)
      setCampaigns(list)
      console.log(`✅ Lọc được ${list.length} campaign.`)
    } catch (err) {
      console.error('❌ Filter campaigns error:', err)
    }
  }

  // 🔹 Lấy danh sách hiển thị theo tab
  const rows = useMemo(() => {
    if (activeTab === 'campaigns') return campaigns
    if (activeTab === 'adsets') return adsets
    return ads
  }, [activeTab, campaigns, adsets, ads])

  // 🔹 Cập nhật danh sách theo tab
  const updateRows = (updater) => {
    if (activeTab === 'campaigns') setCampaigns((prev) => updater(prev))
    else if (activeTab === 'adsets') setAdsets((prev) => updater(prev))
    else setAds((prev) => updater(prev))
  }

  // 🔹 Toggle bật/tắt
  const toggleRow = (id) => {
    updateRows((prev) =>
      prev.map((r) =>
        (r._id || r.id) === id
          ? {
              ...r,
              enabled: !r.enabled,
              status: r.enabled ? 'PAUSED' : 'ACTIVE',
              statusText: r.enabled ? 'Đang tắt' : 'Hoạt động',
            }
          : r
      )
    )
  }

  // 🔹 Chọn tất cả
  const handleCheckAll = (e) => {
    const isChecked = e.target.checked
    setCheckAll(isChecked)
    updateRows((prev) => handleSelectAll(isChecked, prev))
  }

  // 🔹 Chọn đơn lẻ
  const handleCheckItem = (id) => {
    updateRows((prev) => {
      const { updatedItems, allChecked } = handleSelectItem(id, prev.map((x) => ({ ...x })))
      setCheckAll(allChecked)
      return updatedItems
    })
  }

  return (
    <div className="ads-management-layout">
      <div className="ads-management-content">
        <div className="ads-management-center">
          <div className="ads-card">
            {/* Toolbar */}
            <div className="ads-toolbar">
              <div className="account-select">
                <div className="selectors">
                  {/* Ad Account selector */}
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    <option value="">-- Chọn tài khoản quảng cáo --</option>
                    {adAccounts.map((a) => (
                      <option key={a.external_id} value={a.external_id}>
                        {a.name} ({a.external_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Create button */}
              <button
                className="btn-create"
                disabled={!selectedAccount}
                onClick={() => setShowWizard(true)}
              >
                + Tạo chiến dịch
              </button>

              {/* Bộ lọc thời gian */}
              <div className="filters">
                <span>Từ</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span>đến</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <button
                  className="btn-filter"
                  onClick={handleFilterByDate}
                  disabled={!startDate || !endDate || !selectedAccount}
                >
                  Tìm
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="ads-tabs">
              {['campaigns', 'adsets', 'ads'].map((tab) => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab)
                    setCheckAll(false)
                  }}
                >
                  <span className="tab-icon">
                    {tab === 'campaigns' ? '▦' : tab === 'adsets' ? '▣' : '▥'}
                  </span>
                  {tab === 'campaigns'
                    ? 'Chiến dịch'
                    : tab === 'adsets'
                    ? 'Nhóm quảng cáo'
                    : 'Quảng cáo'}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="ads-table-wrapper">
              <table className="ads-table">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" checked={checkAll} onChange={handleCheckAll} />
                    </th>
                    <th>Tắt/Bật</th>
                    <th>Tên</th>
                    <th>Trạng thái</th>
                    <th>Ngân sách</th>
                    <th>Lượt hiển thị</th>
                    <th>Người tiếp cận</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const id = row._id || row.id
                      return (
                        <tr key={id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.isChecked || false}
                              onChange={() => handleCheckItem(id)}
                            />
                          </td>
                          <td>
                            <button
                              className={`switch ${row.enabled ? 'on' : 'off'}`}
                              onClick={() => toggleRow(id)}
                            />
                          </td>
                          <td>{row.name}</td>
                          <td className={row.enabled ? 'status-active' : 'status-inactive'}>
                            {row.statusText}
                          </td>
                          <td className="text-center">
                            {(row.daily_budget || 0).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="text-right">
                            {(row.impressions || 0).toLocaleString('vi-VN')}
                          </td>
                          <td className="text-right">
                            {(row.reach || 0).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Wizard */}
      {showWizard && (
        <CreateAdsWizard
          onClose={() => setShowWizard(false)}
          selectedAccount={selectedAccount}
          onCreated={(newCampaign) =>
            setCampaigns((prev) => [normalizeCampaign(newCampaign), ...prev])
          }
        />
      )}
    </div>
  )
}

export default AdsManagement
