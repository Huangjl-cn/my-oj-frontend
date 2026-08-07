import ACCESS_ENUM from "@/access/accessEnum";
import { formatUserRole } from "@/utils/userRole";

describe("formatUserRole", () => {
  it.each([
    [ACCESS_ENUM.ADMIN, "管理员"],
    [ACCESS_ENUM.USER, "用户"],
    [ACCESS_ENUM.BAN, ACCESS_ENUM.BAN],
    [undefined, "--"],
  ])("formats %p as %s", (role, expected) => {
    expect(formatUserRole(role)).toBe(expected);
  });
});
