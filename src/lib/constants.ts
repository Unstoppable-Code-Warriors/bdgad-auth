export const pathTitles: Record<string, string> = {
  users: "Quản lý tài khoản",
  roles: "Quản lý vai trò",
  settings: "Cài đặt",
};

export const userStatus: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
};

export const userRole: Record<string, string> = {
  "System Admin": "Quản trị viên hệ thống",
  Staff: "Nhân viên",
  "Lab Testing Technician": "Kỹ thuật viên xét nghiệm",
  "Validation Technician": "Kỹ thuật viên thẩm định",
  "Analysis Technician": "Kỹ thuật viên phân tích",
  Doctor: "Bác sĩ",
};

export const columnNames: Record<string, string> = {
  email: "Email",
  name: "Tên",
  roles: "Vai trò",
  phone: "Số điện thoại",
  address: "Địa chỉ",
  status: "Trạng thái",
  createdAt: "Ngày tạo",
  description: "Mô tả",
  Email: "Email",
  Name: "Tên",
  Role: "Vai trò",
  Phone: "Số điện thoại",
  Address: "Địa chỉ",
  Status: "Trạng thái",
  CreatedAt: "Ngày tạo",
};

export enum FetchLimit {
  USERS = 100,
  ROLES = 15,
}
