import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Plus, Edit, Play, Pause, Hand } from "lucide-react";
import { ROUTES } from "../../constants/app.constants";
import "./Shop.css";

function Employee() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const loadShops = async () => {
      try {
        setLoading(true);
        // Mock data - thay thế bằng API call thực tế
        const mockEmployees = [
          {
            id: 1,
            name: "User_1",
            email: "user1@gmail.com",
            page: 1,
            role: "Admin",
            status: "Active",
          },
          {
            id: 2,
            name: "User_2",
            email: "user2@gmail.com",
            page: 2,
            role: "Manager",
            status: "Inactive",
          },
          {
            id: 3,
            name: "User_3",
            email: "user3@gmail.com",
            page: 3,
            role: "Saler",
            status: "Active",
          },
        ];
        setEmployees(mockEmployees);
      } catch (e) {
        console.error("Load shops error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadShops();
  }, []);

  //Hành động với page
  const handleAction = (shopId, action) => {
    console.log(`Action ${action} for shop ${shopId}`);
  };

  //Thêm page mới
  const handleAddNewPage = () => {
    // setIsAddOpen(true);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesEmail = emp.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesRole = roleFilter === 'all' ? true : emp.role.toLowerCase() === roleFilter;
    return matchesEmail && matchesRole;
  });

  return (
    <div className="shop-border">
      {/* Tabs/end để active đúng tại shop, ko ăn vào cái khác */}
      <div className="shop-tabs">
        <NavLink end to={ROUTES.SHOP} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>My Shop</NavLink>
        <NavLink to={ROUTES.SHOP_EMPLOYEE} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>Employee</NavLink>
        <NavLink to={ROUTES.SHOP_HISTORY} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>History</NavLink>
      </div>

      <div className="shop-page">

        {/* Filters + Add */}
        <div className="top-table-employee">
          <div className="employee-filters">
            <input
              type="text"
              className="filter-input"
              placeholder="Search email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <select
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="saler">Saler</option>
            </select>
          </div>

          <button className="btn-add-new-page" onClick={handleAddNewPage}>
            <Plus size={16} />
            Add New Employee
          </button>
        </div>

        {/* Table  */}
        <div className="shop-container">
          <div className="shop-content">
            {loading ? (
              <div className="loading-state">
                <p>Loading employees...</p>
              </div>
            ) : (
              <div className="shops-table">
                <div className="table-header-employee">
                  <div className="table-cell">Name</div>
                  <div className="table-cell">Email</div>
                  <div className="table-cell">Page</div>
                  <div className="table-cell">Role</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Action</div>
                </div>

                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="table-row-employee">
                    <div className="table-cell" data-label="Name">
                      <div className="shop-name">
                        <div className="shop-avatar">
                          {employee.name.charAt(0)}
                        </div>
                        <span>{employee.name}</span>
                      </div>
                    </div>
                    <div className="table-cell" data-label="Email">
                      <span>{employee.email}</span>
                    </div>
                    <div className="table-cell" data-label="Page">
                      <span className="employee-count">{employee.page}</span>
                    </div>
                    <div className="table-cell" data-label="Role">
                      <span className="role-badge">{employee.role}</span>
                    </div>
                    <div className="table-cell" data-label="Status">
                      <span
                        className={`status-badge status-${employee.status.toLowerCase()}`}
                      >
                        {employee.status}
                      </span>
                    </div>
                    <div className="table-cell" data-label="Action">
                      <div className="action-buttons">
                        <button
                          className="shop-action-btn shop-update-btn"
                          onClick={() => handleAction(employee.id, "update")}
                          title="Update"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="shop-action-btn shop-activate-btn"
                          onClick={() => handleAction(employee.id, "activate")}
                          title="Activate"
                        >
                          <Play size={14} />
                        </button>
                        <button
                          className="shop-action-btn shop-deactivate-btn"
                          onClick={() => handleAction(employee.id, "deactivate")}
                          title="Deactivate"
                        >
                          <Pause size={14} />
                        </button>
                        <button
                          className="shop-action-btn shop-upgrade-btn"
                          onClick={() => handleAction(employee.id, "relinquish")}
                          title="Relinquish"
                        >
                          <Hand size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Employee;
