import { NavLink } from "react-router-dom";
import { ROUTES } from "../../constants/app.constants";
import "./Shop.css";

function History() {
  return (
    <div className="shop-border">
      <div className="shop-tabs">
        <NavLink end to={ROUTES.SHOP} className={({isActive}) => `shop-tab ${isActive ? 'active' : ''}`}>My Shop</NavLink>
        <NavLink to={ROUTES.SHOP_EMPLOYEE} className={({isActive}) => `shop-tab ${isActive ? 'active' : ''}`}>Employee</NavLink>
        <NavLink to={ROUTES.SHOP_HISTORY} className={({isActive}) => `shop-tab ${isActive ? 'active' : ''}`}>History</NavLink>
      </div>

      <div className="shop-page">
        <div className="shop-container">
          <div className="shop-content">
            <div className="placeholder-content">
              <p>Nội dung của tab History đang được phát triển...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;


