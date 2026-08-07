import ACCESS_ENUM from "@/access/accessEnum";

export const formatUserRole = (role?: string) => {
  if (role === ACCESS_ENUM.ADMIN) return "管理员";
  if (role === ACCESS_ENUM.USER) return "用户";
  return role || "--";
};
