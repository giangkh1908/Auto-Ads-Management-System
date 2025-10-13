import { useEffect, useRef, useState } from 'react'

function AdsDropdown({ 
    onCopy, 
    onDelete, 
    onCreateAdset, 
    onCreateAd, 
    menuAlign = 'right', 
    triggerClassName = '' 
}) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    // 🔍 Xác định "type" tự động
    const type = onCreateAdset ? 'campaign' : onCreateAd ? 'adset' : 'ad'

    return (
        <div className="hierarchy-ads-dropdown" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                className={`actions-trigger ${open ? 'open' : ''} ${triggerClassName}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
            >
                ⋮
            </button>

            {open && (
                <div
                    className="actions-menu"
                    role="menu"
                    style={{
                        right: menuAlign === 'right' ? 0 : 'auto',
                        left: menuAlign === 'left' ? 0 : 'auto'
                    }}
                >
                    {/* Mục chung cho tất cả */}
                    <button className="actions-menu-item" onClick={() => { onCopy?.(); setOpen(false) }}>Sao chép</button>
                    <button className="actions-menu-item" onClick={() => { onDelete?.(); setOpen(false) }}>Xóa</button>

                    {/* Mục riêng */}
                    {type === 'campaign' && (
                        <button className="actions-menu-item" onClick={() => { onCreateAdset?.(); setOpen(false) }}>
                            Tạo nhóm quảng cáo
                        </button>
                    )}
                    {type === 'adset' && (
                        <button className="actions-menu-item" onClick={() => { onCreateAd?.(); setOpen(false) }}>
                            Tạo quảng cáo
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default AdsDropdown
