import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";

describe("user access", () => {
  it("allows users and administrators into authenticated pages", () => {
    expect(checkAccess({ userRole: ACCESS_ENUM.USER }, ACCESS_ENUM.USER)).toBe(
      true
    );
    expect(checkAccess({ userRole: ACCESS_ENUM.ADMIN }, ACCESS_ENUM.USER)).toBe(
      true
    );
  });

  it("does not treat banned users as authenticated users", () => {
    expect(checkAccess({ userRole: ACCESS_ENUM.BAN }, ACCESS_ENUM.USER)).toBe(
      false
    );
    expect(checkAccess({ userRole: ACCESS_ENUM.BAN }, ACCESS_ENUM.ADMIN)).toBe(
      false
    );
  });

  it("keeps administrator pages restricted to administrators", () => {
    expect(checkAccess({ userRole: ACCESS_ENUM.USER }, ACCESS_ENUM.ADMIN)).toBe(
      false
    );
    expect(
      checkAccess({ userRole: ACCESS_ENUM.ADMIN }, ACCESS_ENUM.ADMIN)
    ).toBe(true);
  });
});
