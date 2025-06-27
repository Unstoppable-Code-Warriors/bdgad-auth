import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "../controllers/authController";
import { db } from "../../db/drizzle";
import { users, roles, userRoles } from "../../db/schema";
import bcrypt from "bcryptjs";

// Mock the database and bcrypt
vi.mock("../../db/drizzle", () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    innerJoin: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe("Login Function", () => {
  const mockContext = {
    req: {
      valid: vi.fn(),
    },
    json: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock implementations
    mockContext.req.valid.mockReset();
    mockContext.json.mockReset();
    vi.mocked(db.select).mockReset();
    vi.mocked(bcrypt.compare).mockReset();
  });

  describe("Login validation", () => {
    it("should reject invalid email format 'abc'", async () => {
      mockContext.req.valid.mockReturnValue({
        email: "abc",
        password: "Password123!",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Invalid credentials" },
        401
      );
    });

    it("should accept valid email 'caoduchiep@gmail.com'", async () => {
      const mockUser = [
        {
          id: 1,
          email: "caoduchiep@gmail.com",
          password: "hashedPassword",
          status: "active",
          name: "Test User",
        },
      ];

      // Mock database chain
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUser),
      };
      (db.select as any).mockReturnValue(mockSelect);

      // Mock bcrypt
      (bcrypt.compare as any).mockResolvedValue(true);

      // Mock context
      mockContext.req.valid.mockReturnValue({
        email: "caoduchiep@gmail.com",
        password: "Password123!",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        }),
        expect.any(Number)
      );
    });

    it("should accept valid email 'pp072003@gmail.com'", async () => {
      const mockUser = [
        {
          id: 1,
          email: "pp072003@gmail.com",
          password: "hashedPassword",
          status: "active",
          name: "Test User",
        },
      ];

      // Mock database chain
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUser),
      };
      (db.select as any).mockReturnValue(mockSelect);

      // Mock bcrypt
      (bcrypt.compare as any).mockResolvedValue(true);

      // Mock context
      mockContext.req.valid.mockReturnValue({
        email: "pp072003@gmail.com",
        password: "Password123!",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        }),
        expect.any(Number)
      );
    });

    it("should reject email 'a@gmail.com' as it is not authenticated", async () => {
      // Mock database chain to return empty array
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      (db.select as any).mockReturnValue(mockSelect);

      mockContext.req.valid.mockReturnValue({
        email: "a@gmail.com",
        password: "Password123!",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Invalid credentials" },
        401
      );
    });

    it("should reject inactive account 'inactive@gmail.com'", async () => {
      const mockUser = [
        {
          id: 1,
          email: "inactive@gmail.com",
          password: "hashedPassword",
          status: "inactive",
          name: "Test User",
        },
      ];

      // Mock database chain
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUser),
      };
      (db.select as any).mockReturnValue(mockSelect);

      mockContext.req.valid.mockReturnValue({
        email: "inactive@gmail.com",
        password: "Password123!",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Account is not active" },
        401
      );
    });

    it("should accept email with 255 characters", async () => {
      const longEmail = "a".repeat(244) + "@gmail.com";
      const mockUser = [
        {
          id: 1,
          email: longEmail,
          password: "hashedPassword",
          status: "active",
          name: "Test User",
        },
      ];

      // Mock database chain
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUser),
      };
      (db.select as any).mockReturnValue(mockSelect);

      // Mock bcrypt
      (bcrypt.compare as any).mockResolvedValue(true);

      mockContext.req.valid.mockReturnValue({
        email: longEmail,
        password: "Password123!",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        }),
        expect.any(Number)
      );
    });

    it("should reject email with 256 characters", async () => {
      const longEmail = "a".repeat(245) + "@gmail.com";
      mockContext.req.valid.mockReturnValue({
        email: longEmail,
        password: "Password123!",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Invalid credentials" },
        401
      );
    });

    it("should reject null email", async () => {
      mockContext.req.valid.mockReturnValue({
        email: null,
        password: "Password123!",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Invalid credentials" },
        401
      );
    });

    it("should accept valid password with special characters '#!#^&FGAvas123'", async () => {
      const mockUser = [
        {
          id: 1,
          email: "caoduchiep@gmail.com",
          password: "hashedPassword",
          status: "active",
          name: "Test User",
        },
      ];

      // Mock database chain
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUser),
      };
      (db.select as any).mockReturnValue(mockSelect);

      // Mock bcrypt
      (bcrypt.compare as any).mockResolvedValue(true);

      mockContext.req.valid.mockReturnValue({
        email: "caoduchiep@gmail.com",
        password: "#!#^&FGAvas123",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        }),
        expect.any(Number)
      );
    });

    it("should accept valid long password", async () => {
      const mockUser = [
        {
          id: 1,
          email: "caoduchiep@gmail.com",
          password: "hashedPassword",
          status: "active",
          name: "Test User",
        },
      ];

      // Mock database chain
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUser),
      };
      (db.select as any).mockReturnValue(mockSelect);

      // Mock bcrypt
      (bcrypt.compare as any).mockResolvedValue(true);

      mockContext.req.valid.mockReturnValue({
        email: "caoduchiep@gmail.com",
        password: "xbrtwqpnvsychjzmoilkgfudexanrmqtlvbczkeuyxasjhfdg",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        }),
        expect.any(Number)
      );
    });

    it("should reject short password '123'", async () => {
      mockContext.req.valid.mockReturnValue({
        email: "caoduchiep@gmail.com",
        password: "123",
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Invalid credentials" },
        401
      );
    });

    it("should reject null password", async () => {
      mockContext.req.valid.mockReturnValue({
        email: "caoduchiep@gmail.com",
        password: null,
      });

      await login(mockContext as any);
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Invalid credentials" },
        401
      );
    });
  });
});
